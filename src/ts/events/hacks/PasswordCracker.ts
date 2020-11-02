class PasswordCracker extends Hack {
    /** A list of alphanumeric characters */
    private static characters: string[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
    /** The number of characters to display on each side of the selected index */
    private static characterPadding: number = 5;
    /** Data for each level of this hack */
    private static levels: any[] = [
        {
            "time": 30,
            "characters": 5
        },
        {
            "time": 45,
            "characters": 7
        },
        {
            "time": 60,
            "characters": 10
        }
    ];

    /** The current password iteration */
    private password: string;
    /** The list of currently selected characters */
    private indices: number[];
    /** The elements that are selected by the indices */
    private selected: any[];

    /**
     * Creates a new PasswordCracker hack
     * @param channel The channel this hack affects
     * @param level The level of this hack
     */
    public constructor(channel: number, level: number) {
        const data: any = PasswordCracker.levels[level - 1];
        super(channel, data.time);

        // Get a random uppercase password
        this.password = Utils.getAlphanumericString(data.characters).toUpperCase();
        this.indices = [];
        this.selected = [];

        for (let index: number = 0; index < data.characters; index++) {
            // Get random start positions for indices that don't match the password character
            let start: number;
            do {
                start = Utils.random(0, PasswordCracker.characters.length);
            } while (PasswordCracker.characters[start] === this.password[start]);
            this.indices.push(start);

            this.selected.push(null);
        }
    }

    /**
     * Creates the game board for this hack
     */
    public addContent(): void {
        super.addContent();

        // Add the header
        const header: any = $("<div>")
            .text("Password iteration:")
            .addClass("header centered")
            .appendTo(this.content);
        $("<div>")
            .text(this.password)
            .addClass("clickable-no-click")
            .appendTo(header);

        // Create the main content section
        const parent: any = $("<section>")
            .addClass("password-cracker")
            .appendTo(this.content);

        for (let index: number = 0; index < this.password.length; index++) {
            // Add a slot for each password character
            const slot: any = $("<div>")
                .appendTo(parent);

            const list: any = $("<ol>")
                .appendTo(slot);
            // Populate the character list
            this.setVisibleCharacters(index, list);

            // Add buttons to increase/decrease the current index
            $("<button>")
                .addClass("text-button reversed")
                .text("[v]")
                .on("click", (): void => {
                    if (!this.locked) {
                        if (--this.indices[index] === -1) {
                            this.indices[index] = PasswordCracker.characters.length - 1;
                        }

                        this.setVisibleCharacters(index, list);
                    }
                })
                .prependTo(slot);
            $("<button>")
                .addClass("text-button")
                .text("[v]")
                .on("click", (): void => {
                    if (!this.locked) {
                        if (++this.indices[index] === PasswordCracker.characters.length) {
                            this.indices[index] = 0;
                        }

                        this.setVisibleCharacters(index, list);
                    }
                })
                .appendTo(slot);
        }
    }

    /**
     * Creates a list of characters based on the given index
     * @param currentIndex The current selected index
     * @param parent The element to add the characters to
     */
    private setVisibleCharacters(currentIndex: number, parent: any): void {
        // Clear any remaining characters
        parent.empty();

        // Get the currently selected character index
        const characterIndex: number = this.indices[currentIndex];

        const length: number = PasswordCracker.characters.length;

        // Add a number of characters before and after the character
        for (let index: number = -PasswordCracker.characterPadding; index <= PasswordCracker.characterPadding; index++) {
            // Clamp the index to the length of the character list
            let actualIndex: number = characterIndex + index;
            if (actualIndex < 0) {
                actualIndex = length - Math.abs(actualIndex);
            } else if (actualIndex >= length) {
                actualIndex -= length;
            }

            // Add the character element
            const character: any = $("<li>")
                .css("opacity", 1 - (Math.abs(index) / 10))
                .text(PasswordCracker.characters[actualIndex])
                .appendTo(parent);

            // Mark the element as selected
            if (index == 0) {
                character.addClass("selected");

                this.selected[currentIndex] = character;
            }
        }

        // Check if all characters match the password
        this.checkComplete();
    }

    /**
     * Checks if all selected characters match the password characters
     */
    private checkComplete(): void {
        for (let index: number = 0; index < this.password.length; index++) {
            if (this.password[index] !== PasswordCracker.characters[this.indices[index]]) {
                return;
            }
        }

        for (const element of this.selected) {
            element.addClass("clickable-no-click");
        }

        super.success();

        Stats.increment("hacks", "password-crackers-solved");
    }

    /**
     * Called when a player fails to complete the hack in time
     */
    protected fail(): void {
        super.fail();

        Stats.increment("hacks", "password-cracked-failed");
    }
}