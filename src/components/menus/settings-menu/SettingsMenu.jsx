import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "../../common/modal/Modal";
import {
    resetSettings,
    setColor,
    setDisplayed,
    setStopSearchingAutomatically,
    settingsState
} from "./settingsSlice";
import "./SettingsMenu.scss";

const SettingsMenu = () => {
    const dispatch = useDispatch();

    // Set events for when color pickers change
    useEffect(() => {
        const setEvents = (id, isAccent) => {
            document.getElementById(id).addEventListener("input", (event) => (
                dispatch(setColor({ isAccent, color: event.target.value }))
            ));
        };

        // Register events for the main and accent color picker
        setEvents("main-color", false);
        setEvents("accent-color", true);
    });

    const stopSearching = useSelector(settingsState.getStopSearchingAutomatically);
    const mainColor = useSelector(settingsState.getMainColor);
    const accentColor = useSelector(settingsState.getAccentColor);

    const content = (
        <section className="settings-menu">
            <div className="color-picker">
                <label>
                    Main color:
                    <input id="main-color" type="color" defaultValue={mainColor}/>
                </label>
                <span className="main-text">Main text</span>
            </div>
            <div className="color-picker">
                <label>
                    Accent color:
                    <input id="accent-color" type="color" defaultValue={accentColor}/>
                </label>
                <span className="accent-text">Accent text</span>
            </div>
            <div className="stop-searching-automatically">
                <span>Stop searching automatically:</span>
                <button
                    onClick={() => dispatch(setStopSearchingAutomatically(true))}
                    className={"toggle-button" + (stopSearching ? " active" : "")}>
                    Enabled
                </button>
                <button
                    onClick={() => dispatch(setStopSearchingAutomatically(false))}
                    className={"toggle-button" + (stopSearching ? "" : " active")}>
                    Disabled
                </button>
            </div>
            <div className="resets">
                <button onClick={() => dispatch(resetSettings())} className="text-button warning">Reset settings</button>
                <button className="text-button warning">Restart game</button>
            </div>
        </section>
    );

    const closeButton = {
        text: "Close",
        onClick: () => dispatch(setDisplayed(false))
    };
    return <Modal title="Settings" content={content} closeButton={closeButton}/>;
};
export default React.memo(SettingsMenu);