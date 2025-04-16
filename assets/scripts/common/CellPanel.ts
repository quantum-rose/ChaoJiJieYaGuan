import { _decorator, Button, Component, instantiate, Node, tween, UITransform, Vec3 } from 'cc';
import { CountsWeight } from '../data/CountsWeight';
import { TypesWeight } from '../data/TypesWeight';
import { AudioManager } from '../manager/AudioManager';
import { EventManager, EventName } from '../manager/EventManager';
import { PrefabManager } from '../manager/PrefabManager';
import { VibrateManager } from '../manager/VibrateManager';
import { AudioName, CellState } from '../struct/Constants';
import { Util } from '../util/Util';
import { Cell } from './Cell';
import { Coin } from './Coin';
import { ProgressView } from './ProgressView';
const { ccclass, property } = _decorator;

@ccclass('CellPanel')
export class CellPanel extends Component {
    private static _instance: CellPanel = null;

    public static get instance() {
        return CellPanel._instance;
    }

    @property(Node)
    cellParent: Node = null;

    private _buttonDeal: Button = null;

    private _buttonTest: Button = null;

    public cells: Cell[] = [];

    public init(buttonDeal: Button, buttonTest: Button) {
        this._buttonDeal = buttonDeal;
        this._buttonTest = buttonTest;

        for (let i = 0; i < 12; i++) {
            const node = instantiate(PrefabManager.getPrefab('Cell'));
            this.cellParent.addChild(node);
            const cell = node.getComponent(Cell);
            cell.init(i);
            cell.setState(this._getCellState(i));
            this.cells.push(cell);
        }
    }

    public reset() {
        for (let i = 0; i < 12; i++) {
            const cell = this.cells[i];
            cell.reset();
            cell.setState(this._getCellState(i));
        }
    }

    private _getCellState(cellIndex: number) {
        if (cellIndex <= 4) {
            return CellState.NORMAL;
        } else if (cellIndex <= 5) {
            return CellState.LOCK_NEXT;
        } else if (cellIndex <= 8) {
            return CellState.LOCK;
        } else {
            return CellState.TEMP_AD;
        }
    }

    /**
     * 生成每个槽位发放的硬币
     */
    private _generateDealCoins() {
        const cellIndexToEmptyCount = new Map<number, number>(); // 记录每个槽位的空格数量
        const hasCoinCellIndices = []; // 记录已存在硬币的槽位索引

        for (let i = 0, len = this.cells.length; i < len; i++) {
            const emptyCount = this.cells[i].getEmptyCount();
            if (emptyCount > 0) {
                cellIndexToEmptyCount.set(i, emptyCount);
                if (emptyCount < 10) {
                    hasCoinCellIndices.push(i);
                }
            }
        }

        // 可发硬币槽位有多个时，随机移除一个槽位不发硬币
        if (cellIndexToEmptyCount.size > 1) {
            // 优先移除已存在硬币的槽位
            if (hasCoinCellIndices.length > 0) {
                const randomIndex = Util.getRandomInt(0, hasCoinCellIndices.length - 1);
                cellIndexToEmptyCount.delete(hasCoinCellIndices[randomIndex]);
            } else {
                // 随机移除一个槽位
                const randomIndex = Util.getRandomInt(0, cellIndexToEmptyCount.size - 1);
                const randomCellIndex = Array.from(cellIndexToEmptyCount.keys())[randomIndex];
                cellIndexToEmptyCount.delete(randomCellIndex);
            }
        }

        const stepIndex = ProgressView.instance.currentIndex; // 当前步骤索引

        const minCoin = ProgressView.instance.getMinStepNum() - 4; // 步骤条中最小硬币面值 - 4
        const maxCoin = ProgressView.instance.getCurrentStepNum() - 1; // 当前步骤中的硬币面值 - 1

        const cellIndexToAddCoins = new Map<number, number[]>(); // 记录每个槽位要添加的硬币

        cellIndexToEmptyCount.forEach((emptyCount, cellIndex) => {
            let weightCount = CountsWeight.getCount(stepIndex);
            if (weightCount > emptyCount) {
                weightCount = emptyCount;
            }

            const weightTypes = TypesWeight.getData(stepIndex);
            const groupCount = Math.max(...weightTypes);

            const coinSet = new Set<number>(); // 记录可用的硬币面值，共有 groupCount 种
            while (coinSet.size < groupCount) {
                const randomCoin = Util.getRandomInt(minCoin, maxCoin);
                if (!coinSet.has(randomCoin)) {
                    coinSet.add(randomCoin);
                }
            }

            const coinPool = Array.from(coinSet); // 将 Set 转换为数组
            const coins: number[] = [];
            for (let i = 0; i < weightCount; i++) {
                coins.push(coinPool[weightTypes[i] - 1]);
            }

            cellIndexToAddCoins.set(cellIndex, coins);
        });

        return cellIndexToAddCoins;
    }

