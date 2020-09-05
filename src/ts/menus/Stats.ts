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
     * Creates a modal with all statistics listed
     */
    public static generateReport(): void {
        const modal: Modal = new Modal("stats");
        const content: any = modal.getContent();

        $("<h1>")
            .text("Statistics")
            .appendTo(content);

        const lists: any =  $("<ul>").appendTo(content);
        for (const namespace in Stats.data) {
            const list: any = $("<ul>").appendTo(lists);
            $("<h2>")
                .text(Utils.capitalize(namespace))
                .appendTo(list);

            for (const stat in Stats.data[namespace]) {
                $("<li>")
                    .text(Utils.formatID(stat) + ": " + Stats.data[namespace][stat])
                    .appendTo(list);
            }
        }

        const close: any = $("<button>")
            .addClass("bordered")
            .click((): void => modal.remove())
            .appendTo(content);
        $("<span>")
            .text("Close")
            .appendTo(close);
    }
}