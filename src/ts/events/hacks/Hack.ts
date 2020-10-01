abstract class Hack {
    /** The state of the last created hack */
    private static state: any;

    /** Window interval handler for the countdown */
    private handle: number = 0;
    /** The parent modal of the hack */
    private modal: Modal;

    /** Content section of the hack interface */
    protected content: any;
    /** If the hack will process mouse events */
    protected locked: boolean;

    /**
     * Loads a previous hack from the state
     */
    public static initialize(): void {
        const data: any = State.getValue("hack");
        if (data?.isComplete === false) {
            Hack.create(data.channel, data.type, data.level);
        }
    }

    /**
     * Starts the hack countdown timer
     * @param channel The channel this hack affects
     * @param time The number of seconds to complete the hack before the player fails
     */
    protected constructor(private channel: number, private time: number) {
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

        ChannelManager.lockChannel(this.channel);

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

        Hack.state.isComplete = true;
        
        Stats.increment("hacks", "times-hacked");
    }

    /**
     * Creates a new hack
     * @param channel The channel this hack affects
     * @param type The type of hack, otherwise random
     * @param level The level of the hack, otherwise equal to the number of network channels
     */
    public static create(channel: number, type?: number, level?: number): void {
        // Get a random hack type
        if (type === undefined) {
            type = Utils.random(0, 7);
        }

        // Get the hack level
        if (level === undefined) {
            level = ChannelManager.getAllChannels().length;
        }

        // Create the hack
        switch (type) {
            case 0:
                new Cryptogram(channel, level);
                break;
            case 1:
                new DataCorruption(channel, level);
                break;
            case 2:
                new HexMatcher(channel, level);
                break;
            case 3:
                if (Settings.isSettingEnabled("poor-eyesight-features")) {
                    Hack.create(channel);
                } else {
                    new HiddenPasswords(channel, level);
                }
                break;
            case 4:
                new LogMismatch(channel, level);
                break;
            case 5:
                new NumberMultiples(channel, level);
                break;
            default:
                new OrderedNumbers(channel, level);
                break;
        }

        Hack.state = {
            "channel": channel,
            "type": type,
            "level": level,
            "isComplete": false
        };
    }

    /**
     * Saves the most recent hack data to state
     */
    public static save(): void {
        State.setValue("hack", Hack.state);
    }
}