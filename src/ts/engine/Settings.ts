class Settings {
    private static modal: Modal;

    public static show(): void {
        Settings.modal = new Modal("settings");

        const content: any = Settings.modal.getContent();
        $("<h1>")
            .text("Settings")
            .appendTo(content);

        const mainColor: any = $("<div>")
            .addClass("color-picker")
            .appendTo(content);
        $("<label>")
            .attr("for", "main-color")
            .text("Main color: ")
            .appendTo(mainColor);
        $("<input>")
            .attr("id", "main-color")
            .attr("type", "color")
            .attr("value", "#5CD670")
            .on("input", (event: any): void => Settings.updateColor(event.target.value, false))
            .appendTo(mainColor);
        $("<p>")
            .addClass("clickable-no-click")
            .text("Example text")
            .appendTo(mainColor);

        const accentColor: any = $("<div>")
            .addClass("color-picker")
            .appendTo(content);
        $("<label>")
            .attr("for", "accent-color")
            .text("Accent color: ")
            .appendTo(accentColor);
        $("<input>")
            .attr("id", "accent-color")
            .attr("type", "color")
            .attr("value", "#ADEAB7")
            .on("input", (event: any): void => Settings.updateColor(event.target.value, true))
            .appendTo(accentColor);
        $("<p>")
            .addClass("clickable-no-click active")
            .text("Example text")
            .appendTo(accentColor);

        const close: any = $("<button>")
            .addClass("bordered")
            .click((): void => Settings.modal.remove())
            .appendTo(content);
        $("<span>")
            .text("Close")
            .appendTo(close);
    }

    private static updateColor(value: any, hover: boolean): void {
        $("body").get(0).style.setProperty("--clickable-text" + (hover ? "-hover" : ""), value);
    }
}