    /**
     * 发牌
     */
    public async dealCoin(): Promise<void> {
        AudioManager.playSound(AudioName.DEAL_COIN);
        VibrateManager.vibrateShort();

        const dealAnis: Promise<void>[] = []; // 发牌动画
        const cellIndexToAddCoins = this._generateDealCoins();

        cellIndexToAddCoins.forEach((coins, cellIndex) => {
            let coinOrder = 0;
            const cell = this.cells[cellIndex];
            const coinStartY = cell.getFirstEmptyYPos();
            // 计算发牌按钮在当前槽位的本地坐标
            const dealBtnLocalPos = cell.node.getComponent(UITransform).convertToNodeSpaceAR(this._buttonDeal.node.getWorldPosition());

            for (let i = 0; i < coins.length; i++) {
                const coin = Coin.createCoin(coins[i]);
                coin.node.parent = cell.node;
                coin.node.position = dealBtnLocalPos;

                dealAnis.push(
                    this._playDealAni(coin.node, 0.03 * coinOrder, coinStartY - i * 18).then(() => {
                        cell.addCoin(coin);
                    })
                );

                coinOrder++;
            }
        });

        await Promise.all(dealAnis);

        EventManager.emit(EventName.CHECK_DEAL);
        EventManager.emit(EventName.CHECK_MERGE);
        EventManager.emit(EventName.CHECK_SHUFFLE);
    }

    /**
     * 重新开始游戏的发牌
     */
    public async restartDealCoin(): Promise<void> {
        AudioManager.playSound(AudioName.RESTART_DEAL_COIN);

        const dealAnis: Promise<void>[] = []; // 发牌动画
        const cellIndexToAddCoins = this._generateDealCoins();

        cellIndexToAddCoins.forEach((coins, cellIndex) => {
            let coinOrder = 0;
            const cell = this.cells[cellIndex];
            const coinStartY = cell.getFirstEmptyYPos();

            for (let i = 0; i < coins.length; i++) {
                const coin = Coin.createCoin(coins[i]);
                coin.node.parent = cell.node;
                coin.node.position = new Vec3(0, coinStartY - i * 18, 0);
                coin.node.setScale(0, 0, 0);

                dealAnis.push(
                    new Promise(resolve => {
                        tween(coin.node)
                            .delay(0.1 * coinOrder)
                            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                            .call(() => {
                                cell.addCoin(coin);
                                resolve();
                            })
                            .start();
                    })
                );

                coinOrder++;
            }
        });

        await Promise.all(dealAnis);

        EventManager.emit(EventName.CHECK_DEAL);
        EventManager.emit(EventName.CHECK_MERGE);
        EventManager.emit(EventName.CHECK_SHUFFLE);
    }

