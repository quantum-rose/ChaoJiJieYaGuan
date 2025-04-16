import { CountsWeightInfo } from '../struct/CountsWeightInfo';
import { Util } from '../util/Util';

export class CountsWeight {
    public static arr0: CountsWeightInfo[] = [];
    public static arr1: CountsWeightInfo[] = [];
    public static arr2: CountsWeightInfo[] = [];
    public static arr3: CountsWeightInfo[] = [];
    public static arr4: CountsWeightInfo[] = [];
    public static arr5: CountsWeightInfo[] = [];

    public static arr: CountsWeightInfo[][] = [];

    public static init() {
        this.arr0.push(new CountsWeightInfo(1, 60, 4));
        this.arr0.push(new CountsWeightInfo(2, 20, 3));
        this.arr0.push(new CountsWeightInfo(3, 20, 2));

        this.arr1.push(new CountsWeightInfo(1, 25, 6));
        this.arr1.push(new CountsWeightInfo(2, 30, 5));
        this.arr1.push(new CountsWeightInfo(3, 35, 4));
        this.arr1.push(new CountsWeightInfo(4, 10, 2));

        this.arr2.push(new CountsWeightInfo(1, 45, 6));
        this.arr2.push(new CountsWeightInfo(2, 35, 5));
        this.arr2.push(new CountsWeightInfo(3, 10, 4));
        this.arr2.push(new CountsWeightInfo(4, 10, 2));

        this.arr3.push(new CountsWeightInfo(1, 30, 6));
        this.arr3.push(new CountsWeightInfo(2, 35, 5));
        this.arr3.push(new CountsWeightInfo(3, 25, 4));
        this.arr3.push(new CountsWeightInfo(4, 5, 3));
        this.arr3.push(new CountsWeightInfo(5, 5, 2));

        this.arr4.push(new CountsWeightInfo(1, 30, 6));
        this.arr4.push(new CountsWeightInfo(2, 35, 5));
        this.arr4.push(new CountsWeightInfo(3, 20, 4));
        this.arr4.push(new CountsWeightInfo(4, 10, 3));
        this.arr4.push(new CountsWeightInfo(5, 5, 3));

        this.arr.push(this.arr0);
        this.arr.push(this.arr1);
        this.arr.push(this.arr2);
        this.arr.push(this.arr3);
        this.arr.push(this.arr4);
        this.arr.push(this.arr5);
    }

    public static getCount(stepIndex: number): number {
        const arr = this.arr[stepIndex];
        let totalWeight = 0;
        for (const item of arr) {
            totalWeight += item.weight;
        }
        let w = Util.getRandomInt(1, totalWeight);
        for (const item of arr) {
            if (w <= item.weight) {
                return item.value;
            }
            w -= item.weight;
        }
        throw new Error('No item found for the given weight.');
    }

    public static getMaxCount(stepIndex: number): number {
        return this.arr[stepIndex][0].value;
    }
}
