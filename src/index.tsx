import * as React from "react";
import * as ReactDOM from "react-dom";
import { store } from "./store";
import App from "./components/App";
import { Provider } from "react-redux";

ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById("root")
);