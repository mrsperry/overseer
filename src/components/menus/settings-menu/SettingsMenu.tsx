import * as React from "react";
import Modal from "../../common/modal/Modal";
import {
    resetSettings,
    setColor,
    setDisplayed,
    setStopSearchingAutomatically,
    settingsState
} from "./settingsSlice";
import "./SettingsMenu.scss";
import { dispatch, selector } from "../../../hooks";

const SettingsMenu = (): JSX.Element => {
    // Set events for when color pickers change
    React.useEffect((): void => {
        const setEvents = (id: string, isAccent: boolean): void => {
            const picker: HTMLElement | null = document.getElementById(id);
            if (picker === null) {
                console.error("Could not set color picker events:", id);
                return;
            }

            picker.addEventListener("input", (event: Event): void => {
                if (event.target === null) {
                    console.error("Event target was null:", id);
                    return;
                }

                dispatch(setColor({ isAccent, color: (event.target as HTMLInputElement).value }));
            });
        };

        // Register events for the main and accent color picker
        setEvents("main-color", false);
        setEvents("accent-color", true);
    });

    const stopSearching: boolean = selector(settingsState.getStopSearchingAutomatically);
    const mainColor: string = selector(settingsState.getMainColor);
    const accentColor: string = selector(settingsState.getAccentColor);

    const content: JSX.Element = (
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
                    onClick={(): void => dispatch(setStopSearchingAutomatically(true))}
                    className={"toggle-button" + (stopSearching ? " active" : "")}>
                    Enabled
                </button>
                <button
                    onClick={(): void  => dispatch(setStopSearchingAutomatically(false))}
                    className={"toggle-button" + (stopSearching ? "" : " active")}>
                    Disabled
                </button>
            </div>
            <div className="resets">
                <button onClick={(): void  => dispatch(resetSettings(null))} className="text-button warning">Reset settings</button>
                <button className="text-button warning">Restart game</button>
            </div>
        </section>
    );

    const closeButton: { text: string, onClick: Function } = {
        text: "Close",
        onClick: () => dispatch(setDisplayed(false))
    };

    return <Modal title="Settings" content={content} closeButton={closeButton}/>;
};
export default React.memo(SettingsMenu);