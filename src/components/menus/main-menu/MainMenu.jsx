import React from "react";
import { useDispatch } from "react-redux";
import { setDisplayed } from "../settings-menu/settingsSlice";
import Logo from "./logo.png";
import "./MainMenu.scss";

const MainMenu = () => {
    const dispatch = useDispatch();

    return (
        <section className="main-menu">
            <img alt="A dark gray shield with a green circle in the center" src={Logo}/>
            <h1>Overseer</h1>
            <button className="bordered-button">
                <span>Start Game</span>
            </button>
            <button onClick={() => dispatch(setDisplayed(true))} className="bordered-button">
                <span>Settings</span>
            </button>
            <button className="bordered-button">
                <span>Statistics</span>
            </button>
            <a className="bordered-button" href="https://github.com/mrsperry/overseer/wiki" target="_blank" rel="noreferrer">
                <span>Help &amp; Wiki</span>
            </a>
            <a className="bordered-button" href="https://github.com/mrsperry/overseer" target="_blank" rel="noreferrer">
                <span>Github</span>
            </a>
        </section>
    );
};
export default React.memo(MainMenu);