class Channel implements ISerializable {
    /** The number of alphanumeric pairs in each channel name */
    private static nameLength: number = 5;

    /** HTML element parent */
    private parent: JQuery<HTMLElement>;
    
    /** The name of this channel */
    private name: string;
    /** The percentage of a hack occurring when siphoning data */
    private detection: number;
    /** The amount of data remaining */
    private remaining: number;

    /** If this channel has been cracked */
    private isCracked: boolean;
    /** If this channel is currently being cracked or siphoned */
    private isBusy: boolean = false;

    /**
     * Creates a new channel
     * @param id The ID of this channel
     */
    public constructor(id: number) {
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
        this.remaining = (id + 1) * 1000;
        this.isCracked = false;

        // Set the on click events for the channel buttons
        const info: any = this.parent.children(".channel-info");
        info.children(".channel-name")
            .click((): void => this.displayDataCore());
        info.children("button")
            .click((): CoreTask => this.createChannelAction(this.isCracked));
    
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
        meta.children(".channel-remaining").text((this.isCracked ? this.remaining + "kb" : "???") + " remaining");
    }

    /**
     * Creates a new channel from state data
     * @param data The data to use
     */
    public static deserialize(data: any): void {
        const channel: Channel = ChannelManager.addChannel();
        channel.name = data.name;
        channel.detection = data.detection;
        channel.remaining = data.remaining;
        channel.isCracked = data.isCracked;
        channel.isBusy = data.isBusy;
        channel.updateInfo();
    }

    /**
     * Create a new channel task
     * @param isCracked If the channel is currently cracked
     */
    public createChannelAction(isCracked: boolean): CoreTask {
        const prefix: string = isCracked ? "Siphoning" : "Cracking";
        const cost: number = isCracked ? 10 : 50;

        const task: CoreTask = CoreTask.create(prefix + " " + this.name, cost, CoreTaskType.Crack)
            .setOnComplete((): void => {
                if (isCracked) {
                    this.remaining--;

                    // Stop this task if there is no data left to siphon
                    if (this.remaining === 0) {
                        task.onCancel();
                    }
                } else {
                    this.isCracked = true;
                    this.isBusy = false;
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
     * Update the data core display
     */
    private displayDataCore(): void {

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
     * @returns The serialized state of this channel
     */
    public serialize(): any {
        return {
            "name": this.name,
            "detection": this.detection,
            "remaining": this.remaining,
            "isCracked": this.isCracked,
            "isBusy": this.isBusy
        };
    }
}