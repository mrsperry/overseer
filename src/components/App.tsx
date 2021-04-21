import * as React from "react";
import { hot } from "react-hot-loader";
import "./App.scss";

class App extends React.Component {
    public render(): React.ReactNode {
        return (
            <section className="app"></section>
        );
    }
}

export default hot(module)(App);