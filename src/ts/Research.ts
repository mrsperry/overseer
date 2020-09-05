class Research {
    /** The maximum number of research options to display at once */
    private static maxDisplayed: number = 5;
    /** The delay to use when displaying multiple research options at the same time */
    private static displayDelay: number = 50;

    /** An array containing all research options */
    private static data: any[];
    /** An array containing the index of every purchased research option */
    private static purchased: number[];

    /** The current reliability of the player */
    private static reliability: number = 0;
    /** Exponent used when calculating the cost of research options */
    private static costExponent: number = 3.25;
    /** Exponent used when calculating if research options should be displayed */
    private static displayExponent: number = 2.75;

    /**
     * Sets the initial reliability rating and marks research options as purchased
     */
    public static async initialize(): Promise<any> {
        Research.data = await $.getJSON("src/data/research.json");
        Research.purchased = State.getValue("research.purchased") || [];

        Research.addReliability(State.getValue("research.reliability") || 0);
    }

    /**
     * Adds a given amount of reliability to the player
     * @param amount The amount of reliability to add
     */
    public static addReliability(amount: number): void {
        Research.reliability += amount;

        $("#research").children(".reliability")
            .text("Reliability: " + Research.reliability.toFixed(2));

        Research.displayResearch();

        Stats.useHighest("research", "highest-reliability", this.reliability);
        Stats.useHighest("research", "highest-reliability-gain", amount);
    }

    /**
     * Displays available research options
     */
    private static displayResearch(): void {
        for (let index: number = 1; index <= Research.data.length; index++) {
            // Get the research option
            const item: any = Research.data[index - 1];
            // Check if this option should be disabled (reliability <= cost)
            const disabled: boolean = Research.reliability < 1 + (index * Research.costExponent);

            // If the option is already displayed update its disable state
            const child: any = $("#research-" + index);
            if (child.length !== 0) {
                $(child).prop("disabled", disabled);
                continue;
            }

            // Check if this option has been purchased or if there is not enough reliability to display (reliability <= display cost)
            if (Research.purchased.includes(index) || Research.reliability < 1 + (index * Research.displayExponent)) {
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
                .text("+" + Utils.formatID(item.type) + " (" + (1 + (index * Research.costExponent)) + ")")
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
                break;
            case "core-speeds":
                CoreManager.upgradeCoreSpeeds();
                break;
            case "add-disk":
                DiskManager.addDisk(false);
                break;
            case "disk-size":
                DiskManager.upgradeDiskStorage();
                break;
            case "threat-level":
                DiskManager.addThreatLevel();
                DiskManager.addDisk(true);
                break;
        }
    }
}