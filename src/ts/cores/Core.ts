class Core {
    /** Width and height of the core canvases */
    private static canvasSize = 50;
    /** Radius of the core canvas */
    private static canvasRadius = Core.canvasSize / 2;

    /** The core HTML section */
    private info: JQuery<HTMLElement>;
    /** Canvas context of this core */
    private context: any;

    /** Window handler for this core's interval */
    private handle: any = null;
    /** Current task progress */
    private progress: number = 0;
    /** Current task cost */
    private cost: number = 0;
    /** Callback to run after task completion */
    private callback: any = null;
    /** If the core is powering down */
    private powerDown: boolean = false;
    /** The amount of power per update to subtract */
    private powerReduction: number = 0;

    /**
     * Creates a new core
     * @param id The ID of the core
     * @param power The power of the core
     */
    public constructor(private id: number, private power: number) {
        // Append the core HTML
        const parent: any = $("<div>")
            .attr("id", "core-" + id)
            .addClass("core")
            .hide()
            .fadeIn()
            .appendTo("#cores");
        const canvas: any = $("<canvas>")
            .attr("width", Core.canvasSize)
            .attr("height", Core.canvasSize)
            .appendTo(parent);

        // Append all the information about the core
        this.info = $("<div>")
            .addClass("core-info")
            .appendTo(parent);
        $("<div>")
            .addClass("core-task")
            .appendTo(this.info);
        $("<span>")
            .text("Core #" + (id + 1))
            .appendTo(this.info);
        $("<span>")
            .addClass("core-power")
            .appendTo(this.info);
        $("<br>")
            .appendTo(this.info);
        $("<button>")
            .addClass("upgrade-button")
            .text("[+]")
            .click((): void => this.cancelTask())
            .appendTo(this.info);
        $("<button>")
            .addClass("cancel-button")
            .text("[x]")
            .click((): void => this.cancelTask())
            .appendTo(this.info);
            
        // Initial transformations of the canvas
        this.context = canvas[0].getContext("2d");
        this.context.translate(Core.canvasRadius, Core.canvasRadius);
        // Rotate -90 degrees to start at the top when drawing
        this.context.rotate((-90 * Math.PI) / 180);
        // Draw the outline of the core
        this.drawCore();

        // Set the idle display
        this.setCoreTaskDisplay();
        // Set the power display
        this.updatePower(power);
        // Disable both core buttons
        this.updateUpgradeButton(false);
        this.updateCancelButton(false);
    }

    /**
     * Sets the power level of this core
     * @param power The current power level
     */
    public updatePower(power: number): void {
        this.power = power;

        this.info.children(".core-power")
            .text(" @ " + power + "Mhz");
    }

    /**
     * Updates the core's progress on its current task
     */
    public updateCore(): void {
        // Check if the core is powering down
        if (this.powerDown) {
            this.progress -= this.powerReduction;

            // Reset the state of this core when power down is complete
            if (this.progress <= 0) {
                window.clearInterval(this.handle);
                this.handle = null;
                this.progress = 0;
                this.cost = 0;
                this.callback = null;
                this.powerDown = false;
                this.powerReduction = 0;
            }
        } else {
            // Update the core's progress
            this.progress += (this.power / this.cost) * 10;
        }

        // Check if the task is completed
        if (this.progress >= 100) {
            // Run the callback
            if (this.callback !== null) {
                this.callback();
                this.callback = null;
            }

            // Reset variables for power down
            this.progress = 100;
            this.cost = 0;
            this.powerDown = true;
            this.powerReduction = (100 / 400) * 2;

            // Update core display
            this.setCoreTaskDisplay();
            this.updateCancelButton(false);
        }

        // Clear the canvas then draw the core
        this.clearCoreCanvas();
        this.drawCore();
    }

    /**
     * Sets a new task to run on this core
     * @param display The display name of the task
     * @param callback A function to run when the task is completed (before power down)
     * @param cost The cost of this task
     */
    public setTask(display: string, callback: any, cost: number): void {
        this.setCoreTaskDisplay(display);
        this.handle = window.setInterval((): void => this.updateCore(), 1);
        this.cost = cost;
        this.callback = callback;
        this.updateCancelButton(true);
    }

    /**
     * Cancels the current task and removes the cancel task button
     */
    public cancelTask(): void {
        this.powerDown = true;
        this.powerReduction = (this.progress / 400) * 2;

        this.setCoreTaskDisplay();
        this.updateCancelButton(false);
    }

    /**
     * Sets the core's task display
     * 
     * If no string is provided, the core's display will be set to an idle state
     * @param display The text to display
     */
    private setCoreTaskDisplay(display: string = ""): void {
        const child: any = this.info.children(".core-task");

        if (display === "") {
            child.removeClass("clickable-no-click")
                .text("Core idle");
        } else {
            child.addClass("clickable-no-click")
                .text(display);
        }
    }

    /**
     * @param enabled If the upgrade button should be enabled
     */
    private updateUpgradeButton(enabled: boolean): void {
        this.info.children(".upgrade-button")
            .prop("disabled", !enabled);
    }

    /**
     * @param enabled If the cancel button should be enabled
     */
    private updateCancelButton(enabled: boolean): void {
        this.info.children(".cancel-button")
            .prop("disabled", !enabled);
    }

    /**
     * Draws the core
     */
    private drawCore(): void {
        const draw: Function = (color: string, percent: number): void => {
            this.context.beginPath();
            // Arc from the top of the canvas to the current progress percent
            this.context.arc(0, 0, Core.canvasRadius - 1, 0, Math.PI * 2 * percent);
            // Set the color of the stroke
            this.context.strokeStyle = color;
            this.context.lineWidth = 2;
            this.context.stroke();
        };

        // Draw the outline
        draw("#333333", 1);
        // Draw the current progress
        draw($("body").css("--clickable-text"), this.progress / 100);
    }

    /**
     * Clears the core canvas
     */
    private clearCoreCanvas(): void {
        this.context.clearRect(-Core.canvasRadius, -Core.canvasRadius, Core.canvasSize, Core.canvasSize);
    }

    /**
     * @returns The ID of this core
     */
    public getID(): number {
        return this.id;
    }

    /**
     * @returns If this core can handle a new task
     */
    public isBusy(): boolean {
        return this.handle !== null;
    }
}