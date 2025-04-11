import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { Coin } from './Coin';
const { ccclass, property } = _decorator;

@ccclass('ProgressItem')
export class ProgressItem extends Component {
    @property(SpriteFrame)
    itemBgs: SpriteFrame[] = [];

    @property(Sprite)
    itemBg: Sprite = null;

    @property(Node)
    coinNode: Node = null;

    public setNumber(num: number) {
        this.coinNode.getComponent(Coin).setCoinNumber(num);
    }

    public active() {
        this.itemBg.spriteFrame = this.itemBgs[1];
    }

    public inactive() {
        this.itemBg.spriteFrame = this.itemBgs[0];
    }

    public done() {
        this.coinNode.getComponent(Coin).showColor();
    }

    public undone() {
        this.coinNode.getComponent(Coin).hideColor();
    }
}
