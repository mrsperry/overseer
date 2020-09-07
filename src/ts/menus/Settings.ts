class Settings {
    private static modal: Modal;

    private static reset: any = {
        "mainColor": "#5CD670",
        "accentColor": "#ADEAB7"
    };

    private static mainColor: string;
    private static mainPicker: any;
    private static accentColor: string;
    private static accentPicker: any;
    private static originalHue: number = Utils.hexToHue(Settings.reset.mainColor);

    /**
     * Initializes all settings
     */
    public static initialize(): void {
        Settings.mainColor = State.getValue("settings.main-color") || Settings.reset.mainColor;
        Settings.setColorVariable("clickable-text", Settings.mainColor);
        Settings.accentColor = State.getValue("settings.accent-color") || Settings.reset.accentColor;
        Settings.setColorVariable("clickable-text-hover", Settings.accentColor);
    }

    public static show(): void {
        Settings.modal = new Modal("settings");

        const content: any = Settings.modal.getContent();
        $("<h1>")
            .text("Settings")
            .appendTo(content);

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

        $("<a>")
            .addClass("clickable")
            .text("Reset settings")
            .click((): void => Settings.resetValues())
            .appendTo(content);
        $("<a>")
            .addClass("clickable warning")
            .text("Restart game")
            .click((): void => State.reset())
            .appendTo(content);

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

    private static updateColor(value: string, hover: boolean): void {
        Settings.setColorVariable("clickable-text" + (hover ? "-hover" : ""), value);

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

    private static resetValues(): void {
        Settings.updateColor(Settings.reset.mainColor, false);
        Settings.updateColor(Settings.reset.accentColor, true);
    }
}