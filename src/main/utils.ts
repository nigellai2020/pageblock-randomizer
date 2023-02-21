import { BigNumber } from "@ijstech/eth-wallet";

const DRandAPI = 'https://drand.cloudflare.com/public/'
async function hash(value: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  return await window.crypto.subtle.digest("SHA-256", data);
}

async function mapRandomNumberToNumbers(hexString: string, numberOfValues: number, from: number, to: number) {
  const parts: string[] = [];
  const range = new BigNumber(to).minus(new BigNumber(from)).plus(1);
  if (range.lt(numberOfValues)) {
    return [];
  }

  const maxRandomValue = new BigNumber(2).pow(256).minus(1);
  const rejectionThreshold = maxRandomValue.idiv(range).times(range);
  let count = 0;
  while (parts.length < numberOfValues) {
    let randNum = new BigNumber(0);
    const seed = `${count},${hexString}`;
    const hashedValue = await hash(seed);
    randNum = new BigNumber('0x' + [...new Uint8Array(hashedValue)].map(x => x.toString(16).padStart(2, '0')).join(''));
    if (randNum.lt(rejectionThreshold)) {
      randNum = randNum.mod(range);
      const value = new BigNumber(from).plus(randNum).toFixed();
      if (!parts.includes(value)) {
        parts.push(value);
      }
    }
    count++;
  }

  return parts.sort((a, b) => new BigNumber(a).minus(b).toNumber());
}

async function getResult(round: string, numberOfValues: number, from: number, to: number) {
  const drandResponse = await fetch(`${DRandAPI}${round}`);
  const drandResult = await drandResponse.json();
  const hexString = drandResult.randomness;
  const finalResult = await mapRandomNumberToNumbers(hexString, numberOfValues, from, to);
  console.log('finalResult', finalResult);
  return finalResult;
}

export {
  getResult
}