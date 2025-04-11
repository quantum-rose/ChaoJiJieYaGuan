export enum CellState {
    /** 正常状态 */
    NORMAL,
    /** 解锁状态 */
    UNLOCKABLE,
    /** 锁定状态 */
    LOCK,
    /** 锁定状态，下次可以解锁 */
    LOCK_NEXT,
    /** 临时状态，可播放广告 */
    TEMP_AD,
    /** 临时开启状态 */
    TEMP_OPEN,
}

export enum AudioName {
    DEAL_COIN = 'giveCoin',
    RESTART_DEAL_COIN = 'resetStart',
    CHOOSE_COIN = 'chooseCoin',
    PLACE_COIN = 'placeCoin',
    WARN = 'warn',
    CAN_MERGE = 'tz_full',
    MERGE_COIN = 'merge',
    GET_AREA = 'getArea',
    UNLOCK_AREA = 'unlockArea',
    CLICK = 'click',
    BUTTON = 'btn',
}
