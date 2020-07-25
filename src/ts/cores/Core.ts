class Core {
    /** The core HTML section */
    private parent: JQuery<HTMLElement>;

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

    public constructor(private id: number, name: string, private power: number) {
        // Append the core HTML
        this.parent = $("<div>")
            .attr("id", "core-" + id)
            .addClass("core")
            .hide()
            .fadeIn()
            .appendTo("#cores");
        $("<span>")
            .text(name)
            .appendTo(this.parent);
        $("<span>")
            .addClass("core-power")
            .appendTo(this.parent);
        $("<div>")
            .addClass("core-progress")
            .appendTo(this.parent);

        // Set the power display
        this.updatePower(power);
    }

    /**
     * Sets the power level of this core
     * @param power The current power level
     */
    public updatePower(power: number): void {
        this.power = power;

        this.parent.children(".core-power")
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

            this.removeCancelButton();
        }

        // Set the gradient of the progress bar
        const progress: string = this.progress + "%";
        const color: string = $("body").css("--clickable-text");
        this.parent.children(".core-progress")
            .css("background-image", "linear-gradient(90deg, " + color + " " + progress + ", rgba(0, 0, 0, 0.5) " + progress + ")");
    }

    /**
     * Sets a new task to run on this core
     * @param callback A function to run when the task is completed (before power down)
     * @param cost The cost of this task
     */
    public setTask(callback: any, cost: number): void {
        this.handle = window.setInterval((): void => this.updateCore(), 1);
        this.cost = cost;
        this.callback = callback;
        this.addCancelButton();
    }

    /**
     * Cancels the current task and removes the cancel task button
     */
    public cancelTask(): void {
        this.powerDown = true;
        this.powerReduction = (this.progress / 400) * 2;

        this.removeCancelButton();
    }

    /**
     * Adds the cancel task button
     */
    private addCancelButton(): void {
        $("<button>")
            .addClass("cancel-button")
            .text("[ x ]")
            .click((): void => this.cancelTask())
            .hide()
            .fadeIn()
            .insertBefore(this.parent.children(".core-progress"));
    }

    /**
     * Removes the cancel task button
     */
    private removeCancelButton(): void {
        const element: any = $(this.parent.children(".cancel-button"))
            .off("click")
            .fadeOut(400, (): void => element.remove());
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