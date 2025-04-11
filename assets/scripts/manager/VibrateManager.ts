import { native, sys } from 'cc';
import { DataManager } from './DataManager';

export class VibrateManager {
    private static _disable: boolean = !DataManager.getVibrate();

    private static _vibrate = (() => {
        if (sys.isNative) {
            return (time: number) => {
                native.reflection.callStaticMethod(
                    'com/cocos/game/AppActivity', // Java 类路径
                    'vibrate', // 方法名称
                    '(I)V', // 方法签名
                    time // 参数
                );
            };
        }

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

    public static vibrate(time: number) {
        if (VibrateManager._disable) return;

        VibrateManager._vibrate(time);
    }

    public static setVibrateEnabled(enabled: boolean) {
        VibrateManager._disable = !enabled;
        DataManager.setVibrate(enabled);
    }
}
