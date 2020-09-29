class ChannelDetection {
    /** The min chance to increase detection */
    private static minIncreaseChance: number = 8;
    /** The max chance to increase detection */
    private static maxIncreaseChance: number = 16;
    /** The min chance to decrease detection */
    private static minDecreaseChance: number = 5;
    /** The max chance to decrease detection */
    private static maxDecreaseChance: number = 12;

    /**
     * Starts the channel detection timer
     */
    public static initialize(): void {
        window.setInterval(ChannelDetection.update, 1000);
    }

    /**
     * @returns If a detection level should increase
     */
    public static shouldIncreaseDetection(): boolean {
        const chance: number = Utils.random(ChannelDetection.minIncreaseChance, ChannelDetection.maxIncreaseChance);
        return chance > Utils.random(0, 100);
    }

    /**
     * @param detection The current detection level
     * @returns If a hack should be generated with the given detection level
     */
    public static shouldGenerateHack(detection: number): boolean {
        return detection > Utils.random(0, 100);
    }

    /**
     * Decreases the detection increase chances by 1%
     */
    public static decrementIncreaseChance(): void {
        ChannelDetection.minIncreaseChance--;
        ChannelDetection.maxIncreaseChance--;
    }

    /**
     * Increases the detection decrease chances by 3%
     */
    public static incrementDecreaseChance(): void {
        ChannelDetection.minDecreaseChance += 3;
        ChannelDetection.maxDecreaseChance += 3;
    }

    /**
     * Updates all channel's detection levels
     */
    private static update(): void {
        const channels: Channel[] = ChannelManager.getAllChannels();
        for (const channel of channels) {
            // Don't modify busy channels
            if (channel.getIsBusy()) {
                continue;
            }

            // Check if the detection is already at its lowest
            let detection: number = channel.getDetection();
            if (detection === 0) {
                continue;
            }

            // Check if the detection level should decrease
            const chance: number = Utils.random(ChannelDetection.minDecreaseChance, ChannelDetection.maxDecreaseChance);
            if (chance < Utils.random(0, 100)) {
                continue;
            }

            channel.setDetection(--detection);
        }
    }
}