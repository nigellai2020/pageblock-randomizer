import { BigNumber } from "@ijstech/eth-wallet";

const DRandAPI = 'https://drand.cloudflare.com/public/'
async function hash(value: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  return await window.crypto.subtle.digest("SHA-256", data);
}

async function mapRandomNumberToNumbers(seed: string, numberOfValues: number, from: number, to: number) {
  const range = new BigNumber(to).minus(new BigNumber(from)).plus(1);
  const partSize = range.idiv(numberOfValues);
  const parts: string[] = [];

  for (let i = 0; i < numberOfValues; i++) {
    const start = new BigNumber(from).plus(partSize.times(i));
    const end = start.plus(partSize).minus(1);
    const value = `${start.toFixed()},${end.toFixed()},${seed}`;
    const hashedValue = await hash(value);
    const bigNumber = new BigNumber('0x' + [...new Uint8Array(hashedValue)].map(x => x.toString(16).padStart(2, '0')).join(''));
    const mappedNumber = start.plus(bigNumber.mod(partSize));
    parts.push(mappedNumber.toFixed());
  }

  return parts;
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