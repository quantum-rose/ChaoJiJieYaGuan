import { sys } from 'cc';

export class DataManager {
    private static _numberData: Record<string, number> = {};

    private static _stringData: Record<string, string> = {};

    public static getNumberData(key: string, defaultValue?: number): number {
        if (this._numberData[key] === undefined) {
            let rawData = sys.localStorage.getItem(key);
            if (rawData === null || rawData === '') {
                if (defaultValue !== undefined) {
                    DataManager._numberData[key] = defaultValue;
                } else {
                    DataManager._numberData[key] = 0;
                }
            } else {
                DataManager._numberData[key] = Number(rawData);
            }
        }

        return this._numberData[key];
    }

    public static setNumberData(key: string, value: number): void {
        DataManager._numberData[key] = value;
        sys.localStorage.setItem(key, value.toString());
    }

    public static getStringData(key: string, defaultValue?: string): string {
        if (this._stringData[key] === undefined) {
            let rawData = sys.localStorage.getItem(key);
            if (rawData === null || rawData === '') {
                if (defaultValue !== undefined) {
                    DataManager._stringData[key] = defaultValue;
                } else {
                    DataManager._stringData[key] = '';
                }
            } else {
                DataManager._stringData[key] = rawData;
            }
        }

        return this._stringData[key];
    }

    public static setStringData(key: string, value: string): void {
        DataManager._stringData[key] = value;
        sys.localStorage.setItem(key, value);
    }

    public static getLevel(): number {
        return DataManager.getNumberData('level', 1);
    }

    public static setLevel(level: number): void {
        DataManager.setNumberData('level', level);
    }

    public static getVolume(): number {
        return DataManager.getNumberData('volume', 1);
    }

    public static setVolume(volume: number): void {
        DataManager.setNumberData('volume', volume);
    }

    public static getVibrate(): boolean {
        return DataManager.getNumberData('vibrate', 1) === 1;
    }

    public static setVibrate(vibrate: boolean): void {
        DataManager.setNumberData('vibrate', vibrate ? 1 : 0);
    }

    public static getCellData(): string {
        return DataManager.getStringData('cellData', '');
    }

    public static setCellData(cellData: string): void {
        DataManager.setStringData('cellData', cellData);
    }

    public static getGuide(): boolean {
        return DataManager.getNumberData('guide', 0) === 1;
    }

    public static setGuide(guide: boolean): void {
        DataManager.setNumberData('guide', guide ? 1 : 0);
    }
}
