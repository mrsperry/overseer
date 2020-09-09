class Settings {
    /** The main content modal */
    private static modal: Modal;
    /** Default fallback values used when resetting */
    private static reset: any = {
        "mainColor": "#5CD670",
        "accentColor": "#ADEAB7"
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
    }

    /**
     * Displays the settings menu
     */
    public static show(): void {
        Settings.modal = new Modal("settings");

        const content: any = Settings.modal.getContent();
        // Set the header
        $("<h1>")
            .text("Settings")
            .appendTo(content);

        // Create the main color picker
        const mainColor: any = $("<div>")
            .addClass("color-picker")
            .appendTo(content);
        $("<span>")
            .text("Main color: ")
            .appendTo(mainColor);
        Settings.mainPicker = $("<input>")
            .attr("id", "main-color")
            .attr("type", "color")
            .attr("value", Settings.mainColor)
            .on("input change", (event: any): void => Settings.updateColor(event.target.value, false))
            .appendTo(mainColor);
        $("<p>")
            .addClass("clickable-no-click")
            .text("Example text")
            .appendTo(mainColor);

        // Create the accent color picker
        const accentColor: any = $("<div>")
            .addClass("color-picker")
            .appendTo(content);
        $("<span>")
            .text("Accent color: ")
            .appendTo(accentColor);
        Settings.accentPicker = $("<input>")
            .attr("id", "accent-color")
            .attr("type", "color")
            .attr("value", Settings.accentColor)
            .on("input change", (event: any): void => Settings.updateColor(event.target.value, true))
            .appendTo(accentColor);
        $("<p>")
            .addClass("clickable-no-click active")
            .text("Example text")
            .appendTo(accentColor);

        // Create the reset settings and restart game links
        const resets: any = $("<div>")
            .addClass("resets")
            .appendTo(content);
        $("<a>")
            .addClass("clickable warning")
            .text("Reset settings")
            .click((): void => Settings.resetValues())
            .appendTo(resets);
        $("<a>")
            .addClass("clickable warning")
            .text("Restart game")
            .click((): void => State.reset())
            .appendTo(resets);

        // Add the close button
        const close: any = $("<button>")
            .addClass("bordered")
            .click((): void => Settings.modal.remove())
            .appendTo(content);
        $("<span>")
            .text("Close")
            .appendTo(close);
    }

    /**
     * Saves all settings to the state
     */
    public static save(): void {
        State.setValue("settings.main-color", Settings.mainColor);
        State.setValue("settings.accent-color", Settings.accentColor);
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

        // Change the hue of the main menu image if its displayed
        if (name === "clickable-text") {
            $("#main-menu-image").css("filter", "hue-rotate(" + (Utils.hexToHue(value) - Settings.originalHue) + "deg)");
        }
    }

    /**
     * Resets all settings
     */
    private static resetValues(): void {
        Settings.updateColor(Settings.reset.mainColor, false);
        Settings.updateColor(Settings.reset.accentColor, true);
    }
}