class Utils {
    /**
     * @returns A random number between the min (inclusive) and max (exclusive) rounded down
     */
    public static random(min: number, max: number): number;
    /**
     * @returns A random item in the array or null if no items are present
     */
    public static random(array: any[]): any;
    public static random(arg1: number | any[], arg2?: number | undefined): number | any {
        if (typeof(arg1) === "number" && arg2 !== undefined) {
            // Return random number between min (inclusive) and max (exclusive)
            return Math.floor(Math.random() * (arg2 - arg1)) + arg1;
        } else if (Array.isArray(arg1)) {
            if (arg1.length == 0) {
                return null;
            }

            // Return a random item in the array
            return arg1[Utils.random(0, arg1.length)];
        }
    }

    /**
     *  Durstenfeld shuffle; randomly re-orders an array's contents
     * @param array The array to shuffle
     */
    public static shuffle(array: any[]): any[] {
        const copy: any[] = array.slice(0);

        for (let index: number = copy.length - 1; index > 0; index--) {
            const holder: number = Math.floor(Math.random() * (index + 1));
            [copy[index], copy[holder]] = [copy[holder], copy[index]];
        }

        return copy;
    }

    /**
     * Creates an array of unique items
     * @param data The array of data to get elements from
     * @param amount The number of elements in the unique array
     * @param limit The max number of operations before the unique array is returned (default 1000)
     */
    public static createUniqueList(data: any[], amount: number, limit?: number): any[] {
        const result: any[] = [];

        let counter: number = 0;
        while (result.length < amount && counter < (limit || 100)) {
            const item: any = data[Utils.random(0, data.length)];

            if (!result.includes(item)) {
                result.push(item);
            }

            counter++;
        }

        return result;
    }
}