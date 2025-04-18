declare namespace ByteDanceMiniGame {
    interface AsyncAPIResult {
        errMsg: string;
    }

    interface AsyncAPIOptions {
        /** 接口调用成功的回调函数 */
        success?: (result: AsyncAPIResult) => void;
        /** 接口调用失败的回调函数 */
        fail?: (result: AsyncAPIResult) => void;
        /** 接口调用结束的回调函数（调用成功、失败都会执行） */
        complete?: (result: AsyncAPIResult) => void;
    }

    interface TT {
        /**
         * 使手机发生较短时间的振动。安卓震动时间为 30ms，ios 震动时间为 15ms。
         * [tt.vibrateShort](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/device/shake/tt-vibrate-short)
         */
        vibrateShort: (options?: AsyncAPIOptions) => void;
        /**
         * 使手机发生较长时间的振动（400 ms)。
         * [tt.vibrateLong](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/device/shake/tt-vibrate-long)
         */
        vibrateLong: (options?: AsyncAPIOptions) => void;
    }
}

/**
 * 小游戏 API 全局对象，用于承载小游戏能力相关 API。具体请参考[小游戏 API 参考文档](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/bytedance-mini-game)。
 */
declare const tt: ByteDanceMiniGame.TT;
