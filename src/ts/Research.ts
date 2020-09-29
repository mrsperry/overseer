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
        if (Progression.hasTriggered("start")) {
            Research.displayResearchSection();
        }

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
    public static addReliability(amount: number | string, count: boolean = true): void {
        // Guarantee the input amount is a number
        amount = Number.parseFloat(amount.toString());

        if (amount > 0) {
            Research.displayResearchSection();
        }

        Research.reliability += amount;
        
        // Make sure reliability never goes below zero
        Research.reliability = Math.max(Research.reliability, 0);

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
        for (let index: number = 0; index < Research.data.length; index++) {
            // Get the research option
            const option: any = Research.data[index];
            // Check if this option is a choice
            const isChoice: boolean = Array.isArray(option);
            // Calculate the cost of this option
            const base: number = index + 1;
            let cost: number = Research.baseCost * (base === 1 ? 1 : (base - 1) * Research.costExponent);
            // Round the fraction of the cost to the nearest 25th
            let fraction: number = cost - Math.floor(cost);
            fraction -= fraction % 0.25;
            cost = Math.floor(cost) + fraction;
            // Check if this option should be disabled
            const disabled: boolean = Research.reliability < cost;

            // If the option is already displayed update its disable state
            const element: any = $("#research-" + index);
            if (element.length !== 0) {
                if (isChoice) {
                    for (const child of element.children("button")) {
                        $(child).prop("disabled", disabled);
                    }
                    continue;
                } else {
                    element.prop("disabled", disabled);
                    continue;
                }
            }

            // Check if this option has been purchased
            if (Research.purchased.includes(index)) {
                continue;
            }

            // Check if there is not enough reliability to display (reliability <= display cost)
            if (Research.reliability < Research.baseDisplay * (base === 1 ? 1 : (base - 1) * Research.costExponent)) {
                continue;
            }

            // Check if the option's threat level is not greater than the current threat level
            const threatLevel: number = DiskManager.getThreatLevel();
            if (isChoice) {
                if ((threatLevel < option[0].level)) {
                    continue;
                }
            } else if (threatLevel < option.level) {
                continue;
            }

            // Limit the number of displayed options
            if ($("#research").children().length === Research.maxDisplayed + 1) {
                return;
            }

            const createButton: any = (data: any, showCost: boolean): any => {
                const button: any = $("<button>")
                    .addClass("bordered")
                    .prop("disabled", disabled);

                // Add the option's content
                $("<span>")
                    .text(data.title)
                    .appendTo(button);
                $("<span>")
                    .text("+" + Utils.formatID(data.type) + (showCost ? " (" + cost + ")" : ""))
                    .appendTo(button);

                return button;
            };

            // Create the element
            let parent: any;
            if (isChoice) {
                parent = $("<div>").addClass("option-choice");

                // Create the first option
                const button1: any = createButton(option[0], false)
                    .appendTo(parent);
                
                // Add the cost and decoration between options
                $("<span>")
                    .addClass("pointer")
                    .text("<")
                    .appendTo(parent);
                $("<span>")
                    .text(cost)
                    .appendTo(parent);
                $("<span>")
                    .addClass("pointer")
                    .text(">")
                    .appendTo(parent);

                // Create the second button
                const button2: any = createButton(option[1], false).appendTo(parent);

                // Create the click event for both buttons
                const purchase: any = (type: string): void => {
                    Research.purchaseResearch(index, type);

                    parent.fadeOut(400, (): void => {
                        parent.remove();

                        Research.displayResearch();
                    });
                };

                // Set the click events
                button1.one("click", (): void => purchase(option[0].type));
                button2.one("click", (): void => purchase(option[1].type));
            } else {
                parent = createButton(option, true)
                    .one("click", (): void => {
                        // Remove this option and display a new one if available
                        parent.fadeOut(400, (): void => {
                            parent.remove();

                            Research.displayResearch();
                        });
                        
                        Research.purchaseResearch(index, option.type);
                    });
            }

            // Append the option with shared properties added
            parent.hide()
                .attr("id", "research-" + index)
                .delay(Research.displayDelay * (index + 1))
                .fadeIn()
                .appendTo("#research");
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
                CoreManager.addCore();
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
            case "add-channel":
                ChannelManager.addChannel();
                Messenger.write("Packet connection stable and ready for <span class='clickable-no-click'>channel cracking</span> functions");
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

    private static displayResearchSection(): void {
        $("#research").fadeIn().css("display", "flex");
    }
}