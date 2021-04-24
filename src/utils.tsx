/**
 * Converts a hex value (#FFAA00) to a hue (0-360)
 * 
 * Hex to RGB code from: https://css-tricks.com/converting-color-spaces-in-javascript/
 * RGB to HSL code from: https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
 * Both methods were adapted to find only the hue from a hex value
 * @param hex The hex string to convert
 * @returns The hue color value
 */
export const hexToHue = (hex: string): number => {
    // Hex to RGB
    let red: number = Number.parseInt("0x" + hex[1] + hex[2], 16);
    let green: number = Number.parseInt("0x" + hex[3] + hex[4], 16);
    let blue: number = Number.parseInt("0x" + hex[5] + hex[6], 16);

    // RGB to HSL
    red /= 255;
    green /= 255;
    blue /= 255;

    const max: number = Math.max(red, green, blue);
    const min: number = Math.min(red, green, blue);

    let hue: number = 0;
    const difference: number = max - min;

    switch (max) {
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
};