    /**
     * 教学引导的发牌
     */
    public async dealGuideCoin(step: number): Promise<void> {
        if (step === 1) {
            const coinNumber = ProgressView.instance.getMinStepNum() - 4;
            for (let i = 0; i < 5; i++) {
                this.cells[0].addCoin(Coin.createCoin(coinNumber));
                this.cells[2].addCoin(Coin.createCoin(coinNumber));
            }
        } else if (step === 4) {
            AudioManager.playSound(AudioName.DEAL_COIN);
            VibrateManager.vibrateShort();

            const dealAnis: Promise<void>[] = []; // 发牌动画
            const cellIndexToAddCoins = new Map<number, number[]>(); // 记录每个槽位要添加的硬币

            const coinNumber = ProgressView.instance.getMinStepNum() - 3;
            cellIndexToAddCoins.set(0, [coinNumber, coinNumber, coinNumber]);
            cellIndexToAddCoins.set(1, [coinNumber, coinNumber, coinNumber, coinNumber]);
            cellIndexToAddCoins.set(2, [coinNumber]);

            cellIndexToAddCoins.forEach((coins, cellIndex) => {
                let coinOrder = 0;
                const cell = this.cells[cellIndex];
                const coinStartY = cell.getFirstEmptyYPos();
                // 计算发牌按钮在当前槽位的本地坐标
                const dealBtnLocalPos = cell.node.getComponent(UITransform).convertToNodeSpaceAR(this._buttonDeal.node.getWorldPosition());

                for (let i = 0; i < coins.length; i++) {
                    const coin = Coin.createCoin(coins[i]);
                    coin.node.parent = cell.node;
                    coin.node.position = dealBtnLocalPos;

                    dealAnis.push(
                        this._playDealAni(coin.node, 0.03 * coinOrder, coinStartY - i * 18).then(() => {
                            cell.addCoin(coin);
                        })
                    );

                    coinOrder++;
                }
            });

            await Promise.all(dealAnis);
        }
    }

    /**
     * 测试用的发牌，可快速通关
     */
    public async dealTestCoin(): Promise<void> {
        AudioManager.playSound(AudioName.DEAL_COIN);
        VibrateManager.vibrateShort();

        const cellIndexToAddCoins = new Map<number, number[]>(); // 记录每个槽位要添加的硬币
        const maxCoin = ProgressView.instance.getCurrentStepNum() - 1; // 当前步骤中的硬币面值 - 1

        for (let i = 0, len = this.cells.length; i < len; i++) {
            const cell = this.cells[i];
            const emptyCount = cell.getEmptyCount();
            if (emptyCount === 0) {
                continue;
            }

            const firstGroupCoin = cell.getFirstGroupCoin();
            const coinNumber = firstGroupCoin.length > 0 ? firstGroupCoin[0].number : maxCoin;
            const coins: number[] = [];
            for (let j = 0; j < emptyCount; j++) {
                coins.push(coinNumber);
            }
            cellIndexToAddCoins.set(i, coins);
        }

        const dealAnis: Promise<void>[] = []; // 发牌动画

        cellIndexToAddCoins.forEach((coins, cellIndex) => {
            let coinOrder = 0;
            const cell = this.cells[cellIndex];
            const coinStartY = cell.getFirstEmptyYPos();
            // 计算发牌按钮在当前槽位的本地坐标
            const dealBtnLocalPos = cell.node.getComponent(UITransform).convertToNodeSpaceAR(this._buttonTest.node.getWorldPosition());

            for (let i = 0; i < coins.length; i++) {
                const coin = Coin.createCoin(coins[i]);
                coin.node.parent = cell.node;
                coin.node.position = dealBtnLocalPos;

                dealAnis.push(
                    this._playDealAni(coin.node, 0.03 * coinOrder, coinStartY - i * 18).then(() => {
                        cell.addCoin(coin);
                    })
                );

                coinOrder++;
            }
        });

        await Promise.all(dealAnis);

        EventManager.emit(EventName.CHECK_DEAL);
        EventManager.emit(EventName.CHECK_MERGE);
        EventManager.emit(EventName.CHECK_SHUFFLE);
    }

    /**
     * 播放发牌动画
     */
    private _playDealAni(coinNode: Node, delay: number, yPos: number) {
        return new Promise(resolve => {
            tween(coinNode)
                .delay(delay)
                .to(0.3, { position: new Vec3(0, yPos, 0) }, { easing: 'quadOut' })
                .call(resolve)
                .start();
        });
    }

    /**
     * 获取当前选中的槽位
     */
    public getChosenCell() {
        return this.cells.find(cell => cell.coins.some(coin => !!coin.chosenAni)) || null;
    }

    /**
     * 获取当前选中的硬币
     */
    public getChosenCoins() {
        const result: Coin[] = [];
        this.cells.forEach(cell => {
            cell.coins.forEach(coin => {
                if (coin.chosenAni) {
                    result.push(coin);
                }
            });
        });
        return result;
    }

