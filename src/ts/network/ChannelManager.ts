class ChannelManager {
    /** A list of all handled channels */
    private static channels: Channel[];
    /** The currently displayed channel */
    private static displayed: Channel;

    /**
     * Loads channels from the state
     */
    public static initialize(): void {
        if (Progression.hasTriggered("channel-unlock")) {
            Utils.showElements(".channels", ".network-tab");
        }

        ChannelManager.channels = [];

        // Deserialize any saved channels
        for (const channel of State.getValue("channels") || []) {
            Channel.deserialize(channel);
        }

        if (ChannelManager.channels.length === 0) {
            ChannelManager.displayChannel(ChannelManager.addChannel());
        }
    }

    /**
     * Adds a new channel
     * @returns The created channel
     */
    public static addChannel(): Channel {
        const channel: Channel = new Channel(ChannelManager.channels.length);
        ChannelManager.channels.push(channel);
        return channel;
    }

    /**
     * Gets a channel with the specified index
     * @param index The index to use
     * @returns The channel at the specified index
     */
    public static getChannel(index: number): Channel {
        return ChannelManager.channels[index];
    }

    /**
     * @returns The currently displayed channel
     */
    public static getDisplayedChannel(): Channel {
        return ChannelManager.displayed;
    }

    /**
     * @returns All registered channels
     */
    public static getAllChannels(): Channel[] {
        return ChannelManager.channels;
    }

    /**
     * Displays a specified channel and its data core
     * @param channel The channel to display
     */
    public static displayChannel(channel: Channel): void {
        for (const current of ChannelManager.channels) {
            current.setDisplayed(false);
        }

        channel.setDisplayed(true);
        ChannelManager.displayed = channel;
        DataCore.resetData(channel.getProgress());
    }

    /**
     * Prevents access to a channel
     * @param channel The channel to lock
     */
    public static lockChannel(channel: number): void {
        ChannelManager.getChannel(channel).lock();
    }

    /**
     * Saves all channels to the state
     */
    public static save(): void {
        const channels: any[] = [];
        for (const channel of ChannelManager.channels) {
            channels.push(channel.serialize());
        }

        State.setValue("channels", channels);
    }
}