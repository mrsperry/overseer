import { createSlice } from "@reduxjs/toolkit";
import { hexToHue } from "../../utils";

const initialState = {
    isDisplayed: false,
    originalColors: {
        mainColor: "#5CD670",
        accentColor: "#ADEAB7"
    },
    stopSearchingAutomatically: false
};

// Set initial properties
initialState.mainColor = initialState.originalColors.mainColor;
initialState.accentColor = initialState.originalColors.accentColor;
// Store the main color's hue for hue rotation of the logo image
initialState.originalColors.mainHue = hexToHue(initialState.mainColor);

const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        setDisplayed(state, action) {
            state.isDisplayed = action.payload;
        },
        setColor(state, action) {
            const { isAccent, color } = action.payload;

            if (isAccent) {
                state.accentColor = color;
            } else {
                state.mainColor = color;
            }

            updateColors(isAccent, color);
        },
        setStopSearchingAutomatically(state, action) {
            state.stopSearchingAutomatically = action.payload;
        },
        resetSettings() {
            updateColors(false, initialState.originalColors.mainColor);
            updateColors(true, initialState.originalColors.accentColor);

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
 * @param {boolean} isAccent 
 * @param {string} color 
 */
const updateColors = (isAccent, color) => {
    const body = document.querySelector("body");
    body.style.setProperty("--text" + (isAccent ? "-hover" : ""), color);

    const picker = document.getElementById((isAccent ? "accent" : "main") + "-color");
    picker.value = color;

    const logo = document.querySelector(".main-menu img");
    if (logo.length === 0 || isAccent) {
        return;
    }

    const hue = hexToHue(color) - initialState.originalColors.mainHue;
    logo.style.filter = "hue-rotate(" + hue + "deg) drop-shadow(0 0 0.5rem rgba(0, 0, 0, 0.5))";
};

export const {
    setDisplayed,
    setColor,
    setStopSearchingAutomatically,
    resetSettings
} = settingsSlice.actions;

export const settingsState = {
    isDisplayed: state => state.settings.isDisplayed,
    getMainColor: state => state.settings.mainColor,
    getAccentColor: state => state.settings.accentColor,
    getOriginalMainColor: state => state.settings.originalColors.mainColor,
    getOriginalAccentColor: state => state.settings.originalColor.accentColor,
    getStopSearchingAutomatically: state => state.settings.stopSearchingAutomatically
};