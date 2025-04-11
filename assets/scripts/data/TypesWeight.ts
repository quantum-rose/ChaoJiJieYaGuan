import { TypesWeightInfo } from '../struct/TypesWeightInfo';
import { Util } from '../util/Util';

export class TypesWeight {
    public static arr0: TypesWeightInfo[] = [];
    public static arr1: TypesWeightInfo[] = [];
    public static arr2: TypesWeightInfo[] = [];
    public static arr3: TypesWeightInfo[] = [];
    public static arr4: TypesWeightInfo[] = [];
    public static arr5: TypesWeightInfo[] = [];

    public static arr: TypesWeightInfo[][] = [];

    public static init() {
        this.arr0.push(new TypesWeightInfo(1, 50, 1, 1, 1, 1));
        this.arr0.push(new TypesWeightInfo(2, 30, 1, 1, 2, 2));
        this.arr0.push(new TypesWeightInfo(3, 20, 1, 1, 1, 2));

        this.arr1.push(new TypesWeightInfo(1, 30, 1, 1, 1, 1, 1, 1));
        this.arr1.push(new TypesWeightInfo(2, 40, 1, 1, 1, 1, 2, 2));
        this.arr1.push(new TypesWeightInfo(3, 20, 1, 1, 2, 2, 2, 2));
        this.arr1.push(new TypesWeightInfo(4, 10, 1, 1, 2, 2, 1, 1));

        this.arr2.push(new TypesWeightInfo(1, 10, 1, 1, 1, 1, 1, 1));
        this.arr2.push(new TypesWeightInfo(2, 20, 1, 1, 1, 2, 2, 2));
        this.arr2.push(new TypesWeightInfo(3, 40, 1, 1, 2, 2, 3, 3));
        this.arr2.push(new TypesWeightInfo(4, 20, 1, 1, 2, 2, 1, 1));
        this.arr2.push(new TypesWeightInfo(5, 10, 1, 1, 2, 3, 3, 3));

        this.arr3.push(new TypesWeightInfo(1, 5, 1, 1, 1, 1, 1, 1));
        this.arr3.push(new TypesWeightInfo(2, 20, 1, 1, 1, 2, 2, 2));
        this.arr3.push(new TypesWeightInfo(3, 30, 1, 1, 2, 2, 3, 3));
        this.arr3.push(new TypesWeightInfo(4, 25, 1, 2, 2, 3, 3, 3));
        this.arr3.push(new TypesWeightInfo(5, 10, 1, 1, 2, 2, 1, 1));
        this.arr3.push(new TypesWeightInfo(6, 10, 1, 2, 2, 2, 1, 1));

        this.arr4.push(new TypesWeightInfo(1, 5, 1, 1, 1, 1, 2, 2));
        this.arr4.push(new TypesWeightInfo(2, 20, 1, 1, 2, 2, 3, 3));
        this.arr4.push(new TypesWeightInfo(3, 25, 1, 2, 2, 2, 3, 3));
        this.arr4.push(new TypesWeightInfo(4, 15, 1, 2, 2, 3, 3, 3));
        this.arr4.push(new TypesWeightInfo(5, 20, 1, 1, 2, 3, 1, 1));
        this.arr4.push(new TypesWeightInfo(6, 15, 1, 2, 3, 3, 1, 1));

        this.arr.push(this.arr0);
        this.arr.push(this.arr1);
        this.arr.push(this.arr2);
        this.arr.push(this.arr3);
        this.arr.push(this.arr4);
        this.arr.push(this.arr5);
    }

    public static getData(stepIndex: number): number[] {
        const arr = this.arr[stepIndex];
        let totalWeight = 0;
        for (const item of arr) {
            totalWeight += item.weight;
        }
        let w = Util.getRandomInt(1, totalWeight);
        for (const item of arr) {
            if (w <= item.weight) {
                const types = [item.value1, item.value2, item.value3, item.value4];
                if (item.value5 > 0) {
                    types.push(item.value5);
                }
                if (item.value6 > 0) {
                    types.push(item.value6);
                }
                return types;
            }
            w -= item.weight;
        }
        throw new Error('No item found for the given weight.');
    }
}
