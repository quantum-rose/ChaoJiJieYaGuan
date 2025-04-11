import { _decorator, Component, Node } from 'cc';
import { DataManager } from '../manager/DataManager';
import { ProgressItem } from './ProgressItem';
import { TargetView } from './TargetView';
const { ccclass, property } = _decorator;

@ccclass('ProgressView')
export class ProgressView extends Component {
    private static _instance: ProgressView = null;

    public static get instance() {
        return ProgressView._instance;
    }

    @property(ProgressItem)
    stepItems: ProgressItem[] = [];

    @property(Node)
    crown: Node = null;

    @property(Node)
    light: Node = null;

    private nums: number[] = [];

    private _currentIndex: number = 0;

    public get currentIndex() {
        return this._currentIndex;
    }

    public getStepItem(index: number): Node {
        if (this.stepItems.length > index) {
            return this.stepItems[index].node;
        }
        return null;
    }

    public getMinStepNum() {
        return this.nums[0];
    }

    public getMaxStepNum() {
        return this.nums[this.nums.length - 1];
    }

    public getCurrentStepNum() {
        return this.nums[this._currentIndex];
    }

    public reset() {
        this._currentIndex = 0;

        const level = DataManager.getLevel();
        const start = level * 6 - 1;
        this.nums = [start, start + 1, start + 2, start + 4, start + 5];
        for (let i = 0; i < this.stepItems.length; i++) {
            const item = this.stepItems[i];
            item.setNumber(this.nums[i]);
            item.undone();
            item.inactive();
        }
        this.stepItems[0].active();

        TargetView.instance.setTarget(this.nums[0]);
    }

    public nextStep() {
        this._currentIndex++;

        for (let i = 0; i < this.stepItems.length; i++) {
            const item = this.stepItems[i];
            if (i === this._currentIndex) {
                item.active();
            } else {
                item.inactive();
            }

            if (i < this._currentIndex) {
                item.done();
            } else {
                item.undone();
            }
        }

        TargetView.instance.setTarget(this.nums[this._currentIndex]);
    }

    protected onLoad(): void {
        ProgressView._instance = this;
    }
}
