import { native, sys } from 'cc';
import { DataManager } from './DataManager';

export class VibrateManager {
    private static _disable: boolean = !DataManager.getVibrate();

    private static _vibrate = (() => {
        // 安卓原生
        if (sys.platform === sys.Platform.ANDROID) {
            return (time: number) => {
                native.reflection.callStaticMethod(
                    'com/cocos/game/AppActivity', // Java 类路径
                    'vibrate', // 方法名称
                    '(I)V', // 方法签名
                    time // 参数
                );
            };
        }

        // 微信小游戏
        if (sys.platform === sys.Platform.WECHAT_GAME) {
            return (time: number) => {
                if (time <= 15) {
                    wx.vibrateShort({
                        type: 'heavy',
                    });
                } else {
                    wx.vibrateLong();
                }
            };
        }

        // 浏览器
        if (sys.isBrowser && navigator.vibrate) {
            return (time: number) => {
                navigator.vibrate(time);
            };
        }

        return (_time: number) => {
            // Fallback for unsupported platforms
            console.warn('Vibration not supported on this platform.');
        };
    })();

    public static vibrateShort() {
        if (VibrateManager._disable) return;

        VibrateManager._vibrate(15);
    }

    public static vibrateLong() {
        if (VibrateManager._disable) return;

        VibrateManager._vibrate(400);
    }

    public static setVibrateEnabled(enabled: boolean) {
        VibrateManager._disable = !enabled;
        DataManager.setVibrate(enabled);
    }
}
