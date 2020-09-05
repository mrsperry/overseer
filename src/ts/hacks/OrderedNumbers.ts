class OrderedNumbers extends Hack {
    /**
     * Data for each level of this hack
     */
    private static levels: any[] = [
        {
            "time": 20,
            "max-numbers": 9,
            "numbers-per-row": 3
        },
        {
            "time": 30,
            "max-numbers": 16,
            "numbers-per-row": 4
        },
        {
            "time": 40,
            "max-numbers": 25,
            "numbers-per-row": 5
        },
    ];

    /** The maximum numbers to be displayed */
    private maxNumbers: number;
    /** The amount of numbers displayed per row */
    private numberPerRow: number;
    /** The current order in which the displayed numbers have been clicked */
    private order: number[];

    /**
     * Creates a new ordered numbers hack
     * @param level The level of this hack
     */
    public constructor(level: number) {
        // Get the data pertaining to the level of this hack
        const data: any = OrderedNumbers.levels[level - 1];
        super(data.time);

        this.maxNumbers = data["max-numbers"];
        this.numberPerRow = data["numbers-per-row"];
        this.order = [];
    }

    /**
     * Creates the game board for this hack
     */
    public addContent(): void {
        super.addContent();

        const parent: any = $("<table>")
            .addClass("ordered-numbers")
            .appendTo(this.content);

        // Create a list of numbers
        let numbers: number[] = [];
        for (let index: number = 0; index < this.maxNumbers; index++) {
            numbers.push(index + 1);
        }

        // Shuffle the list of numbers into a random order
        numbers = Utils.shuffle(numbers);

        // Display the shuffled numbers
        for (let rowIndex: number = 0; rowIndex < this.numberPerRow; rowIndex++) {
            const row: any = $("<tr>")
                .appendTo(parent);

            for (let index: number = 0; index < this.numberPerRow; index++) {
                // Get the display text for this number
                const display: number = numbers[(rowIndex * this.numberPerRow) + index];

                const data: any = $("<td>")
                    .attr("data-index", display)
                    .addClass("clickable")
                    .text(display)
                    .click((): void => {
                        if (this.locked) {
                            return;
                        }

                        // Record this number as clicked
                        const result: boolean = this.addNumber(Number.parseInt(data.attr("data-index")));

                        // Mark this number as clicked and remove its event handler
                        data.addClass(result ? "active" : "active-error")
                            .off("click");
                    })
                    .appendTo(row);
            }
        }
    }

    /**
     * Records a number that has been clicked
     * 
     * If the number is not in order, the fail state will be activated
     * 
     * If all numbers have been pressed in order, the success state will be activated
     * @param index The number to add
     * @returns If the number was in the correct order
     */
    private addNumber(index: number): boolean {
        if (index === (this.order.length + 1)) {
            this.order.push(index);

            if (this.order.length === this.maxNumbers) {
                super.success();

                Stats.increment("hacks", "ordered-numbers-solved");
            }

            return true;
        } else {
            super.fail();

            Stats.increment("hacks", "ordered-number-failed");

            return false;
        }
    }
}