    /**
     * 选中指定槽位内的硬币
     */
    public chooseCoin(cell: Cell) {
        AudioManager.playSound(AudioName.CHOOSE_COIN);
        VibrateManager.vibrateShort();
        cell.chooseCoin();
    }

    /**
     * 放下硬币
     */
    public dropCoin(cell: Cell) {
        VibrateManager.vibrateShort();
        cell.dropCoin();
    }

    /**
     * 放下所有槽位内的硬币
     */
    public dropAllCoin() {
        this.cells.forEach(cell => cell.dropCoin());
    }

    /**
     * 硬币无法移动时的提示动画
     */
    public async warnCoin(coins: Coin[]): Promise<void> {
        AudioManager.playSound(AudioName.WARN);
        VibrateManager.vibrateShort();

        await Promise.all(coins.map(coin => coin.playWarnAni()));

        await Promise.all(
            coins.map(coin => {
                coin.stopChosenAni();
                return coin.playDropAni();
            })
        );
    }

    /**
     * 移动硬币
     */
    public async moveCoin(coins: Coin[], fromCell: Cell, toCell: Cell): Promise<void> {
        VibrateManager.vibrateShort();

        let coinOrder = 0;
        const toCellWorldPos = toCell.node.getWorldPosition();
        const toCellLocalPos = CellPanel.instance.node.getComponent(UITransform).convertToNodeSpaceAR(toCellWorldPos);
        const coinStartY = toCell.getFirstEmptyYPos();

        const emptyCount = toCell.getEmptyCount();
        let firstCanMoveIndex = 0;
        if (coins.length > emptyCount) {
            firstCanMoveIndex = coins.length - emptyCount;
        }

        const moveAnis: Promise<void>[] = []; // 移动硬币的动画

        for (let i = 0; i < coins.length; i++) {
            const coin = coins[i];

            if (i >= firstCanMoveIndex) {
                coin.stopChosenAni();

                const coinWorldPos = coin.node.getWorldPosition();
                const startPos = CellPanel.instance.node.getComponent(UITransform).convertToNodeSpaceAR(coinWorldPos);
                coin.node.parent = CellPanel.instance.node;
                coin.node.setPosition(startPos);

                moveAnis.push(
                    new Promise(resolve => {
                        tween(coin.node)
                            .delay(0.015 * coinOrder)
                            .call(() => {
                                AudioManager.playSound(AudioName.PLACE_COIN);
                            })
                            .to(0.15, { position: new Vec3(toCellLocalPos.x, toCellLocalPos.y + coinStartY - coinOrder * 18, 0) }, { easing: 'quadOut' })
                            .call(() => {
                                fromCell.removeCoin(coin);
                                toCell.addCoin(coin);
                                resolve();
                            })
                            .start();
                    })
                );

                coinOrder++;
            } else {
                coin.stopChosenAni();
                coin.playDropAni();
            }
        }

        await Promise.all(moveAnis);

        EventManager.emit(EventName.CHECK_MERGE);
        EventManager.emit(EventName.CHECK_SHUFFLE);
    }

    /**
     * 合成硬币
     */
    public async mergeCoin(newCoinCount?: number): Promise<void> {
        AudioManager.playSound(AudioName.MERGE_COIN);
        VibrateManager.vibrateLong();

        const mergeAnis: Promise<void>[] = []; // 合并硬币的动画

        for (const cell of this.cells) {
            if (cell.coins.length !== 10) {
                continue;
            }

            const firstGroupCoin = cell.getFirstGroupCoin();
            if (firstGroupCoin.length !== 10) {
                continue;
            }

            mergeAnis.push(cell.mergeCoin(newCoinCount));
        }

        await Promise.all(mergeAnis);

        EventManager.emit(EventName.CHECK_DEAL);
        EventManager.emit(EventName.CHECK_MERGE);
        EventManager.emit(EventName.CHECK_SHUFFLE);
        EventManager.emit(EventName.CHECK_LEVEL_UP);
    }

