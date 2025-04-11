import { _decorator, instantiate } from 'cc';
import { DataManager } from '../manager/DataManager';
import { PrefabManager } from '../manager/PrefabManager';
import { BaseView } from './BaseView';
import { CellPanel } from './CellPanel';
const { ccclass, property } = _decorator;

@ccclass('GuidePanel')
export class GuidePanel extends BaseView {
    private static _instance: GuidePanel = null;

    public static get instance() {
        if (GuidePanel._instance === null) {
            const node = instantiate(PrefabManager.getPrefab('GuidePanel'));
            GuidePanel._instance = node.getComponent(GuidePanel);
        }
        return GuidePanel._instance;
    }

    public currentStep: number = 1;

    public async nextStep() {
        this._hideCurrentStep();

        const cellPanel = CellPanel.instance;

        switch (this.currentStep) {
            case 1:
                cellPanel.chooseCoin(cellPanel.cells[0]);
                break;
            case 2: {
                const from = cellPanel.cells[0];
                const to = cellPanel.cells[2];
                const coins = from.coins;
                await cellPanel.moveCoin(coins, from, to);
                break;
            }
            case 3:
                await cellPanel.mergeCoin(2);
                break;
            case 4:
                await cellPanel.dealGuideCoin(4);
                break;
            case 5:
                cellPanel.chooseCoin(cellPanel.cells[0]);
                break;
            case 6: {
                const from = cellPanel.cells[0];
                const to = cellPanel.cells[1];
                const coins = from.coins;
                await cellPanel.moveCoin(coins, from, to);
                break;
            }
            case 7:
                cellPanel.chooseCoin(cellPanel.cells[2]);
                break;
            case 8: {
                const from = cellPanel.cells[2];
                const to = cellPanel.cells[1];
                const coins = from.coins;
                await cellPanel.moveCoin(coins, from, to);
                break;
            }
            case 9:
                await cellPanel.mergeCoin();

                this.scheduleOnce(() => {
                    this._hideCurrentStep();
                    this._showNextStep();
                }, 2);
                break;
            case 10:
                // 自动跳过
                break;
            case 11:
                await cellPanel.dealCoin();
                break;
            default:
                throw new Error(`Invalid step: ${this.currentStep}`);
        }

        this._showNextStep();
    }

    private _hideCurrentStep() {
        this.node.getChildByName(`Step${this.currentStep}`).active = false;
    }

    private _showNextStep() {
        this.currentStep++;

        if (this.currentStep > 11) {
            DataManager.setGuide(true);
            this.hide();
        } else {
            this.node.getChildByName(`Step${this.currentStep}`).active = true;
        }
    }

    protected onLoad(): void {
        CellPanel.instance.dealGuideCoin(1);
    }
}
