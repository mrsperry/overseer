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
}