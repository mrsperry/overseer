import { combineReducers, createStore, Reducer, Store } from "@reduxjs/toolkit";
import Settings from "./components/menus/settings-menu/settingsSlice";

const rootReducer: Reducer = combineReducers({
    settings: Settings
});

export const store: Store = createStore(rootReducer);

// Create redux types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;