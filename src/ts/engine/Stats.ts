class Stats {
    /** The stat data container */
    private static data: any;

    /**
     * Loads stats from state or the default JSON file
     */
    public static async initialize(): Promise<any> {
        Stats.data = State.getValue("stats") || await $.getJSON("src/data/stats.json");
    }

    /**
     * Increases a stat by one
     * @param namespace The namespace of the stat
     * @param id The ID of the stat
     */
    public static increment(namespace: string, id: string): void {
        Stats.data[namespace][id]++;
    }

    /**
     * Increases a stat by a given amount
     * @param namespace The namespace of the stat
     * @param id The ID of the stat
     * @param amount The amount to increase the stat by
     */
    public static add(namespace: string, id: string, amount: number): void {
        Stats.data[namespace][id] += amount;
    }

    /**
     * Sets a stat to a given value if the value is higher than what the stat currently is
     * @param namespace The namespace of the stat
     * @param id The ID of the stat
     * @param value The value to compare
     */
    public static useHighest(namespace: string, id: string, value: number): void {
        const current: number = Stats.data[namespace][id];

        if (current === undefined || current < value) {
            Stats.data[namespace][id] = value;
        }
    }

    /**
     * Gets a string report of all stats
     */
    public static generateReport(): string {
        let result: string = "";

        for (const namespace in Stats.data) {
            result += "\n" + Utils.capitalize(namespace) + ":\n";
            
            for (const stat in Stats.data[namespace]) {
                result += Utils.formatID(stat) + ": " + Stats.data[namespace][stat] + "\n";
            }
        }

        return result;
    }
}