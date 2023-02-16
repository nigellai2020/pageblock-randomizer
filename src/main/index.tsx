import {
  Module,
  customModule,
  VStack,
  Label,
  HStack,
  GridLayout
} from "@ijstech/components";
import { IConfig, PageBlock } from "@pageblock-randomizer/global";
import './index.css';
import { getResult } from "./utils";

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

  async init() {
    super.init();
  }

  async getData() {
    return this._data;
  }

  async setData(value: IConfig) {
    console.log("set data");
    this._data = value;
    await this.refreshApp();
  }

  async refreshApp() {
    this.lbRound.caption = this._data.round;
    const result = await getResult(this._data.round, this._data.numberOfValues, this._data.from, this._data.to);
    this.gridResults.clearInnerHTML();
    for (let value of result) {
      let label = await Label.create({
        display: 'inline-block',
        font: { size: '0.875rem' },
        width: '2rem',
        height: '2rem',
        caption: value,
        margin: { right: '0.5rem' }
      })
      this.gridResults.append(label)
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
              if (userInputData.round != undefined) this._data.round = userInputData.round;
              if (userInputData.numberOfValues != undefined) this._data.numberOfValues = userInputData.numberOfValues;
              if (userInputData.from != undefined) this._data.from = userInputData.from;
              if (userInputData.to != undefined) this._data.to = userInputData.to;
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
            "round": {
              type: 'string'
            },
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
    return (
      <i-panel>
        <i-vstack id="pnlMain" background={{color: '#FFC107'}}>
          <i-hstack gap='0.25rem'>
            <i-label caption="Round:" font={{ size: '0.875rem'}}></i-label>
            <i-label id="lbRound" font={{ size: '0.875rem'}}></i-label>
          </i-hstack>
            <i-hstack gap='0.25rem'>
            <i-label caption="Result:" font={{ size: '0.875rem'}}></i-label>
            <i-grid-layout id={"gridResults"} columnsPerRow={10} >
            </i-grid-layout>
          </i-hstack>
        </i-vstack>
      </i-panel>
    );
  }
}
