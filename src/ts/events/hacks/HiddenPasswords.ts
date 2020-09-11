class HiddenPasswords extends Hack {
    /** The number of characters per line */
    private static lineLength: number = 55;
    /** Data for each level of this hack */
    private static data: any = {
        "levels": [
            {
                "time": 20,
                "passwords": 2,
                "lines": 7
            },
            {
                "time": 35,
                "passwords": 4,
                "lines": 13
            },
            {
                "time": 50,
                "passwords": 6,
                "lines": 20
            }
        ],
        "passwords": [
            "variable",
            "admin",
            "guest",
            "password",
            "codified",
            "quarantine",
            "anonymous",
            "linux",
            "compiler",
            "program",
            "testing",
            "default",
            "generic",
            "public",
            "global",
            "shared",
            "home",
            "root",
            "control",
            "system"
        ]
    };

    /** The current hidden passwords */
    private passwords: string[];
    /** The number of hidden passwords that have been discovered */
    private markedPasswords: number;
    /** The number of text lines to display */
    private lines: number;
    /** The number of characters per line */
    private lineLength: number;
    /** List of all password elements */
    private passwordContainer: any[];

    /**
     * Creates a new HiddenPasswords hack
     * @param level The level of this hack
     */
    public constructor(level: number) {
        // Get the data for this level of hack
        const data: any = HiddenPasswords.data.levels[level - 1];
        super(data.time);

        // Get a unique list of passwords to hide
        this.passwords = Utils.createUniqueList(HiddenPasswords.data.passwords, data.passwords);
        this.markedPasswords = 0;
        this.lines = data.lines;
        this.lineLength = HiddenPasswords.lineLength;
        this.passwordContainer = [];
    }

    /**
     * Creates the game board for this hack
     */
    public addContent(): void {
        super.addContent();

        // Add the header
        const parent: any = $("<section>")
            .addClass("hidden-passwords")
            .appendTo(this.content);
        const header: any = $("<div>")
            .text("Suspected passwords:")
            .addClass("header centered")
            .appendTo(parent);
        const passwordContainer: any = $("<ul>")
            .appendTo(header);

        // Get the alphanumeric text wall
        let text: string = Utils.getAlphanumericString(this.lines * this.lineLength);

        // Break up the text wall into individual lines
        for (let index: number = 0; index < text.length / this.lineLength; index++) {
            $("<p>")
                .addClass("text-line")
                // Get this line's text from the wall
                .html(text.slice(index * this.lineLength, (index * this.lineLength) + this.lineLength))
                .appendTo(parent);
        }

        const takenLines: number[] = [];
        for (let index: number = 0; index < this.passwords.length; index++) {
            const password: string = this.passwords[index];

            // Add this password to the header
            $("<li>")
                .attr("id", "hidden-password-" + index)
                .text(password)
                .appendTo(passwordContainer);

            // Get a random line to put this password on; two passwords can't be on the same line
            let line: number;
            do {
                line = Utils.random(0, this.lines);
            } while (takenLines.includes(line));
            takenLines.push(line);

            // Get the parent element for this password
            const element: any = $(parent.children(".text-line")[line]);
            // Get a random index to insert the password to
            const insertIndex: number = Utils.random(0, this.lineLength - password.length);
            // Get the rest of the text behind the password after it would be inserted
            const leftoverText: string = element.text().slice(insertIndex + password.length);

            // Set the text of the parent element to everything before the password
            element.text(element.text().slice(0, insertIndex));

            // Append the password to the parent
            const passwordElement: any = $("<span>")
                .attr("password-index", index)
                .text(password)
                .click((): void => {
                    if (this.locked) {
                        return;
                    }

                    this.markPassword(passwordElement);
                })
                .appendTo(element);
            this.passwordContainer.push(passwordElement);
            
            // Add the leftover text from the right side of the password
            $("<span>")
                .text(leftoverText)
                .appendTo(element);
        }
    }

    /**
     * Marks a password as found
     * @param element The password that was clicked
     */
    private markPassword(element: JQuery<HTMLElement>): void {
        // Highlight the element on the game board
        element.addClass("clickable-no-click")
            .off("click");

        // Highlight the element on the header
        const index: number = Number.parseInt(<string>element.attr("password-index"));
        $("#hidden-password-" + index).addClass("clickable-no-click");

        // Check if the hack has been completed
        if (++this.markedPasswords === this.passwords.length) {
            this.success();

            Stats.increment("hacks", "hidden-passwords-solved");
        }
    }

    /**
     * Called when the player fails to complete the hack in time
     */
    public fail(): void {
        super.fail();

        for (const password of this.passwordContainer) {
            // Check if this password has already been found
            if (!password.hasClass("clickable-no-click")) {
                // Mark the password as not found
                password.addClass("clickable-no-click active-error");

                // Mark the element on the header as not found
                const index: number = Number.parseInt(<string>password.attr("password-index"));
                $("#hidden-password-" + index).addClass("clickable-no-click active-error");
            }
        }

        Stats.increment("hacks", "hidden-passwords-failed");
    }
}