    /**
     * 洗牌
     */
    public async shuffleCoin(): Promise<void> {
        AudioManager.playSound(AudioName.SHUFFLE);
        VibrateManager.vibrateShort();

        const openCells = this.cells.filter(cell => cell.state === CellState.NORMAL || cell.state === CellState.TEMP_OPEN);

        // 收集同类硬币，并将其从槽位中移除
        const numberToCoins = new Map<number, Coin[]>();
        for (const cell of openCells) {
            for (const coin of cell.coins.slice()) {
                const worldPos = coin.node.getWorldPosition();
                const localPos = CellPanel.instance.node.getComponent(UITransform).convertToNodeSpaceAR(worldPos);

                cell.removeCoin(coin);

                coin.node.parent = CellPanel.instance.node;
                coin.node.setPosition(localPos);

                Util.insertToMapArray(numberToCoins, coin.number, coin);
            }
        }

        // 获取收集到的硬币种类，并按照数字从小到大排序
        const numbers = Array.from(numberToCoins.keys());
        numbers.sort((a, b) => a - b);

        // 同类硬币至多10个为一组进行分组，使用numbers中的顺序进行遍历，实现从小到大的分组
        const group10Coins: Coin[][] = [];
        for (const key of numbers) {
            const coins = numberToCoins.get(key);
            while (coins.length > 0) {
                group10Coins.push(coins.splice(0, 10));
            }
        }

        // 按分组长度从大到小排序
        group10Coins.sort((a, b) => b.length - a.length);

        // 记录每个槽位最终分配到的硬币，优先为长度较大的分组分配槽位
        const cellIndexToCoins = new Map<number, Coin[]>();
        for (const cell of openCells) {
            cellIndexToCoins.set(cell.index, group10Coins.shift() ?? []);
        }

        const restCoins: Coin[] = [];
        while (group10Coins.length > 0) {
            const group = group10Coins.shift();
            for (const coins of cellIndexToCoins.values()) {
                if (coins.length + group.length <= 10) {
                    coins.push(...group);
                    group.length = 0; // 清空分组
                    break;
                }
            }
            if (group.length > 0) {
                restCoins.push(...group);
            }
        }

        // 如果还有剩余的硬币，见缝插针分配到剩余空位中即可
        if (restCoins.length > 0) {
            for (const coins of cellIndexToCoins.values()) {
                if (coins.length < 10) {
                    coins.push(...restCoins.splice(0, 10 - coins.length));
                }
                if (restCoins.length === 0) {
                    break;
                }
            }
        }

        const shuffleAnis: Promise<void>[] = []; // 洗牌动画
        for (const cell of openCells) {
            const coins = cellIndexToCoins.get(cell.index);

            const cellWorldPos = cell.node.getWorldPosition();
            const cellLocalPos = CellPanel.instance.node.getComponent(UITransform).convertToNodeSpaceAR(cellWorldPos);
            const coinStartY = cell.getFirstEmptyYPos();

            for (let i = 0; i < coins.length; i++) {
                const coin = coins[i];
                coin.stopChosenAni();

                shuffleAnis.push(
                    new Promise(resolve => {
                        tween(coin.node)
                            .delay(0.03 * i)
                            .to(0.3, { position: new Vec3(cellLocalPos.x, cellLocalPos.y + coinStartY - i * 18, 0) }, { easing: 'quadOut' })
                            .call(() => {
                                cell.addCoin(coin);
                                resolve();
                            })
                            .start();
                    })
                );
            }
        }

        await Promise.all(shuffleAnis);

        EventManager.emit(EventName.CHECK_DEAL);
        EventManager.emit(EventName.CHECK_MERGE);
        EventManager.emit(EventName.CHECK_SHUFFLE);
    }

    /**
     * 更新槽位的状态
     */
    public updateCellState() {
        const stepIndex = ProgressView.instance.currentIndex;
        for (let i = 0; i < this.cells.length; i++) {
            if (i >= 9) {
                continue;
            }

            const cell = this.cells[i];
            if (i <= 4 + stepIndex) {
                if (cell.state === CellState.LOCK_NEXT) {
                    AudioManager.playSound(AudioName.UNLOCK_AREA);
                    cell.setState(CellState.UNLOCKABLE);
                }
            } else if (i <= 5 + stepIndex) {
                cell.setState(CellState.LOCK_NEXT);
            } else if (i <= 8) {
                cell.setState(CellState.LOCK);
            }
        }
    }

    protected onLoad(): void {
        CellPanel._instance = this;
    }
}
