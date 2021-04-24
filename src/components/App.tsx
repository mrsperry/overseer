import * as React from "react";
import MainMenu from "./menus/main-menu/MainMenu";
import "../sass/base.scss";
import "./App.scss";
import { settingsState } from "./menus/settings-menu/settingsSlice";
import SettingsMenu from "./menus/settings-menu/SettingsMenu";
import { selector } from "../hooks";

const App = (): JSX.Element => {
    return (<>
        {selector(settingsState.isDisplayed) ? <SettingsMenu/> : ""}
        <MainMenu/>
    </>);
};
export default App;