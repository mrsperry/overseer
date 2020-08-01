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

        this.addContent();
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

        for (let index: number = 0; index < this.numberOfMultipliers; index++) {
            // Get random multipliers
            let multiplier;
            do {
                multiplier = Utils.random(NumberMultiples.minMultiplier, NumberMultiples.maxMultiplier + 1);
            } while (this.multipliers.includes(multiplier));
            this.multipliers.push(multiplier);

            // Add at one multiple per multiplier
            let multiple;
            do {
                multiple = this.getMultiple(multiplier);
            } while (this.numbers.includes(multiple));
            this.multiples.push(multiple);
            this.numbers.push(multiple);

            // Add this multiplier to the header
            $("<li>")
                .text(multiplier)
                .appendTo(multiplierContainer);
        }

        for (let index: number = 0; index < (this.gridSize * this.gridSize) - 2; index++) {
            // Fill the board with numbers
            let number: number;
            do {
                number = Utils.random(2, this.highestNumber + 1);
            } while (this.numbers.includes(number));
            this.numbers.push(number);

            // Check if the current number is a multiple of a multiplier
            for (const multiplier of this.multipliers) {
                if (number >= multiplier && number % multiplier === 0) {
                    this.multiples.push(number);
                    break;
                }
            }
        }

        // Shuffle the list of numbers
        this.numbers = Utils.shuffle(this.numbers);

        // Create the game board
        for (let x: number = 0; x < this.gridSize; x++) {
            const row: any = $("<tr>")
                .appendTo(table);

            for (let y: number = 0; y < this.gridSize; y++) {
                // Get the number for this cell
                let number: number = this.numbers[(x * this.gridSize) + y];

                const cell: any = $("<td>")
                    .addClass("clickable")
                    .text(number)
                    .click((): void => {
                        // Mark this cell as active
                        cell.addClass("active")
                            .off("click");

                        this.checkMultiple(number);
                    })
                    .appendTo(row);
            }
        }
    }

    /**
     * Checks if a number is a multiple of a multiplier
     * @param number The number to check
     */
    public checkMultiple(number: number): void {
        // Check if the number is a multiple
        let isMultiple: boolean = false;
        for (const multiplier of this.multipliers) {
            if (number >= multiplier && number % multiplier === 0) {
                isMultiple = true;
                break;
            }
        }

        if (!isMultiple) {
            this.fail();
        } else {
            // Remove this multiple from the list of multiples
            this.multiples.splice(this.multiples.indexOf(number), 1);

            if (this.multiples.length === 0) {
                this.success();
            }
        }
    }

    /**
     * Gets a random multiple of a multiplier
     * @param multiplier The multiplier to use
     */
    private getMultiple(multiplier: number): number {
        let multiple: number;
        do {
            // Find a multiple of the multiplier below the highest number allowed
            multiple = multiplier * Utils.random(2, Math.floor(this.highestNumber / multiplier));
        } while (this.multiples.includes(multiple));

        return multiple;
    }
}