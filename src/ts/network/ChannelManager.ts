class ChannelManager {
    /** A list of all handled channels */
    private static channels: Channel[];

    /**
     * Loads channels from the state
     */
    public static initialize(): void {
        ChannelManager.channels = [];

        // Deserialize any saved channels
        for (const channel of State.getValue("channels") || []) {
            Channel.deserialize(channel);
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
     * Displays a specified channel and its data core
     * @param channel The channel to display
     */
    public static displayChannel(channel: Channel): void {
        for (const current of ChannelManager.channels) {
            current.setDisplayed(false);
        }

        channel.setDisplayed(true);
        DataCore.resetData(channel.getProgress());
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