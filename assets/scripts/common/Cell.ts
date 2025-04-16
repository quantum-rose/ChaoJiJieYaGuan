import { _decorator, Animation, Color, Component, Node, Sprite, tween, Vec3 } from 'cc';
import { CountsWeight } from '../data/CountsWeight';
import { AudioManager } from '../manager/AudioManager';
import { EventManager, EventName } from '../manager/EventManager';
import { AudioName, CellState } from '../struct/Constants';
import { Coin } from './Coin';
import { ProgressView } from './ProgressView';
const { ccclass, property } = _decorator;

export enum CellEvent {
    UNLOCK_DONE = 'UNLOCK_DONE',
}

@ccclass('Cell')
export class Cell extends Component {
    @property(Node)
    merge: Node = null;

    @property(Node)
    coinParent: Node = null;

    @property(Node)
    lock: Node = null;

    @property(Node)
    unlockable: Node = null;

    @property(Node)
    adLock: Node = null;

    public state: CellState;

    public coins: Coin[] = [];

    public index: number = 0;

    public set canMerge(value: boolean) {
        this.merge.active = value;
    }
    public get canMerge() {
        return this.merge.active;
    }

    /**
     * 正在进行动画
     */
    private _isAnimating: boolean = false;

    public init(index: number) {
        this.index = index;
        this.merge.active = false;
        this.lock.active = false;
        this.unlockable.active = false;
        this.adLock.active = false;
    }

    public reset() {
        this.coins.forEach(coin => {
            coin.node.parent = null;
            coin.node.destroy();
        });
        this.coins = [];
    }

    /**
     * 设置槽位的状态
     */
    public setState(state: CellState) {
        if (this.state === state) {
            return;
        }

        this.state = state;

        if (state === CellState.NORMAL) {
            this.merge.active = false;
            this.lock.active = false;
            this.unlockable.active = false;
            this.adLock.active = false;
        } else if (state === CellState.UNLOCKABLE) {
            this.merge.active = false;
            this.lock.active = false;
            this.unlockable.active = true;
            this.adLock.active = false;

            this.unlockable.getChildByName('UnlockBg').position = new Vec3(0, 0, 0);
            this.unlockable.getComponent(Animation).play('UnlockTip');
        } else if (state === CellState.LOCK) {
            this.merge.active = false;
            this.lock.active = true;
            this.unlockable.active = false;
            this.adLock.active = false;

            this.lock.getChildByName('LockIcon').getComponent(Sprite).color = new Color(255, 255, 255, 150);
        } else if (state === CellState.LOCK_NEXT) {
            this.merge.active = false;
            this.lock.active = true;
            this.unlockable.active = false;
            this.adLock.active = false;

            this.lock.getChildByName('LockIcon').getComponent(Sprite).color = new Color(255, 255, 255, 255);
        } else if (state === CellState.TEMP_AD) {
            this.merge.active = false;
            this.lock.active = false;
            this.unlockable.active = false;
            this.adLock.active = true;

            this.adLock.getChildByName('ADLockBg').position = new Vec3(0, 0, 0);
        }

        if (state === CellState.TEMP_OPEN) {
            this.merge.active = false;
            this.lock.active = false;
            this.unlockable.active = false;
            this.adLock.active = false;
        }
    }

    /**
     * 获取空位数量
     */
    public getEmptyCount(): number {
        if (this.state !== CellState.NORMAL && this.state !== CellState.TEMP_OPEN) {
            return 0;
        }
        return 10 - this.coins.length;
    }

    /**
     * 获取第一个空位的y坐标
     */
    public getFirstEmptyYPos(): number {
        return 89 - this.coins.length * 18;
    }

    /**
     * 添加硬币
     */
    public addCoin(coin: Coin) {
        const yPos = this.getFirstEmptyYPos();
        coin.staticYPos = yPos;
        coin.node.setPosition(new Vec3(0, yPos, 0));
        coin.node.parent = this.coinParent;
        this.coins.push(coin);
    }

    /**
     * 移除硬币
     */
    public removeCoin(coin: Coin) {
        const index = this.coins.indexOf(coin);
        if (index !== -1) {
            this.coins.splice(index, 1);
            coin.node.parent = null;
        }
    }

