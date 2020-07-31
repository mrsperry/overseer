abstract class Hack {
    /** Window interval handler for the countdown */
    private handle: number;
    /** The parent of the hack interface */
    private parent: any;

    /** Content section of the hack interface */
    protected content: any;

    /**
     * Starts the hack countdown timer
     * @param time The number of seconds to complete the hack before the player fails
     */
    protected constructor(private time: number) {
        this.handle = window.setInterval((): void => this.countdown(), 1000);
    }

    /**
     * Adds the initial hack interface content with the countdown timer
     */
    protected addContent(): void {
        this.parent = $("<div>")
            .addClass("hack-container")
            .hide()
            .fadeIn()
            .appendTo("body");
        $("<div>")
            .addClass("hack-bg")
            .appendTo(this.parent);
        this.content = $("<div>")
            .addClass("hack-content")
            .appendTo(this.parent);

        const header: any = $("<h1>")
            .addClass("centered")
            .text("Time until quarantine breakout: ")
            .appendTo(this.content);
        $("<span>")
            .addClass("hack-countdown clickable-no-click bold")
            .text(this.time)
            .appendTo(header);
    }

    /**
     * Runs every second updating the countdown display; if the time reaches zero then the fail state is called
     */
    private countdown(): void {
        this.content.children("h1")
            .children(".hack-countdown")
            .text(--this.time);

        if (this.time === 0) {
            this.fail();
        }
    }

    /**
     * Removes the hack interface when completing a hack
     */
    protected success(): void {
        this.removeInterface();
    }

    /**
     * Removes the hack interface when failing a hack
     */
    protected fail(): void {
        this.removeInterface();
    }

    /**
     * Removes the hack interface and turns off the countdown timer
     */
    private removeInterface(): void {
        window.clearInterval(this.handle);

        this.parent.fadeOut(400, (): void => {
            this.parent.remove();
        });
    }
}