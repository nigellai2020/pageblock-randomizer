import {
  Module,
  customModule,
  VStack,
  Label,
  HStack,
  GridLayout,
  moment
} from "@ijstech/components";
import { IConfig, PageBlock } from "@pageblock-randomizer/global";
import './index.css';
import { getRoundByReleaseTime, getRandomizerResult } from "./utils";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ["i-randomizer"]: RandomizerBlock;
    }
  }
}


@customModule
export class RandomizerBlock extends Module implements PageBlock {
  private _oldData: IConfig = {};
  private _data: IConfig = {};
  private lbRound: Label;
  private gridResults: GridLayout;
  private hstackReleaseTime: HStack;
  private hstackCountdown: HStack;
  private lbReleaseTime: Label;
  private hstackResult: HStack;
  private lbReleasedDays: Label;
  private lbReleasedHours: Label;
  private lbReleasedMins: Label;
  private timer: any;

  async init() {
    super.init();
  }

  async getData() {
    return this._data;
  }

  async setData(value: IConfig) {
    console.log("set data");
    this._data = value;
    if (this._data.releaseTime) {
      this._data.releaseUTCTime = moment(Number(this._data.releaseTime)).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    }
    if (!this._data.round) {
      this._data.round = await getRoundByReleaseTime(Number(this._data.releaseTime));
    }
    await this.refreshApp();
  }

  async refreshApp() {
    this.lbRound.caption = this._data.round.toString();
    
    this.gridResults.clearInnerHTML();
    if (Number(this._data.releaseTime) > new Date().getTime()) {
      this.hstackResult.visible = false;
      this.hstackReleaseTime.visible = true;
      this.hstackCountdown.visible = true;
      this.lbReleaseTime.caption = moment(Number(this._data.releaseTime)).format('YYYY-MM-DD HH:mm');
      if (this.timer) {
        clearInterval(this.timer);
      }
      const refreshCountdown = () => {
        const days = moment(Number(this._data.releaseTime)).diff(moment(), 'days');
        const hours = moment(Number(this._data.releaseTime)).diff(moment(), 'hours') - days * 24;
        const mins = moment(Number(this._data.releaseTime)).diff(moment(), 'minutes') - days * 24 * 60 - hours * 60;
        this.lbReleasedDays.caption = days.toString();
        this.lbReleasedHours.caption = hours.toString();
        this.lbReleasedMins.caption = mins.toString();
      }
      refreshCountdown();
      this.timer = setInterval(refreshCountdown, 60000);
    }
    else {
      this.hstackResult.visible = true;
      this.hstackReleaseTime.visible = false;
      this.hstackCountdown.visible = false;
      const result = await getRandomizerResult(this._data.round, this._data.numberOfValues, this._data.from, this._data.to);
      for (let value of result) {
        let label = await Label.create({
          class: 'random-number',
          display: 'inline-block',
          font: { size: '1.2rem' },
          border: {radius: '0.5rem'}, 
          background: {color: '#E75B66'},
          padding: { top: '0.5rem', bottom: '0.5rem', left: '0.5rem', right: '0.5rem'},
          caption: value
        })
        this.gridResults.append(label)
      }
    }
  }

  getTag() {
    return this.tag;
  }

  async setTag(value: any) {
    this.tag = value;
  }

  getActions() {
    const actions = [
      {
        name: 'Settings',
        icon: 'cog',
        command: (builder: any, userInputData: any) => {
          return {
            execute: async () => {
              this._oldData = this._data;
              if (userInputData.releaseUTCTime != undefined) {
                this._data.releaseUTCTime = userInputData.releaseUTCTime;
                this._data.releaseTime = moment.utc(this._data.releaseUTCTime).valueOf().toString();
              }
              if (userInputData.releaseTime != undefined) {
                this._data.releaseTime = userInputData.releaseTime;
                this._data.releaseUTCTime = moment(Number(this._data.releaseTime)).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
              }
              if (userInputData.numberOfValues != undefined) this._data.numberOfValues = userInputData.numberOfValues;
              if (userInputData.from != undefined) this._data.from = userInputData.from;
              if (userInputData.to != undefined) this._data.to = userInputData.to;
              this._data.round = await getRoundByReleaseTime(Number(this._data.releaseTime));
              await this.refreshApp();
            },
            undo: () => {
              this._data = this._oldData;
            },
            redo: () => {}
          }
        },
        userInputDataSchema: {
          type: 'object',
          properties: {     
            "releaseUTCTime": {
              type: "string",
              format: "date-time"
            },               
            // "releaseTime": {
            //   type: "string",
            //   format: "date-time"
            // },
            "numberOfValues": {
              type: 'number'
            },
            "from": {
              type: 'number'
            },
            "to": {
              type: 'number'
            }
          }
        }
      },
    ]
    return actions
  }

  render() {
    const paddingTimeUnit = { top: '0.5rem', bottom: '0.5rem', left: '0.5rem', right: '0.5rem'};
    return (
      <i-panel>
        <i-vstack id="pnlRandomizerMain" background={{color: '#DBDBDB'}} padding={{ top: '1rem', bottom: '1rem', left: '1rem', right: '1rem'}}>
          <i-hstack gap='0.25rem' visible={false} id="hstackReleaseTime">
            <i-label caption="Result will be released on " font={{ size: '1.2rem'}}></i-label>
            <i-label id="lbReleaseTime" font={{ size: '1.2rem', weight: 'bold'}}></i-label>
          </i-hstack>          
          <i-hstack gap='0.25rem'>
            <i-label caption="Reference Round Number:" font={{ size: '1.2rem'}}></i-label>
            <i-label id="lbRound" font={{ size: '1.2rem', weight: 'bold'}}></i-label>
          </i-hstack>
          <i-hstack gap='0.25rem' visible={false} id="hstackCountdown">
            <i-vstack>
              <i-label caption="Time until the result is released:" font={{ size: '1.2rem'}}/>
              <i-hstack margin={{ top: 4 }} gap='0.5rem' verticalAlignment="center">
                <i-label id="lbReleasedDays" border={{radius: '0.5rem'}} padding={paddingTimeUnit} background={{color: '#E75B66'}} font={{ size: '1.2rem', weight: 'bold'}}></i-label>
                <i-label caption="D" font={{ size: '1.2rem', weight: 'bold'}}/>
                <i-label id="lbReleasedHours" border={{radius: '0.5rem'}} padding={paddingTimeUnit} background={{color: '#E75B66'}} font={{ size: '1.2rem', weight: 'bold'}}></i-label>
                <i-label caption="H" font={{ size: '1.2rem', weight: 'bold'}}/>
                <i-label id="lbReleasedMins" border={{radius: '0.5rem'}} padding={paddingTimeUnit} background={{color: '#E75B66'}} font={{ size: '1.2rem', weight: 'bold'}}></i-label>
                <i-label caption="M" font={{ size: '1.2rem', weight: 'bold'}}/>
              </i-hstack>
            </i-vstack>
          </i-hstack>
          <i-hstack gap='0.25rem' visible={false} id="hstackResult">
            <i-label caption="Result:" font={{ size: '1.2rem'}}></i-label>
            <i-grid-layout id={"gridResults"} columnsPerRow={15} gap={{ row: '1rem', column: '1rem' }}>
            </i-grid-layout>
          </i-hstack>
        </i-vstack>
      </i-panel>
    );
  }
}
