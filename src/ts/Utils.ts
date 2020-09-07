class Utils {
    /**
     * @returns A random number between the min (inclusive) and max (exclusive) rounded down
     */
    public static random(min: number, max: number): number;
    /**
     * @returns A random item in the array or null if no items are present
     */
    public static random(array: any[]): any;
    /**
     * @returns A random boolean
     */
    public static random(): boolean;
    public static random(arg1?: number | any[], arg2?: number | undefined): number | any {
        // Return a random boolean
        if (arg1 === undefined) {
            return Utils.random(0, 2) === 0;
        }

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
     * Durstenfeld shuffle; randomly re-orders an array's contents
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

    /**
     * Creates a random alphanumeric string
     * @param length The length of the string
     * @returns The random alphanumeric string
     */
    public static getAlphanumericString(length: number): string {
        const chars: string[] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");

        let result: string = "";
        for (let index: number = 0; index < length; index++) {
            result += Utils.random(chars);
        }

        return result;
    }

    /**
     * Capitalizes the first letter of a string
     * @param item The string to capitalize
     */
    public static capitalize(item: string): string {
        return item.charAt(0).toUpperCase() + item.substring(1, item.length);
    }

    /**
     * Capitalizes the first letter of an ID string and removes dashes ("i-am-id" -> "I am id")
     * @param id The ID string
     */
    public static formatID(id: string): string {
        const words: string[] = id.split("-");
        words[0] = Utils.capitalize(words[0]);
        return words.join(" ");
    }

    /**
     * Adds commas to a number where appropriate
     * @param number The number to format
     * @returns A string containing the properly formatted number
     */
    public static stringify(number: number): string {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * Converts a hex value (#ABC123) to a hue (0-360)
     * 
     * Hex to RGB code from: https://css-tricks.com/converting-color-spaces-in-javascript/
     * RGB to HSL code from: https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
     * Both methods were adapted to find only the hue from a hex value
     */
    public static hexToHue(hex: string){
        // Hex to RGB
        let red: any = "0x" + hex[1] + hex[2];
        let green: any = "0x" + hex[3] + hex[4];
        let blue: any = "0x" + hex[5] + hex[6];

        // RGB to HSL
        red /= 255;
        green /= 255;
        blue /= 255;

        const max: number = Math.max(red, green, blue);
        const min: number = Math.min(red, green, blue);

        let hue = 0;
        let difference = max - min;

        switch(max){
            case red:
                hue = (green - blue) / difference + (green < blue ? 6 : 0);
                break;
            case green:
                hue = (blue - red) / difference + 2;
                break;
            case blue:
                hue = (red - green) / difference + 4;
                break;
        }

        return hue / 6 * 100 * 3.6;
    }
}