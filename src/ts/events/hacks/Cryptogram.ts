/// <reference path="Hack.ts"/>

class Cryptogram extends Hack {
    /** Alphanumeric string containing all letters and numbers */
    private static letters: string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    /** Data for each level of this hack */
    private static levels: any[] = [
        {
            "time": 20,
            "characters": 5
        },
        {
            "time": 25,
            "characters": 7
        },
        {
            "time": 30,
            "characters": 10
        }
    ];

    /** The current ciphered password */
    private password: string;
    /** The progress towards the password */
    private progress: string;

    /**
     * Creates a new Cryptogram hack
     * @param level The level of this hack
     */
    public constructor(level: number) {
        const data: any = Cryptogram.levels[level - 1];
        super(data.time);

        // Get a random unique alphanumeric password
        this.password = Utils.createUniqueList(Cryptogram.letters.split(""), data.characters).join("");
        this.progress = "";
    }

    /**
     * Creates the game board for this hack
     */
    public addContent(): void {
        super.addContent();

        // Add the cipher header
        const header: any = $("<div>")
            .addClass("header centered")
            .text("Password cipher:")
            .appendTo(this.content);
        const letterContainer: any = $("<ul>")
            .appendTo(header);
        
        // Append each letter of the password as hexadecimal codes
        for (let index: number = 0; index < this.password.length; index++) {
            $("<li>")
                .attr("id", "cipher-" + index)
                .text("0x" + this.password.charCodeAt(index).toString(16))
                .appendTo(letterContainer);
        }

        // Create a display for the password progress
        $("<h1>")
            .attr("id", "password")
            .addClass("centered")
            .appendTo(this.content);

        // Create a container for all letter lists
        const listContainer: any = $("<div>")
            .addClass("cryptogram")
            .appendTo(this.content);

        const letters: string = Cryptogram.letters;
        // Number of letter lists to display
        const listCount: number = 4;
        // Number of letters per list
        const letterCount: number = Math.ceil(letters.length / listCount);

        for (let lists: number = 0; lists < listCount; lists++) {
            const list: any = $("<ol>")
                .appendTo(listContainer);

            for (let index: number = 0; index < letterCount; index++) {
                // Get the current letter index in this list
                const currentIndex: number = (lists * letterCount) + index;
                // Get the current letter
                const letter: string = letters[currentIndex];

                // Append the letter as a hexadecimal string
                const code: any = $("<li>")
                    .text(letter + ": 0x" + letters.charCodeAt(currentIndex).toString(16))
                    .click((): void => {
                        if (this.locked) {
                            return;
                        }

                        // Mark this letter as clicked
                        code.addClass("clickable-no-click");
                        if (this.validateInput(letter.toUpperCase())) {
                            code.off("click");
                        } else {
                            code.addClass("active-error");
                        }
                    })
                    .appendTo(list);

                // Mark letters that are in the password
                if (this.password.includes(letter)) {
                    code.addClass("password-letter");
                }
            }
        }
    }
    
    /**
     * Called when the player fails to complete the hack in time
     */
    public fail(): void {
        super.fail();

        // Mark each letter that was missed
        for (const letter of $(".password-letter")) {
            if (!$(letter).hasClass("clickable-no-click")) {
                $(letter).addClass("clickable-no-click active-error")
            }
        }

        Stats.increment("hacks", "cryptograms-failed");
    }

    /**
     * Checks if a clicked letter is the next letter in the password
     * @param letter The letter to validate
     */
    private validateInput(letter: string): boolean {
        this.progress += letter;

        // Check if the letter is in order
        if (this.password.charAt(this.progress.length - 1) !== letter) {
            this.fail();
            return false;
        }

        if (this.progress === this.password) {
            this.success();

            Stats.increment("hacks", "cryptograms-solved");
        }

        // Mark the header element as found
        $("#cipher-" + (this.progress.length - 1))
            .addClass("clickable-no-click");

        // Update the password display
        $("#password")
            .text(this.progress);

        return true;
    }
}