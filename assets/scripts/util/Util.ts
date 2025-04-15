export class Util {
    public static getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public static shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    public static insertToMapArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(value);
    }

    public static removeFromMapArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
        if (map.has(key)) {
            const array = map.get(key);
            const index = array.indexOf(value);
            if (index !== -1) {
                array.splice(index, 1);
                if (array.length === 0) {
                    map.delete(key);
                }
            }
        }
    }
}
