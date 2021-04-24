import React from "react";
import { hot } from "react-hot-loader";
import MainMenu from "./menus/main-menu/MainMenu";
import "../sass/base.scss";
import "./App.scss";
import { useSelector } from "react-redux";
import { settingsState } from "./menus/settings-menu/settingsSlice";
import SettingsMenu from "./menus/settings-menu/SettingsMenu";

const App = () => {
    return (<>
        {useSelector(settingsState.isDisplayed) ? <SettingsMenu/> : ""}
        <MainMenu/>
    </>);
};
export default hot(module)(App);