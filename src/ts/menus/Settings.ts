class Settings {
    /** The main content modal */
    private static modal: Modal;
    /** Default fallback values used when resetting */
    private static reset: any = {
        "mainColor": "#5CD670",
        "accentColor": "#ADEAB7",
        "toggles": {
            "stop-searching-automatically": false,
            "poor-eyesight-features": false
        }
    };

    /** The main color currently in use */
    private static mainColor: string;
    /** The main color picker element */
    private static mainPicker: any;
    /** The accent color currently in use */
    private static accentColor: string;
    /** The accent color picker element */
    private static accentPicker: any;
    /** The original hue of the main color */
    private static originalHue: number = Utils.hexToHue(Settings.reset.mainColor);

    /** Object containing all toggle states */
    private static toggles: any;

    /**
     * Initializes all settings
     */
    public static initialize(): void {
        // Set the main color
        Settings.mainColor = State.getValue("settings.main-color") || Settings.reset.mainColor;
        // Set the clickable text color
        Settings.setColorVariable("clickable-text", Settings.mainColor);

        // Set the accent color
        Settings.accentColor = State.getValue("settings.accent-color") || Settings.reset.accentColor;
        // Set the accent text color
        Settings.setColorVariable("clickable-text-hover", Settings.accentColor);

        // Set the toggles
        Settings.toggles = State.getValue("settings.toggles") || Settings.reset.toggles;
    }

    /**
     * Displays the settings menu
     */
    public static show(): void {
        Settings.modal = new Modal("settings");

        const content: any = Settings.modal.getContent()
            .html(Views.get("menus/settings"));

        // Set the color and events for the main picker
        Settings.mainPicker = $("#main-color")
            .attr("value", Settings.mainColor)
            .on("input change", (event: any): void => Settings.updateColor(event.target.value, false));

        // Set the color and events for the accent picker
        Settings.accentPicker = $("#accent-color")
            .attr("value", Settings.accentColor)
            .on("input change", (event: any): void => Settings.updateColor(event.target.value, true));
    
        for (const id in Settings.toggles) {
            const element: any = $("#" + id);

            // Set the enable and disable click events
            const enable: any = $(element).children("button:first-child");
            enable.click((): void => Settings.toggleSetting(id, true));

            const disable: any = $(element).children("button:last-child");
            disable.click((): void => Settings.toggleSetting(id, false));

            // Set the enable state
            Settings.toggleSetting(id, Settings.toggles[id] || false);
        }

        // Set the reset click events
        $("#reset-settings").click((): void => Settings.resetValues());
        $("#restart-game").click((): void => State.reset());

        // Set the close button's click event
        content.children("button")
            .click((): void => Settings.modal.remove());
    }

    /**
     * Saves all settings to the state
     */
    public static save(): void {
        State.setValue("settings.main-color", Settings.mainColor);
        State.setValue("settings.accent-color", Settings.accentColor);
        State.setValue("settings.toggles", Settings.toggles);
    }

    /**
     * @param setting The setting ID to check
     * @returns If the setting is enabled
     */
    public static isSettingEnabled(setting: string): boolean {
        return Settings.toggles[setting] || false;
    }

    /**
     * Updates a color picker
     * @param value The newly selected hex value
     * @param hover If this color is the accent color
     */
    private static updateColor(value: string, hover: boolean): void {
        // Set the global CSS variable
        Settings.setColorVariable("clickable-text" + (hover ? "-hover" : ""), value);

        // Set the color picker values
        if (hover) {
            Settings.accentColor = value;
            Settings.accentPicker.get(0).value = value;
        } else {
            Settings.mainColor = value;
            Settings.mainPicker.get(0).value = value;
        }
    }

    /**
     * Sets a CSS variable
     * @param name The name of the variables
     * @param value The value to set
     */
    private static setColorVariable(name: string, value: string): void {
        $("body").get(0).style.setProperty("--" + name, value);

        if (name === "clickable-text") {
            // Change the hue of the main menu image if its displayed
            $("#main-menu-image").css("filter", "hue-rotate(" + (Utils.hexToHue(value) - Settings.originalHue) + "deg)");
        
            // Try to change the data core color
            // This will error if the color is changed in the main menu
            try {
                DataCore.resetData(ChannelManager.getDisplayedChannel().getProgress());
            } catch (exception) { }
        }
    }

    /**
     * Toggles a setting on or off
     * @param id The setting ID to toggle
     * @param enabled If the setting should be turned on or off
     */
    private static toggleSetting(id: string, enabled: boolean): void {
        const parent: any = $("#" + id);
        const enable: any = parent.children("button:first-child");
        const disable: any = parent.children("button:last-child");

        if (enabled) {
            enable.addClass("active");
            disable.removeClass("active");
        } else {
            enable.removeClass("active");
            disable.addClass("active");
        }

        Settings.toggles[id] = enabled;
    }

    /**
     * Resets all settings
     */
    private static resetValues(): void {
        Settings.updateColor(Settings.reset.mainColor, false);
        Settings.updateColor(Settings.reset.accentColor, true);
    }
}