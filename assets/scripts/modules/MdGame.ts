import { _decorator, Button, EventTouch, instantiate, Label, Node, Sprite } from 'cc';
import { BaseView } from '../common/BaseView';
import { Cell } from '../common/Cell';
import { CellPanel } from '../common/CellPanel';
import { GuidePanel } from '../common/GuidePanel';
import { ProgressView } from '../common/ProgressView';
import { CountsWeight } from '../data/CountsWeight';
import { TypesWeight } from '../data/TypesWeight';
import { AudioManager } from '../manager/AudioManager';
import { DataManager } from '../manager/DataManager';
import { EventManager, EventName } from '../manager/EventManager';
import { PrefabManager } from '../manager/PrefabManager';
import { AudioName, CellState } from '../struct/Constants';
import { MdSetting } from './MdSetting';
const { ccclass, property } = _decorator;

@ccclass('MdGame')
export class MdGame extends BaseView {
    private static _instance: MdGame = null;

    public static get instance() {
        if (MdGame._instance === null) {
            const node = instantiate(PrefabManager.getPrefab('GameView'));
            MdGame._instance = node.getComponent(MdGame);
        }
        return MdGame._instance;
    }

    @property(Button)
    buttonDeal: Button = null;

    @property(Button)
    buttonMerge: Button = null;

    @property(Button)
    buttonShuffle: Button = null;

    @property(Node)
    overMask: Node = null;

    @property(Label)
    levelText: Label = null;

    private _globalLock: number = 0; // 全局锁，0表示没有锁，大于0表示有锁

    /**
     * 开始游戏
     */
    private _startGame() {
        this.buttonDeal.interactable = true;
        this.buttonDeal.getComponent(Sprite).grayscale = false;

        this.buttonMerge.interactable = false;
        this.buttonMerge.getComponent(Sprite).grayscale = true;

        this.buttonShuffle.node.active = false;

        this.levelText.string = `第 ${DataManager.getLevel()} 关`;

        CellPanel.instance.reset();
        ProgressView.instance.reset();
    }

    /**
     * 开始教学
     */
    private _startGuide(): void {
        GuidePanel.instance.show();
    }

    /**
     * 重新开始游戏
     */
    private _restartGame() {
        this._startGame();
        this._restartDeal();
    }

    /**
     * 检查是否可以发牌
     */
    private _checkDeal() {
        const cellIndexToEmptyCount = new Map<number, number>(); // 记录每个槽位的空格数量
        for (let i = 0, len = CellPanel.instance.cells.length; i < len; i++) {
            const emptyCount = CellPanel.instance.cells[i].getEmptyCount();
            if (emptyCount > 0) {
                cellIndexToEmptyCount.set(i, emptyCount);
            }
        }

        const canDeal = cellIndexToEmptyCount.size > 0;

        this.buttonDeal.interactable = canDeal;
        this.buttonDeal.getComponent(Sprite).grayscale = !canDeal;
    }

    /**
     * 点击发牌按钮
     */
    public async handleDeal() {
        if (this._globalLock > 0) {
            return;
        }

        CellPanel.instance.dropAllCoin();

        this._globalLock++;
        await CellPanel.instance.dealCoin();
        this._globalLock--;
    }

    /**
     * 重新开始的发牌
     */
    private async _restartDeal() {
        this._globalLock++;
        await CellPanel.instance.restartDealCoin();
        this._globalLock--;
    }

    /**
     * 检查是否可以合成
     */
    private _checkMerge() {
        let needPlaySound = false;
        let canMerge = false;
        for (const cell of CellPanel.instance.cells) {
            const firstGroupCoin = cell.getFirstGroupCoin();
            if (firstGroupCoin.length === 10) {
                if (!cell.canMerge) {
                    needPlaySound = true;
                }
                cell.canMerge = true;
                canMerge = true;
            } else {
                cell.canMerge = false;
            }
        }

        if (needPlaySound) {
            AudioManager.playSound(AudioName.CAN_MERGE);
        }

        this.buttonMerge.interactable = canMerge;
        this.buttonMerge.getComponent(Sprite).grayscale = !canMerge;
    }

    /**
     * 点击合成按钮
     */
    public async handleMerge() {
        if (this._globalLock > 0) {
            return;
        }

        CellPanel.instance.dropAllCoin();

        this._globalLock++;
        await CellPanel.instance.mergeCoin();
        this._globalLock--;
    }

    /**
     * 检查是否可以洗牌，即是否陷入死局，如果还有能进行的操作，则不需要洗牌
     */
    private _checkShuffle() {
        const openCells = CellPanel.instance.cells.filter(cell => cell.state === CellState.NORMAL || cell.state === CellState.TEMP_OPEN);

        // 是否还有足够的空位能够发牌，且发牌后一定不会满
        const maxDealCount = CountsWeight.getMaxCount(ProgressView.instance.currentIndex);
        if (openCells.some(cell => cell.coins.length + maxDealCount <= 9)) {
            this.buttonShuffle.node.active = false;
            return;
        }

        // 是否有槽位可以合成硬币
        for (const cell of openCells) {
            const firstGroupCoin = cell.getFirstGroupCoin();
            if (firstGroupCoin.length === 10) {
                this.buttonShuffle.node.active = false;
                return;
            }
        }

        // 是否有硬币可以移动，且移动后局面有所不同
        for (const from of openCells) {
            // 如果当前槽位没有硬币，跳过
            if (from.coins.length === 0) {
                continue;
            }

            const fromFirstGroupCoin = from.getFirstGroupCoin();

            for (const to of openCells) {
                // 同一个槽位，或者槽位已满，跳过
                if (from === to || to.coins.length === 10) {
                    continue;
                }

                const toFirstGroupCoin = to.getFirstGroupCoin();

                /**
                 * 满足移动硬币的基本条件之一：
                 * 1.目标槽位为空
                 * 2.两个槽位的第一组硬币种类相同
                 *
                 * 且同时满足以下条件之一的：
                 * 1.硬币能够全部移动到新槽位
                 * 2.硬币能够部分移动到新槽位，但移动后能达成满10个的合成条件
                 */
                if (
                    (to.coins.length === 0 || fromFirstGroupCoin[0].number === toFirstGroupCoin[0].number) &&
                    (fromFirstGroupCoin.length + to.coins.length <= 10 || toFirstGroupCoin.length === to.coins.length)
                ) {
                    this.buttonShuffle.node.active = false;
                    return;
                }
            }
        }

        this.buttonShuffle.node.active = true;
    }

