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
            .text("Reliability: " + Research.reliability);

        this.displayResearch();
    }

    /**
     * Displays available research options
     */
    private static displayResearch(): void {
        for (let index: number = 0; index < Research.data.length; index++) {
            // Get the ID associated with this research option
            const id: any = $($("#research").children("button").get(index)).attr("id");

            // Check if the option has been purchased or if it is already displayed
            if (Research.purchased.includes(index) || id !== undefined) {
                continue;
            }
            
            // Since options should be ordered by display cost (and subsequently cost), return if this display cost is too high
            const item: any = Research.data[index];
            if (item.display > Research.reliability) {
                return;
            }

            // Create the element
            const parent: any = $("<button>")
                .attr("id", "research-" + index)
                .hide()
                .delay(Research.displayDelay * index)
                .fadeIn()
                .appendTo("#research");
            $("<span>")
                .text(item.title)
                .appendTo(parent);
            $("<span>")
                .text(item.description)
                .appendTo(parent);
        }
    }
}