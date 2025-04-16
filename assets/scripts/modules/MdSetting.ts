import { _decorator, instantiate, Node, tween, Vec3 } from 'cc';
import { BaseView } from '../common/BaseView';
import { AudioManager } from '../manager/AudioManager';
import { DataManager } from '../manager/DataManager';
import { EventManager, EventName } from '../manager/EventManager';
import { PrefabManager } from '../manager/PrefabManager';
import { VibrateManager } from '../manager/VibrateManager';
import { AudioName } from '../struct/Constants';
const { ccclass, property } = _decorator;

@ccclass('MdSetting')
export class MdSetting extends BaseView {
    private static _instance: MdSetting = null;

    public static get instance() {
        if (MdSetting._instance === null) {
            const node = instantiate(PrefabManager.getPrefab('SettingView'));
            MdSetting._instance = node.getComponent(MdSetting);
        }
        return MdSetting._instance;
    }

    @property(Node)
    panel: Node = null;

    @property(Node)
    audioSwitch: Node = null;

    @property(Node)
    vibrateSwitch: Node = null;

    public open(): Promise<void> {
        AudioManager.playSound(AudioName.BUTTON);
        VibrateManager.vibrateShort();

        this.show();
        this.panel.setScale(0, 0, 0);

        return new Promise<void>(resolve => {
            tween(this.panel)
                .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .call(() => {
                    resolve();
                })
                .start();
        });
    }

    public close(): Promise<void> {
        AudioManager.playSound(AudioName.BUTTON);
        VibrateManager.vibrateShort();

        this.panel.setScale(1, 1, 1);

        return new Promise<void>(resolve => {
            tween(this.panel)
                .to(0.2, { scale: new Vec3(0, 0, 0) }, { easing: 'backIn' })
                .call(() => {
                    this.hide();
                    resolve();
                })
                .start();
        });
    }

    /**
     * 设置音效开关
     */
    public toggleSound() {
        const offNode = this.audioSwitch.getChildByName('Off');
        const onNode = this.audioSwitch.getChildByName('On');

        const isOn = !onNode.active;
        onNode.active = isOn;
        offNode.active = !isOn;

        AudioManager.setSoundEnabled(isOn);

        AudioManager.playSound(AudioName.CLICK);
        VibrateManager.vibrateShort();
    }

    /**
     * 设置震动开关
     */
    public toggleVibrate() {
        const offNode = this.vibrateSwitch.getChildByName('Off');
        const onNode = this.vibrateSwitch.getChildByName('On');

        const isOn = !onNode.active;
        onNode.active = isOn;
        offNode.active = !isOn;

        VibrateManager.setVibrateEnabled(isOn);

        AudioManager.playSound(AudioName.CLICK);
        VibrateManager.vibrateLong();
    }

    /**
     * 重新开始
     */
    public async restartGame() {
        await this.close();

        EventManager.emit(EventName.RESTART_GAME);
    }

    protected onLoad(): void {
        const soundEnabled = DataManager.getVolume() > 0;
        this.audioSwitch.getChildByName('On').active = soundEnabled;
        this.audioSwitch.getChildByName('Off').active = !soundEnabled;

        const vibrateEnabled = DataManager.getVibrate();
        this.vibrateSwitch.getChildByName('On').active = vibrateEnabled;
        this.vibrateSwitch.getChildByName('Off').active = !vibrateEnabled;
    }
}
