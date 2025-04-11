import { _decorator, Component, Node } from 'cc';
import { Coin } from './Coin';
const { ccclass, property } = _decorator;

@ccclass('TargetView')
export class TargetView extends Component {
    private static _instance: TargetView = null;

    public static get instance() {
        return TargetView._instance;
    }

    @property(Node)
    coinNode: Node = null;

    public setTarget(num: number) {
        this.coinNode.getComponent(Coin).setCoinNumber(num);
    }

    protected onLoad(): void {
        TargetView._instance = this;
    }
}
