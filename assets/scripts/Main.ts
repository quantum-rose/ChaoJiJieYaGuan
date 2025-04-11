import { _decorator, Component, EventKeyboard, game, input, Input, KeyCode, sys } from 'cc';
import { TipView } from './common/TipView';
import { AudioManager } from './manager/AudioManager';
import { MdGame } from './modules/MdGame';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    private isBackPressedOnce = false;

    protected start() {
        MdGame.instance.show();
        AudioManager.init();

        // 监听手机返回键事件
        if (sys.isNative && sys.isMobile) {
            input.on(Input.EventType.KEY_UP, this._onBackPressed, this);
        }
    }

    private _onBackPressed(event: EventKeyboard) {
        if (event.keyCode === KeyCode.MOBILE_BACK || event.keyCode === KeyCode.BACKSPACE) {
            if (this.isBackPressedOnce) {
                // 退出游戏
                game.end();
            } else {
                // 第一次按下返回键，提示用户
                this.isBackPressedOnce = true;

                TipView.instance.show();

                // 2秒后重置标记
                this.scheduleOnce(() => {
                    this.isBackPressedOnce = false;
                }, 2);
            }
        }
    }

    onDestroy() {
        if (sys.isNative && sys.isMobile) {
            input.off(Input.EventType.KEY_UP, this._onBackPressed, this);
        }
    }
}
