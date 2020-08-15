class Research {
    /** The delay to use when displaying multiple research options at the same time */
    private static displayDelay: number = 50;

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

        this.displayResearch();
    }

    /**
     * Displays available research options
     */
    private static displayResearch(): void {
        for (let index: number = 0; index < Research.data.length; index++) {
            // Get the button element that may not exist
            const button: any = $("#research").children("button").get(index);
            // Get the ID associated with this research option
            const id: any = $(button).attr("id");

            // Since options should be ordered by display cost (and subsequently cost), return if this display cost is too high
            const item: any = Research.data[index];
            if (item.display > Research.reliability) {
                return;
            }

            // Check if the option has been purchased or if it is already displayed
            if (Research.purchased.includes(index) || id !== undefined) {
                if (button !== undefined) {
                    $(button).prop("disabled", Research.reliability < item.cost);
                }
                continue;
            }

            // Create the element
            const parent: any = $("<button>")
                .attr("id", "research-" + index)
                .prop("disabled", Research.reliability < item.cost)
                .click((): void => {
                    Research.purchaseResearch(index, item.type);

                    parent.prop("disabled", true)
                        .fadeOut(400, (): void => parent.hide());
                })
                .hide()
                .delay(Research.displayDelay * index)
                .fadeIn()
                .appendTo("#research");
            $("<span>")
                .text(item.title)
                .appendTo(parent);
            $("<span>")
                .text("+" + Research.formatID(item.type))
                .appendTo(parent);
        }
    }

    /**
     * @param index The index number of the research
     * @param type The type of research to purchase
     */
    public static purchaseResearch(index: number, type: string): void {
        Research.purchased.push(index);

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

    /**
     * Turns an ID to a display string "id-example" -> "Id example"
     * @param id The ID to format
     * @returns The formatted ID
     */
    private static formatID(id: string): string {
        return id.substring(0, 1).toUpperCase() + id.substring(1, id.length).split("-").join(" ");
    }
}