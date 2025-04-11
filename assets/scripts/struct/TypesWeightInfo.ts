export class TypesWeightInfo {
    public id: number = 0;

    public weight: number = 0;

    public value1: number = 0;
    public value2: number = 0;
    public value3: number = 0;
    public value4: number = 0;
    public value5: number = 0;
    public value6: number = 0;

    constructor(id: number, weight: number, value1: number, value2: number, value3: number, value4: number, value5: number = 0, value6: number = 0) {
        this.id = id;
        this.weight = weight;
        this.value1 = value1;
        this.value2 = value2;
        this.value3 = value3;
        this.value4 = value4;
        this.value5 = value5;
        this.value6 = value6;
    }
}
