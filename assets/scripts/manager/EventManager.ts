import { EventTarget } from 'cc';

export enum EventName {
    RESTART_GAME = 'restartGame',
    CHECK_DEAL = 'checkDeal',
    CHECK_MERGE = 'checkMerge',
    CHECK_LEVEL_UP = 'checkLevelUp',
}

type EventCallback<T = any> = (arg: T) => void;

export class EventManager {
    private static eventTarget: EventTarget = new EventTarget();

    /**
     * 注册事件
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param context 上下文（可选）
     */
    public static on<T = any>(eventName: EventName, callback: EventCallback<T>, context?: any): void {
        this.eventTarget.on(eventName, callback, context);
    }

    /**
     * 注销事件
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param context 上下文（可选）
     */
    public static off<T = any>(eventName: EventName, callback: EventCallback<T>, context?: any): void {
        this.eventTarget.off(eventName, callback, context);
    }

    /**
     * 触发事件
     * @param eventName 事件名称
     * @param args 参数
     */
    public static emit<T = any>(eventName: EventName, arg?: T): void {
        this.eventTarget.emit(eventName, arg);
    }
}