    /**
     * 点击洗牌按钮
     */
    public async handleShuffle() {
        if (this._globalLock > 0) {
            return;
        }

        this._globalLock++;
        await CellPanel.instance.shuffleCoin();
        this._globalLock--;
    }

    /**
     * 检查是否可以进入下一关
     */
    private _checkLevelUp() {
        const currentStepNum = ProgressView.instance.getCurrentStepNum();
        const maxStepNum = ProgressView.instance.getMaxStepNum();
        let max = 0;
        for (const cell of CellPanel.instance.cells) {
            for (const coin of cell.coins) {
                if (coin.number > max) {
                    max = coin.number;
                }
            }
        }

        if (max >= maxStepNum) {
            const level = DataManager.getLevel();
            const nextLevel = level + 1;
            DataManager.setLevel(nextLevel);

            this._startGame();
        } else if (max >= currentStepNum) {
            ProgressView.instance.nextStep();

            CellPanel.instance.updateCellState();
        }
    }

    public openSettingPanel() {
        MdSetting.instance.open();
    }

    public openRankPanel() {
        // TODO
    }

    /**
     * 点击槽位
     */
    private async _handleClickCell(e: EventTouch) {
        const currentChosenCell = e.target.getComponent(Cell) as Cell;

        // 如果当前槽位处于锁定状态，进行警告提示
        if (currentChosenCell.state === CellState.LOCK || currentChosenCell.state === CellState.LOCK_NEXT) {
            currentChosenCell.warnLock();
            return;
        }

        // 如果当前槽位处于可解锁状态，解锁当前槽位
        if (currentChosenCell.state === CellState.UNLOCKABLE || currentChosenCell.state === CellState.TEMP_AD) {
            currentChosenCell.unlock();
            return;
        }

        // 如果当前槽位不是开放状态，无事发生
        if (currentChosenCell.state !== CellState.NORMAL && currentChosenCell.state !== CellState.TEMP_OPEN) {
            return;
        }

        const lastChosenCell = CellPanel.instance.getChosenCell();

        // 没有选中的槽位
        if (lastChosenCell === null) {
            // 如果当前槽位有硬币，选中当前槽位
            if (currentChosenCell.coins.length > 0) {
                CellPanel.instance.chooseCoin(currentChosenCell);
            }
            return;
        }

        // 两次点击同一个槽位，放下硬币
        if (lastChosenCell === currentChosenCell) {
            CellPanel.instance.dropCoin(lastChosenCell);
            return;
        }

        // 获取上次选中的硬币
        const chosenCoins = CellPanel.instance.getChosenCoins();

        // 获取当前选中的槽位第一组硬币
        const currentFirstGroupCoin = currentChosenCell.getFirstGroupCoin();

        // 如果当前槽位已满，或者第一组硬币的种类与选中的硬币不一致，不能移动
        if (currentChosenCell.coins.length === 10 || (currentFirstGroupCoin.length > 0 && currentFirstGroupCoin[0].number !== chosenCoins[0].number)) {
            this._globalLock++;
            await CellPanel.instance.warnCoin(chosenCoins);
            this._globalLock--;
            return;
        }

        // 移动硬币
        this._globalLock++;
        await CellPanel.instance.moveCoin(chosenCoins, lastChosenCell, currentChosenCell);
        this._globalLock--;
    }

    /**
     * 事件委托，点击事件
     */
    private _onClick(e: EventTouch) {
        if (this._globalLock > 0) {
            return;
        }

        if (e.target.name === 'Cell') {
            this._handleClickCell(e);
        }
    }

    public bindEvents() {
        this.node.on(Node.EventType.TOUCH_END, this._onClick, this);

        EventManager.on(EventName.RESTART_GAME, this._restartGame, this);
        EventManager.on(EventName.CHECK_DEAL, this._checkDeal, this);
        EventManager.on(EventName.CHECK_MERGE, this._checkMerge, this);
        EventManager.on(EventName.CHECK_SHUFFLE, this._checkShuffle, this);
        EventManager.on(EventName.CHECK_LEVEL_UP, this._checkLevelUp, this);
    }

    protected onLoad(): void {
        this.bindEvents();
    }

    protected start() {
        CountsWeight.init();
        TypesWeight.init();

        CellPanel.instance.init(this.buttonDeal, this.buttonTest);

        this._startGame();

        if (!DataManager.getGuide()) {
            this._startGuide();
        }
    }

    @property(Button)
    buttonTest: Button = null;

    public async test() {
        if (this._globalLock > 0) {
            return;
        }

        CellPanel.instance.dropAllCoin();

        this._globalLock++;
        await CellPanel.instance.dealTestCoin();
        this._globalLock--;
    }
}
