import { _decorator, Component, instantiate, Label, Node, Sprite, SpriteFrame, tween, Tween, Vec3 } from 'cc';
import { PrefabManager } from '../manager/PrefabManager';
const { ccclass, property } = _decorator;

@ccclass('Coin')
export class Coin extends Component {
    public static createCoin(coinNumber: number): Coin {
        const coinNode = instantiate(PrefabManager.getPrefab('Coin'));
        const coin = coinNode.getComponent(Coin);
        coin.setCoinNumber(coinNumber);
        return coin;
    }

    @property(SpriteFrame)
    coinGray: SpriteFrame = null;

    @property(SpriteFrame)
    coinSprites: SpriteFrame[] = [];

    @property(Sprite)
    coinSprite: Sprite = null;

    @property(Label)
    numberLabel: Label = null;

    public number: number = 0;

    public staticYPos: number = 0;

    public chosenAni: Tween<Node> = null;

    public setCoinNumber(num: number) {
        this.number = num;
        this.numberLabel.string = num.toString();
        this.coinSprite.spriteFrame = this.coinSprites[(num - 1) % this.coinSprites.length];
    }

    public showColor() {
        this.coinSprite.spriteFrame = this.coinSprites[(this.number - 1) % this.coinSprites.length];
    }

    public hideColor() {
        this.coinSprite.spriteFrame = this.coinGray;
    }

    public playChosenAni() {
        const embedTween = tween(this.node)
            .to(0.5, { position: new Vec3(0, this.staticYPos + 9, 0) }, { easing: 'sineInOut' })
            .to(0.5, { position: new Vec3(0, this.staticYPos + 18, 0) }, { easing: 'sineInOut' });

        this.chosenAni = tween(this.node)
            .to(0.15, { position: new Vec3(0, this.staticYPos + 18, 0) }, { easing: 'sineInOut' })
            .repeatForever(embedTween)
            .start();
    }

    public stopChosenAni() {
        if (this.chosenAni) {
            this.chosenAni.stop();
            this.chosenAni = null;
        }
    }

    public playDropAni(): Promise<void> {
        return new Promise(resolve => {
            tween(this.node)
                .to(0.15, { position: new Vec3(0, this.staticYPos, 0) }, { easing: 'sineInOut' })
                .call(() => {
                    resolve();
                })
                .start();
        });
    }

    public playWarnAni(): Promise<void> {
        return new Promise<void>(resolve => {
            const yPos = this.node.position.y;
            tween(this.node)
                .to(0.05, { position: new Vec3(-5, yPos, 0) }, { easing: 'sineInOut' })
                .to(0.05, { position: new Vec3(5, yPos, 0) }, { easing: 'sineInOut' })
                .to(0.05, { position: new Vec3(-5, yPos, 0) }, { easing: 'sineInOut' })
                .to(0.05, { position: new Vec3(0, yPos, 0) }, { easing: 'sineInOut' })
                .call(() => {
                    resolve();
                })
                .start();
        });
    }
}
