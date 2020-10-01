class DataCorruption extends Hack {
    /** The number of list columns to create */
    private static numberOfLists: number = 3;
    /** The number of characters in each list item */
    private static hexLength: number = 8;
    /** Data for each level of this hack */
    private static levels: any[] = [
        {
            "time": 30,
            "characters": 4,
            "number-of-corruptions": 5,
            "items-per-row": 5
        },
        {
            "time": 40,
            "characters": 3,
            "number-of-corruptions": 8,
            "items-per-row": 7
        },
        {
            "time": 50,
            "characters": 2,
            "number-of-corruptions": 12,
            "items-per-row": 10
        }
    ];

    /** The number of characters in the corruption string */
    private characters: number;
    /** The corrupted string that must be found */
    private corruptedString: string;
    /** The total number of corruptions */
    private numberOfCorruptions: number;
    /** The total number of corruptions found */
    private corruptionsFound: number;
    /** The number of items in each list column */
    private itemsPerRow: number;
    /** All corrupted rows */
    private corruptedRows: any[];

    /**
     * Creates a new DataCorruption hack
     * @param channel The channel this hack affects
     * @param level The level of this hack
     */
    public constructor(channel: number, level: number) {
        const data: any = DataCorruption.levels[level - 1];
        super(channel, data.time);

        this.characters = data.characters;
        // Get a random hex string without a prefix
        this.corruptedString = Utils.getHexString(this.characters, false);
        this.numberOfCorruptions = data["number-of-corruptions"];
        this.corruptionsFound = 0;
        this.itemsPerRow = data["items-per-row"];
        this.corruptedRows = [];
    }

    /**
     * Create the game board for this hack
     */
    protected addContent(): void {
        super.addContent();

        // Add the header
        const header: any = $("<h1>")
            .text("Data corruption detected: ")
            .appendTo(this.content);
        $("<span>")
            .addClass("clickable-no-click")
            .text("\"" + this.corruptedString + "\"")
            .appendTo(header);

        // Create the main content container
        const parent: any = $("<section>")
            .addClass("data-corruption")
            .appendTo(this.content);

        // Add all the non-corrupted rows
        const rows: any[] = [];
        for (let lists: number = 0; lists < DataCorruption.numberOfLists; lists++) {
            const list: any = $("<ul>")
                .appendTo(parent);

            for (let index: number = 0; index < this.itemsPerRow; index++) {
                // Make sure random hex codes don't contain the corrupted sequence
                let hex: string;
                do {
                    hex = Utils.getHexString(DataCorruption.hexLength);
                } while (hex.includes(this.corruptedString));

                // Add the row
                const item: any = $("<li>")
                    .addClass("clickable")
                    .text(hex)
                    .one("click", (): void => this.checkCorruption(item))
                    .appendTo(list);

                rows.push(item);
            }
        }

        // Randomly corrupt rows
        for (let index: number = 0; index < this.numberOfCorruptions; index++) {
            // Make sure a row can't be corrupted twice
            let row: any;
            do {
                row = $(rows[Utils.random(0, rows.length)]);
            } while (row.hasClass("corrupted"));

            // Get the rows hex code
            const hex: string = row.text();
            // Get a random index to replace
            const replacementIndex: number = Utils.random(2, hex.length - this.characters);

            // Replace the code
            row.addClass("corrupted")
                .text(hex.substring(0, replacementIndex) + this.corruptedString + hex.substring(replacementIndex + this.characters, hex.length));
            
            this.corruptedRows.push(row);
        }
    }

    /**
     * Check if an element has the corrupted sequence in it
     * @param element The element that was clicked
     */
    private checkCorruption(element: any): void {
        if (super.locked) {
            return;
        }

        if (!element.text().includes(this.corruptedString)) {
            this.fail();

            element.removeClass("clickable")
                .addClass("clickable-no-click active-error");
            return;
        }

        element.addClass("active");

        if (++this.corruptionsFound === this.numberOfCorruptions) {
            super.success();

            Stats.increment("hacks", "data-corruptions-solved");
        }
    }

    /**
     * Called when the player fails to complete the hack
     */
    protected fail(): void {
        super.fail();

        // Light up each corrupted row
        for (const row of this.corruptedRows) {
            if (!row.hasClass("active")) {
                row.removeClass("clickable")
                    .addClass("clickable-no-click active-error")
            }
        }

        Stats.increment("hacks", "data-corruptions-failed");
    }
}