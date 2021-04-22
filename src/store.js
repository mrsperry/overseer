import { combineReducers, configureStore, createStore } from "@reduxjs/toolkit";
import Settings from "./components/menus/settings-menu/settingsSlice";

const rootReducer = combineReducers({
    settings: Settings
});

export const store = createStore(rootReducer);