import { _decorator, instantiate } from 'cc';
import { BaseView } from '../common/BaseView';
import { PrefabManager } from '../manager/PrefabManager';
const { ccclass, property } = _decorator;

@ccclass('TipView')
export class TipView extends BaseView {
    private static _instance: TipView = null;

    public static get instance() {
        if (TipView._instance === null) {
            const node = instantiate(PrefabManager.getPrefab('TipView'));
            TipView._instance = node.getComponent(TipView);
        }
        return TipView._instance;
    }

    public show() {
        super.show();

        this.scheduleOnce(() => {
            this.hide();
        }, 2);
    }
}
