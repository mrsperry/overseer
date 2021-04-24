import { createSlice, PayloadAction, Slice } from "@reduxjs/toolkit";
import { RootState } from "../../../store";
import { hexToHue } from "../../../utils";

interface SettingsState {
    isDisplayed: boolean;
    mainColor: string;
    accentColor: string;
    stopSearchingAutomatically: boolean;
};

const originalMainColor: string = "#5CD670";
const originalAccentColor: string = "#ADEAB7";
// Store the main color's hue for hue rotation of the logo image
const originalMainHue: number = hexToHue(originalMainColor);

const initialState: SettingsState = {
    isDisplayed: false,
    mainColor: originalMainColor,
    accentColor: originalAccentColor,
    stopSearchingAutomatically: false
};

const settingsSlice: Slice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        setDisplayed(state: RootState, action: PayloadAction<string>): void {
            state.isDisplayed = action.payload;
        },
        setColor(state: RootState, action: PayloadAction<{ isAccent: boolean, color: string }>): void {
            const { isAccent, color } = action.payload;

            if (isAccent) {
                state.accentColor = color;
            } else {
                state.mainColor = color;
            }

            updateColors(isAccent, color);
        },
        setStopSearchingAutomatically(state: RootState, action: PayloadAction<boolean>): void {
            state.stopSearchingAutomatically = action.payload;
        },
        resetSettings(): RootState {
            updateColors(false, originalMainColor);
            updateColors(true, originalAccentColor);

            return {
                ...initialState,
                isDisplayed: true
            };
        }
    }
});
export default settingsSlice.reducer;

/**
 * Updates colors when picked from the settings menu
 * 
 * This will update the settings menu color pickers, the body's global CSS variables, and the main logo image
 * 
 * The color string must be a seven character valid hex string, ex: #AB4F82
 * @param isAccent If the color being updated is the accent color
 * @param color The color to use
 */
const updateColors = (isAccent: boolean, color: string): void => {
    // Update the body's CSS variable
    document.documentElement.style.setProperty("--text" + (isAccent ? "-hover" : ""), color);

    // Update the color picker's value
    const picker: HTMLElement | null = document.getElementById((isAccent ? "accent" : "main") + "-color");
    if (picker !== null) {
        (picker as HTMLInputElement).value = color;
    } else {
        console.error("Could not find color picker:", isAccent, color);
    }

    // Update the main menu logo color if the main menu is displayed and the color is not an accent
    const logo: HTMLInputElement | null = document.querySelector(".main-menu img");
    if (logo === null || isAccent) {
        return;
    }

    const hue = hexToHue(color) - originalMainHue;
    logo.style.filter = "hue-rotate(" + hue + "deg) drop-shadow(0 0 0.5rem rgba(0, 0, 0, 0.5))";
};

export const {
    setDisplayed,
    setColor,
    setStopSearchingAutomatically,
    resetSettings
} = settingsSlice.actions;

export const settingsState: any = {
    isDisplayed: (state: RootState): boolean => state.settings.isDisplayed,
    getMainColor: (state: RootState): string => state.settings.mainColor,
    getAccentColor: (state: RootState): string => state.settings.accentColor,
    getStopSearchingAutomatically: (state: RootState): boolean => state.settings.stopSearchingAutomatically
};