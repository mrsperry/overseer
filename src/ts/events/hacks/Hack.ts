abstract class Hack {
    /** Window interval handler for the countdown */
    private handle: number = 0;
    /** The parent modal of the hack */
    private modal: Modal;

    /** Content section of the hack interface */
    protected content: any;
    /** If the hack will process mouse events */
    protected locked: boolean;

    /**
     * Starts the hack countdown timer
     * @param time The number of seconds to complete the hack before the player fails
     */
    protected constructor(private time: number) {
        this.locked = false;

        // Create the hack modal
        this.modal = new Modal("hack");
        this.content = this.modal.getContent()
            .html(Views.get("hacks/pretext"));

        // Add a link to start the hack
        this.content.children("a").one("click", (): void => this.content.fadeOut(400, (): void => {
            this.content.empty().fadeIn();
            this.handle = window.setInterval((): void => this.countdown(), 1000);

            this.addContent();
        }));

        Stats.increment("hacks", "times-hacked");
    }

    protected addContent(): void {
        // Set the base hack content
        this.content.html(Views.get("hacks/base"));
        this.content.children("h1")
            .children(".hack-countdown")
            .text(this.time);
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
        this.removeInterface(true);

        Messenger.write("Channel <span class='clickable-no-click'>lockdown prevented</span>; resuming automatic data siphoning")
        Stats.increment("hacks", "hacks-solved");
    }

    /**
     * Removes the hack interface when failing a hack
     */
    protected fail(): void {
        this.removeInterface(false);

        Messenger.write("Channel <span class='clickable-no-click active-error'>lockdown complete</span>; cracking functions must be re-run to access the channel");
        Stats.increment("hacks", "hacks-failed");
    }

    /**
     * Removes the hack interface and turns off the countdown timer
     */
    private removeInterface(success: boolean): void {
        window.clearInterval(this.handle);

        // Mark the hack as completed in the state
        State.setValue("hack-type", -1);

        // Don't accept any mouse input
        this.locked = true;

        // Remove the modal
        this.modal.remove(1500);

        // Color the border of the hack depending on the success state
        this.content.addClass(success ? "success" : "fail");
    }

    /**
     * Creates a new hack
     * @param type The type of hack, otherwise random
     * @param level The level of the hack, otherwise equal to the number of network channels
     */
    public static create(type?: number, level?: number): void {
        // Get a random hack type
        if (type === undefined) {
            type = Utils.random(0, 6);
        }

        // Get the hack level
        if (level === undefined) {
            level = ChannelManager.getAllChannels().length;
        }

        // Create the hack
        switch (type) {
            case 0:
                new Cryptogram(level);
                break;
            case 1:
                new HexMatcher(level);
                break;
            case 2:
                if (Settings.isSettingEnabled("poor-eyesight-features")) {
                    Hack.create();
                } else {
                    new HiddenPasswords(level);
                }
                break;
            case 3:
                new LogMismatch(level);
                break;
            case 4:
                new NumberMultiples(level);
                break;
            default:
                new OrderedNumbers(level);
                break;
        }
    }
}