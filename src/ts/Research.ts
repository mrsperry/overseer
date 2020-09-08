class Research {
    /** The maximum number of research options to display at once */
    private static maxDisplayed: number = 5;
    /** The delay to use when displaying multiple research options at the same time */
    private static displayDelay: number = 50;
    /** The base cost to use for research options */
    private static baseCost: number = 0.75;
    /** The base cost to use for displaying research options */
    private static baseDisplay: number = 0.5;
    /** Exponent used when calculating the cost of research options */
    private static costExponent: number = 2.35;

    /** An array containing all research options */
    private static data: any[];
    /** An array containing the index of every purchased research option */
    private static purchased: number[];
    /** The current reliability of the player */
    private static reliability: number = 0;

    /**
     * Sets the initial reliability rating and marks research options as purchased
     */
    public static async initialize(): Promise<any> {
        Research.data = await $.getJSON("src/data/research.json");
        Research.purchased = State.getValue("research.purchased") || [];

        Research.addReliability(State.getValue("research.reliability") || 0, false);
    }

    /**
     * Save all research data to the state
     */
    public static save(): void {
        State.setValue("research.purchased", Research.purchased);
        State.setValue("research.reliability", Research.reliability);
    }

    /**
     * Adds a given amount of reliability to the player
     * @param amount The amount of reliability to add
     * @param count If this amount should be used in stats
     */
    public static addReliability(amount: number, count: boolean = true): void {
        Research.reliability += amount;

        $("#research").children(".reliability")
            .text("Reliability: " + Research.reliability.toFixed(2));

        Research.displayResearch();

        Stats.useHighest("research", "highest-reliability", this.reliability);
        if (count) {
            Stats.useHighest("research", "highest-reliability-gain", amount);
        }
    }

    /**
     * Displays available research options
     */
    private static displayResearch(): void {
        for (let index: number = 1; index <= Research.data.length; index++) {
            // Get the research option
            const item: any = Research.data[index - 1];
            // Calculate the cost of this research option
            let cost: number = Research.baseCost * (index === 1 ? 1 : (index - 1) * Research.costExponent);
            // Round the fraction of the cost to the nearest 25th
            let fraction: number = cost - Math.floor(cost);
            fraction -= fraction % 0.25;
            cost = Math.floor(cost) + fraction;
            // Check if this option should be disabled (reliability <= cost)
            const disabled: boolean = Research.reliability < cost;

            // If the option is already displayed update its disable state
            const child: any = $("#research-" + index);
            if (child.length !== 0) {
                $(child).prop("disabled", disabled);
                continue;
            }

            // Check if this option has been purchased
            if (Research.purchased.includes(index)) {
                continue;
            }

            // Check if there is not enough reliability to display (reliability <= display cost)
            if (Research.reliability < Research.baseDisplay * (index === 1 ? 1 : (index - 1) * Research.costExponent)) {
                continue;
            }

            // Check if the options threat level is not greater than the current threat level
            if (DiskManager.getThreatLevel() < item.level) {
                continue;
            }

            // Limit the number of displayed options
            if ($("#research").children("button").length === Research.maxDisplayed) {
                return;
            }

            // Create the element
            const parent: any = $("<button>")
                .attr("id", "research-" + index)
                .addClass("bordered")
                .prop("disabled", disabled)
                .click((): void => {
                    Research.purchaseResearch(index, item.type);

                    parent.prop("disabled", true)
                        .fadeOut(400, (): void => {
                            parent.remove();

                            Research.displayResearch();
                        });
                })
                .hide()
                .delay(Research.displayDelay * index)
                .fadeIn()
                .appendTo("#research");
            $("<span>")
                .text(item.title)
                .appendTo(parent);
            $("<span>")
                .text("+" + Utils.formatID(item.type) + " (" + cost + ")")
                .appendTo(parent);
        }
    }

    /**
     * @param index The index number of the research
     * @param type The type of research to purchase
     */
    public static purchaseResearch(index: number, type: string): void {
        Research.purchased.push(index);
        Stats.increment("research", "research-purchased");

        switch (type) {
            case "add-core":
                CoreManager.addCore(1);
                Messenger.write("New core online; auxillary <span class='clickable-no-click'>task processing</span> is available");
                break;
            case "core-speeds":
                CoreManager.upgradeCoreSpeeds();
                Messenger.write("Primary cores cleared for additional <span class='clickable-no-click'>overclocking</span> and recycling");
                break;
            case "add-disk":
                DiskManager.addDisk(false);
                Messenger.write("Additional <span class='clickable-no-click'>disk drive</span> mounted and initialized");
                break;
            case "disk-size":
                DiskManager.upgradeDiskStorage();
                Messenger.write("Disk drive <span class='clickable-no-click'>storage</span> has been greatly expanded");
                break;
            case "threat-level":
                DiskManager.addThreatLevel();
                DiskManager.addDisk(true);
                Messenger.write("Disk fabrication and <span class='clickable-no-click'>quarantine zone</span> conversion complete");
                break;
        }
    }

    /**
     * Increases the cost of all research and corrects the display cost accordingly
     * @param amount The amount to increment by
     */
    public static incrementExponent(amount: number): void {
        Research.costExponent += 0.09 * amount;
        Research.baseDisplay += 0.1;
    }
}