import * as React from "react";
import { hot } from "react-hot-loader";
import MainMenu from "./menus/main-menu/MainMenu";
import "../sass/base.scss";
import "./App.scss";

class App extends React.Component {
    render() {  
        return (
            <MainMenu/>
        );
    }
}

export default hot(module)(App);