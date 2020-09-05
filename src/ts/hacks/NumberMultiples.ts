class NumberMultiples extends Hack {
    /** Minimum multiplier value */
    private static minMultiplier: number = 2;
    /** Maximum multiplier value */
    private static maxMultiplier: number = 10;
    /** Data for each level of this hack */
    private static levels: any[] = [
        {
            "time": 20,
            "highest-number": 20,
            "grid-size": 3,
            "multipliers": 2
        },
        {
            "time": 40,
            "highest-number": 30,
            "grid-size": 4,
            "multipliers": 3
        },
        {
            "time": 60,
            "highest-number": 40,
            "grid-size": 5,
            "multipliers": 5
        }
    ];

    /** The highest number that can appear on the board */
    private highestNumber: number;
    /** The width and height of the board */
    private gridSize: number;
    /** The number of multipliers */
    private numberOfMultipliers: number;

    /** Current multipliers for the board */
    private multipliers: number[];
    /** Current multiplies on the board */
    private multiples: number[];
    /** Current numbers on the board */
    private numbers: number[];

    /**
     * Creates a new NumberMultiples hack
     * @param level The level of this hack
     */
    public constructor(level: number) {
        const data: any = NumberMultiples.levels[level - 1];
        super(data.time);

        this.highestNumber = data["highest-number"];
        this.gridSize = data["grid-size"];
        this.numberOfMultipliers = data.multipliers;

        this.multipliers = [];
        this.multiples = [];
        this.numbers = [];
    }

    /**
     * Creates the game board for this hack
     */
    public addContent(): void {
        super.addContent();

        // Add the header
        const parent: any = $("<div>")
            .addClass("number-multiples")
            .appendTo(this.content);
        const header: any = $("<div>")
            .text("Suspected multipliers:")
            .addClass("header centered")
            .appendTo(parent);
        const multiplierContainer: any = $("<ul>")
            .appendTo(header);

        // Add the game board
        const table: any = $("<table>")
            .appendTo(parent);

        // Create the game board
        for (let x: number = 0; x < this.gridSize; x++) {
            const row: any = $("<tr>")
                .appendTo(table);

            for (let y: number = 0; y < this.gridSize; y++) {
                // Get a random unique number to add to the board
                let number: number;
                do {
                    number = Utils.random(2, this.highestNumber + 1);
                } while (this.numbers.includes(number));
                this.numbers.push(number);

                // Create the number's cell
                const cell: any = $("<td>")
                    .addClass("clickable")
                    .text(number)
                    .click((): void => {
                        if (this.locked) {
                            return;
                        }

                        // Mark this cell as active
                        cell.addClass(this.checkMultiple(number) ? "active" : "active-error")
                            .off("click");
                    })
                    .appendTo(row);
            }
        }

        // Get a list of possible multipliers
        const multipliers: number[] = [];
        for (let multiplier: number = NumberMultiples.minMultiplier; multiplier < NumberMultiples.maxMultiplier + 1; multiplier++) {
            multipliers.push(multiplier);
        }

        const selected: any[] = [];
        while (this.multipliers.length !== this.numberOfMultipliers) {
            // Get a random cell
            let x, y: number;
            do {
                x = Utils.random(0, this.gridSize);
                y = Utils.random(0, this.gridSize);
            } while (selected.includes([x, y]));
            // Record each selected cell
            selected.push([x, y]);

            // Try to find a random multiplier from the list
            for (let multiplierIndex: number = 0; multiplierIndex < multipliers.length; multiplierIndex++) {
                const multiplier: number = multipliers[Utils.random(0, multipliers.length)];

                // Check if the multiplier is unique and the number is evenly divisible by the multiplier
                if (!this.multipliers.includes(multiplier) && this.numbers[(x * this.gridSize) + y] % multiplier === 0) {
                    this.multipliers.push(multiplier);

                    // Add this multiplier to the header
                    $("<li>")
                        .text(multiplier)
                        .appendTo(multiplierContainer);
                    break;
                }
            }
        }

        // Go through each number and record the multiples of the multipliers
        for (const number of this.numbers) {
            for (const multiplier of this.multipliers) {
                if (number % multiplier === 0) {
                    this.multiples.push(number);
                    break;
                }
            }
        }
    }

    /**
     * Checks if a number is a multiple of a multiplier
     * @param number The number to check
     * @returns If the number was a multiple
     */
    public checkMultiple(number: number): boolean {
        // Check if the number is a multiple
        let isMultiple: boolean = false;
        for (const multiplier of this.multipliers) {
            if (number >= multiplier && number % multiplier === 0) {
                isMultiple = true;
                break;
            }
        }

        if (!isMultiple) {
            super.fail();

            Stats.increment("hacks", "number-multiplies-failed");
            
            return false;
        } else {
            // Remove this multiple from the list of multiples
            this.multiples.splice(this.multiples.indexOf(number), 1);

            if (this.multiples.length === 0) {
                super.success();

                Stats.increment("hacks", "number-multiples-solved");
            }

            return true;
        }
    }
}