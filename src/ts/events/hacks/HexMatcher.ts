class HexMatcher extends Hack {
    /** The width of the canvas */
    private static canvasWidth: number = 180;
    /** The line width of all connections */
    private static connectionWidth: number = 1.5;
    /** Data for each level of this hack */
    private static levels: any[] = [
        {
            "time": 25,
            "hex-length": 5,
            "number-of-matches": 5
        },
        {
            "time": 30,
            "hex-length": 6,
            "number-of-matches": 7
        },
        {
            "time": 35,
            "hex-length": 7,
            "number-of-matches": 10
        }
    ];

    /** The length of the hex codes */
    private hexLength: number;
    /** The number of hex codes to generate */
    private numberOfMatches: number;
    /** The number of matches found */
    private currentMatches: number;
    /** The currently selected match key */
    private selected: JQuery<HTMLElement> | null;

    /** The canvas used to draw connections between matches */
    private canvas: any;
    /** Window interval handler to update the canvas */
    private canvasHandler: number;
    /** The current list of completed connections */
    private connections: any[];

    /**
     * Creates a new HexMatcher hack
     * @param level The level of this hack
     */
    public constructor(level: number) {
        // Get the data for this level of hack
        const data: any = HexMatcher.levels[level - 1];
        super(data.time);

        this.hexLength = data["hex-length"];
        this.numberOfMatches = data["number-of-matches"];
        this.currentMatches = 0;
        this.selected = null;

        this.canvasHandler = -1;
        this.connections = [];
    }

    /**
     * Creates the game board for this hack
     */
    protected addContent(): void {
        super.addContent();

        // Add the header
        $("<h1>")
            .text("Matching pattern sequence discovered!")
            .appendTo(this.content);
        // Add the main content container
        const parent: any = $("<div>")
            .addClass("hex-matcher")
            .appendTo(this.content);

        // Create a list of hex codes to use as matches
        const matches: string[] = [];
        for (let index: number = 0; index < this.numberOfMatches; index++) {
            let hex: string;
            do {
                hex = Utils.getHexString(this.hexLength);
            // Make sure hex codes are not the same
            } while (matches.includes(hex));
            matches.push(hex);
        }

        // Create the key/value lists and the connector canvas
        const keyList: any = $("<ul>")
            .appendTo(parent);
        this.canvas = $("<canvas>")
            .attr("width", HexMatcher.canvasWidth)
            .appendTo(parent);
        const valueList: any = $("<ul>")
            .addClass("value-list")
            .appendTo(parent);

        // Shuffle the hex code matches into random orders for keys and values
        const keys: string[] = Utils.shuffle(matches);
        const values: string[] = Utils.shuffle(matches);

        // Add the keys and values to their respective lists
        for (let index: number = 0; index < matches.length; index++) {
            const key: any = $("<li>")
                .addClass("clickable")
                .text(keys[index])
                .on("click", (): void => this.selectKey(key))
                .appendTo(keyList);
            const value: any = $("<li>")
                .text(values[index])
                .on("click", (): void => this.selectValue(value))
                .appendTo(valueList);
        }

        // Set the canvas update interval
        this.canvasHandler = window.setInterval((): void => this.updateCanvas(), 1);
    }

    /**
     * Selects a hex code key
     * @param element The key selected
     */
    private selectKey(element: JQuery<HTMLElement>): void {
        if (super.locked) {
            return;
        }

        // Remove the previously selected elements classes
        if (this.selected !== null) {
            this.selected.removeClass("active selected");
        }

        // Un-select this element if it was already selected
        if (this.selected === element) {
            this.selected = null;

            this.highlightValues(false);
        } else {
            this.selected = element;
            element.addClass("active selected");

            this.highlightValues(true);
        }
    }

    /**
     * Selects a hex code value
     * @param element The value selected
     */
    private selectValue(element: JQuery<HTMLElement>): void {
        if (super.locked) {
            return;
        }

        // Ignore value selections if there is no key to compare with
        if (this.selected !== null) {
            element.removeClass("clickable selection")
                .addClass("clickable-no-click active")
                .off("click");

            // Check if the key and value match
            if (this.selected.text() === element.text()) {
                this.selected.removeClass("clickable selected")
                    .addClass("clickable-no-click active")
                    .off("click");
                    
                element.addClass("active");

                // Add this connection
                this.createConnection(this.selected, element);

                // Check if the hack has been completed
                if (++this.currentMatches === this.numberOfMatches) {
                    super.success();
                }
            } else {
                element.addClass("active-error");

                this.fail();
            }

            // Reset the board if the hack was not completed
            this.selected = null;
            this.highlightValues(false);
        }
    }

    /**
     * Toggles a highlight of the value codes
     * @param enabled If the value codes should be highlighted
     */
    private highlightValues(enabled: boolean): void {
        for (const value of $(".value-list").children()) {
            // Don't highlight any value that has already made a connection
            if (!$(value).hasClass("active")) {
                if (enabled) {
                    $(value).addClass("selection");
                } else {
                    $(value).removeClass("selection");
                }
            }
        }
    }

    /**
     * Creates a new key-value connection graphic
     * @param parent The key element
     * @param element The value element
     */
    private createConnection(parent: any, element: any): void {
        // Get the offset values of the canvas element
        const offsetX: number = this.canvas.offset().left;
        const offsetY: number = this.canvas.offset().top;

        // Get the parent element height offset to center the start point
        const parentOffsetY: number = parent.height() / 2;
        const parentY: number = parent.offset().top - offsetY + parentOffsetY;

        // Get the element element height offset to center the end point
        const elementOffsetY: number = element.height() / 2;
        const elementX: number = element.offset().left - offsetX;
        const elementY: number = element.offset().top - offsetY + elementOffsetY;

        this.connections.push({
            "opacity": 0,
            "startY": parentY,
            "endX": elementX,
            "endY": elementY
        });
    }

    /**
     * Draws all current connections
     */
    private updateCanvas(): void {
        // Make sure the canvas height correctly matches its parent
        this.canvas.attr("height", this.content.children(".hex-matcher").height());

        // Get the render context
        const context: CanvasRenderingContext2D = this.canvas[0].getContext("2d");
        context.lineWidth = HexMatcher.connectionWidth;

        for (const connection of this.connections) {
            // Lower max value to correctly convert to base 16
            if (connection.opacity < 255 - 16) {
                connection.opacity += 1;
            }

            // Get the current stroke style with added opacity
            context.strokeStyle =  $("body").css("--clickable-text-hover") + (16 + connection.opacity).toString(16);

            // Draw the connection
            context.beginPath();
            context.moveTo(0, connection.startY);
            context.lineTo(connection.endX, connection.endY);
            context.stroke();
        }
    }

    /**
     * Called when the player fails to complete the hack in time
     */
    protected fail(): void {
        super.fail();

        // Clean up the canvas update handler
        window.clearInterval(this.canvasHandler);
    }
}