    /**
     * 获取当前槽位的第一组硬币
     */
    public getFirstGroupCoin(): Coin[] {
        const result: Coin[] = [];
        if (this.coins.length === 0) {
            return result;
        }
        const firstGroupCoin = this.coins[this.coins.length - 1];
        result.push(firstGroupCoin);
        for (let i = this.coins.length - 2; i >= 0; i--) {
            if (this.coins[i].number === firstGroupCoin.number) {
                result.push(this.coins[i]);
            } else {
                break;
            }
        }
        return result;
    }

    /**
     * 选择硬币，拿起当前槽位的第一组硬币
     */
    public chooseCoin() {
        const coins = this.getFirstGroupCoin();
        coins.forEach(coin => {
            coin.playChosenAni();
        });
    }

    /**
     * 取消选择硬币，放下当前槽位的第一组硬币
     */
    public dropCoin() {
        const coins = this.getFirstGroupCoin();
        coins.map(coin => {
            coin.stopChosenAni();
            coin.playDropAni();
        });
    }

    /**
     * 合成硬币
     */
    public async mergeCoin(newCoinCount?: number): Promise<void> {
        const disappearAnis: Promise<void>[] = []; // 硬币消失动画

        const coinNumber = this.coins[0].number;

        for (let i = 0, l = this.coins.length; i < l; i++) {
            const coin = this.coins[l - 1 - i];

            disappearAnis.push(
                new Promise(resolve => {
                    const embedTween = tween(coin.node)
                        .to(0.02, { scale: new Vec3(1.2, 1, 1) }, { easing: 'quadIn' })
                        .to(0.02, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' });

                    tween(coin.node)
                        .repeat(i + 1, embedTween)
                        .call(() => {
                            this.removeCoin(coin);
                            coin.destroy();
                            resolve();
                        })
                        .start();
                })
            );
        }

        // 等待所有硬币消失动画完成，合成下一级硬币
        await Promise.all(disappearAnis);

        const weightCount = newCoinCount ?? CountsWeight.getCount(ProgressView.instance.currentIndex);
        const coinStartY = this.getFirstEmptyYPos();

        const newCoinAnis: Promise<void>[] = []; // 新硬币动画

        for (let i = 0; i < weightCount; i++) {
            const coin = Coin.createCoin(coinNumber + 1);
            coin.node.parent = this.node;
            coin.node.position = new Vec3(0, coinStartY - i * 18, 0);

            newCoinAnis.push(
                new Promise<void>(resolve => {
                    tween(coin.node)
                        .delay(0.04)
                        .to(0.04, { scale: new Vec3(0.9, 1, 1) }, { easing: 'quadIn' })
                        .to(0.04, { scale: new Vec3(1.2, 1, 1) }, { easing: 'quadOut' })
                        .to(0.04, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
                        .call(() => {
                            this.addCoin(coin);
                            resolve();
                        })
                        .start();
                })
            );
        }

        await Promise.all(newCoinAnis);
    }

    /**
     * 解锁槽位
     */
    public async unlock(): Promise<void> {
        if (this._isAnimating) {
            return;
        }

        if (this.state === CellState.UNLOCKABLE) {
            AudioManager.playSound(AudioName.GET_AREA);

            const unlockAnimation = this.unlockable.getComponent(Animation);
            unlockAnimation.play('UnlockMove');

            this._isAnimating = true;
            await new Promise<void>(resolve => unlockAnimation.once(Animation.EventType.FINISHED, resolve));
            this._isAnimating = false;

            this.setState(CellState.NORMAL);

            EventManager.emit(EventName.CHECK_DEAL);
            EventManager.emit(EventName.CHECK_SHUFFLE);
        } else if (this.state === CellState.TEMP_AD) {
            AudioManager.playSound(AudioName.GET_AREA);

            const unlockAnimation = this.adLock.getComponent(Animation);
            unlockAnimation.play('AdUnlock');

            this._isAnimating = true;
            await new Promise<void>(resolve => unlockAnimation.once(Animation.EventType.FINISHED, resolve));
            this._isAnimating = false;

            this.setState(CellState.TEMP_OPEN);

            EventManager.emit(EventName.CHECK_DEAL);
            EventManager.emit(EventName.CHECK_SHUFFLE);
        }
    }

    protected onLoad(): void {
        this.node.on(
            Node.EventType.TOUCH_END,
            () => {
                // nothing to do，为了实现事件委托
            },
            this
        );
    }
}
