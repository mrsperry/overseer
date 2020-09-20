class Channel implements ISerializable {
    /** The number of alphanumeric pairs in each channel name */
    private static nameLength: number = 5;

    /** HTML element parent */
    private parent: JQuery<HTMLElement>;

    /** The name of this channel */
    private name: string;
    /** The percentage of a hack occurring when siphoning data */
    private detection: number;
    /** The amount of data siphoned */
    private siphoned: number;
    /** The amount of data remaining */
    private remaining: number;
    /** The amount of data needed for a memory cube */
    private dataInterval: number;

    /** If this channel's data core is displayed */
    private isDisplayed: boolean;
    /** If this channel has been cracked */
    private isCracked: boolean;
    /** If this channel is currently being cracked or siphoned */
    private isBusy: boolean;

    /**
     * Creates a new channel
     * @param id The ID of this channel
     */
    public constructor(private id: number) {
        // Create the channel parent
        this.parent = $("<div>")
            .addClass("channel")
            .html(Views.get("channel"))
            .hide()
            .fadeIn()
            .appendTo("#channels");

        // Set channel defaults
        this.name = this.generateChannelName();
        this.detection = 0;
        this.siphoned = 0;
        this.remaining = (id + 1) * 1000;
        this.dataInterval = this.remaining / 100;

        this.isCracked = false;
        this.isDisplayed = false;
        this.isBusy = false;

        // Set the on click events for the channel buttons
        const info: any = this.parent.children(".channel-info");
        info.children(".channel-name")
            .on("click", (): void => {
                if (!this.isDisplayed) {
                    ChannelManager.displayChannel(this)
                }
            });
        info.children("button")
            .on("click", (): CoreTask => this.createChannelAction(this.isCracked));
    
        // Set all other info on the display
        this.updateInfo();
    }

    /**
     * Updates all info pertaining to this channel
     */
    private updateInfo(): void {
        // Update the channel info
        const info: any = this.parent.children(".channel-info");
        info.children(".channel-name")
            .text(this.name);
        info.children("button")
            .prop("disabled", this.isBusy || (this.isCracked && this.remaining === 0))
            .text("[" + (this.isCracked ? "siphon" : "crack") + "]");

        // Update the channel meta
        const meta: any = this.parent.children(".channel-meta");
        meta.children(".channel-detection").text("Detection: " + (this.isCracked ? this.detection + "%" : "???"));
        meta.children(".channel-remaining").text((this.isCracked ? Utils.addPostfix(this.remaining) : "???") + " remaining");
    }

    /**
     * Creates a new channel from state data
     * @param data The data to use
     */
    public static deserialize(data: any): void {
        const channel: Channel = ChannelManager.addChannel();
        channel.name = data.name;
        channel.detection = data.detection;
        channel.siphoned = data.siphoned;
        channel.remaining = data.remaining;
        channel.dataInterval = data.dataInterval;
        channel.isDisplayed = data.isDisplayed;
        channel.isCracked = data.isCracked;
        channel.isBusy = data.isBusy;
        channel.updateInfo();
        
        if (channel.isDisplayed) {
            ChannelManager.displayChannel(channel);
        }
    }

    /**
     * Create a new channel task
     * @param isCracked If the channel is currently cracked
     */
    public createChannelAction(isCracked: boolean): CoreTask {
        const prefix: string = isCracked ? "Siphoning" : "Cracking";
        const cost: number = isCracked ? 10 : 50;
        const type: CoreTaskType = isCracked ? CoreTaskType.Siphon : CoreTaskType.Crack;

        const task: CoreTask = CoreTask.create(prefix + " " + this.name, cost, type)
            .setChannel(this)
            .setOnComplete((): void => {
                if (isCracked) {
                    this.siphoned++;
                    this.remaining--;

                    // Update the detection level
                    if (this.detection < 100) {
                        if (ChannelDetection.shouldIncreaseDetection()) {
                            this.detection++;
                        }
                    }

                    // Check if this data interval will give a memory cube
                    if (this.siphoned % this.dataInterval === 0) {
                        // Try to generate a hack
                        if (ChannelDetection.shouldGenerateHack(this.detection)) {
                            Hack.create();
                        }
                    }

                    // Only update the data core if this channel is displayed
                    if (this.isDisplayed) {
                        DataCore.setData(this.getProgress());
                    }

                    // Stop this task if there is no data left to siphon
                    if (this.remaining === 0) {
                        task.onCancel();

                        Messenger.write("Targeted data decryption and <span class='clickable-no-click'>memory core defragmentation</span> complete")
                    }
                } else {
                    this.isCracked = true;
                    this.isBusy = false;

                    Messenger.write("Network <span class='clickable-no-click'>channel access acquired</span>; memory core data siphoning available")
                }

                this.updateInfo();
            })
            .setOnCancel((): void => {
                this.isBusy = false;
                this.updateInfo();
            });

        // Set siphoning as an infinite task
        if (isCracked) {
            task.setIsInfinite(true);
        }
            
        if (task.run()) {
            this.isBusy = true;
            this.updateInfo();
        }

        return task;
    }

    /**
     * Generates a new channel name using random alphanumeric characters
     * 
     * A sample output name may be: FK:8B:WO:BK:T5
     */
    private generateChannelName(): string {
        let result: string = "";
        for (let index: number = 0; index < Channel.nameLength; index++) {
            result += Utils.getAlphanumericString(2).toUpperCase() + ":";
        }

        // Remove the trailing colon
        return result.substring(0, result.length - 1);
    }

    /**
     * Sets if this channel should be displayed
     * 
     * This also adds or removes the active class from channel names
     * @param displayed If this channel should be displayed
     */
    public setDisplayed(displayed: boolean): void {
        this.isDisplayed = displayed;

        const name: any = this.parent.children(".channel-info")
            .children(".channel-name");
        if (displayed) {
            name.addClass("active");
        } else {
            name.removeClass("active");
        }
    }

    /**
     * @returns The ID of this channel
     */
    public getID(): number {
        return this.id;
    }

    /**
     * @returns The detection percentage
     */
    public getDetection(): number {
        return this.detection;
    }

    /**
     * @param detection The new detection percentage
     */
    public setDetection(detection: number): void {
        this.detection = detection;

        this.updateInfo();
    }

    /**
     * @returns The current percentage of data siphoned
     */
    public getProgress(): number {
        return (this.siphoned / (this.remaining + this.siphoned)) * 100;
    }

    /**
     * @returns If this channel has a task modifying it
     */
    public getIsBusy(): boolean {
        return this.isBusy;
    }

    /**
     * @returns The serialized state of this channel
     */
    public serialize(): any {
        return {
            "name": this.name,
            "detection": this.detection,
            "siphoned": this.siphoned,
            "remaining": this.remaining,
            "dataInterval": this.dataInterval,
            "isDisplayed": this.isDisplayed,
            "isCracked": this.isCracked,
            "isBusy": this.isBusy
        };
    }
}