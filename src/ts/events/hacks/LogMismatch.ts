class LogMismatch extends Hack {
    /** The number of characters in each hex string */
    private static hexLength: number = 7;
    /** Data for each level of this hack */
    private static levels: any[] = [
        {
            "time": 35,
            "rows-per-list": 5,
            "mismatches": 3
        },
        {
            "time": 50,
            "rows-per-list": 6,
            "mismatches": 5
        },
        {
            "time": 65,
            "rows-per-list": 7,
            "mismatches": 8
        }
    ];

    /** The number of rows per list (always two lists side by side) */
    private rowsPerList: number;
    /** The number of mismatches in the rows */
    private mismatches: number;
    /** The indices of each mismatched row */
    private mismatchRows: number[];
    /** The number of mismatches found */
    private mismatchesFound: number;

    /**
     * Creates a new LocMismatch hack
     * @param channel The channel this hack affects
     * @param level The level of this hack
     */
    public constructor(channel: number, level: number) {
        const data: any = LogMismatch.levels[level - 1];
        super(channel, data.time);

        this.rowsPerList = data["rows-per-list"];
        this.mismatches = data.mismatches;
        this.mismatchRows = [];
        this.mismatchesFound = 0;
    }

    /**
     * Creates the game board for this hack
     */
    protected addContent(): void {
        super.addContent();

        // Add the mismatches header
        const header: any = $("<h1>")
            .text("Log mismatches remaining: ")
            .appendTo(this.content);
        const mismatches: any = $("<span>")
            .addClass("clickable-no-click")
            .text(this.mismatches)
            .appendTo(header);

        // Create the main content section
        const parent: any = $("<section>")
            .addClass("log-mismatch")
            .appendTo(this.content);

        // Each row that has been created
        const rows: any[] = [];

        // Make two lists side by side
        for (let lists: number = 0; lists < 2; lists++) {
            const list: any = $("<ul>")
                .appendTo(parent);

            // Fill in the lists with values
            for (let index: number = 0; index < this.rowsPerList; index++) {
                const item: any = $("<li>")
                    .appendTo(list);

                // Get a random hex string
                const hex: string = Utils.getHexString(LogMismatch.hexLength);
                $("<span>")
                    .text(hex + " - ")
                    .appendTo(item);
                
                // Create the potentially mismatched value
                const value: any = $("<span>")
                    .addClass("clickable match")
                    .text(hex)
                    .one("click", (): void => {
                        if (this.locked) {
                            return;
                        }
    
                        // Check if this row is a mismatch
                        if (this.markMismatch(index + (this.rowsPerList * lists))) {
                            value.addClass("active");
                        } else {
                            value.addClass("active-error");
                        }

                        // Update the mismatch counter
                        mismatches.text(this.mismatches - this.mismatchesFound);
                    })
                    .appendTo(item);
                
                // Add this row
                rows.push(value);
            }
        }

        // A list of every row that a mismatch is present in
        const takenRows: number[] = [];
        for (let index: number = 0; index < this.mismatches; index++) {
            // Get a random row
            let row: number;
            do {
                row = Utils.random(0, rows.length);
            } while (takenRows.includes(row));
            takenRows.push(row);

            // Get the row element
            const item: any = $(rows[row]);
            // Get the hex value in the row
            const hex: string = item.text();

            // Get a random index to replace a letter
            const replacementIndex: number = Utils.random(2, hex.length);
            // Get a random replacement letter (can't be equal to the previous letter)
            let replacement: string;
            do {
                replacement = Utils.getHexString(1)[2];
            } while (replacement === hex[replacementIndex]);

            // Set the mismatch
            item.text(hex.substring(0, replacementIndex) + replacement + hex.substring(replacementIndex + 1, hex.length));
            
            this.mismatchRows.push(row);
        }
    }

    /**
     * Checks if a row con
     * @param row The row index to check
     */
    private markMismatch(row: number): boolean {
        // Check if a correctly matched row was clicked
        if (!this.mismatchRows.includes(row)) {
            super.fail();

            Stats.increment("hacks", "log-mismatches-failed");

            return false;
        }
        
        // Check if the max number of matches has been found
        if (++this.mismatchesFound === this.mismatches) {
            super.success();

            Stats.increment("hacks", "log-mismatches-solved");
        }

        return true;
    }
}