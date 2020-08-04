/// <reference path="CoreCanvas.ts"/>

class Core {
    /** The core HTML section */
    private info: JQuery<HTMLElement>;
    /** The canvas used by this core */
    private canvas: CoreCanvas;

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

    /** If this core can overclock */
    private canOverclock: boolean = false;
    /** If this core is infinitely searching for files */
    private searchingForFiles: boolean = false;

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

        // Draw an idle core
        this.canvas = new CoreCanvas(parent);
        this.canvas.drawCore(0);

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
            .click((): void => this.overclock())
            .appendTo(this.info);
        $("<button>")
            .addClass("cancel-button")
            .text("[x]")
            .click((): void => this.cancelTask())
            .appendTo(this.info);
        $("<button>")
            .addClass("search-button")
            .text("[search]")
            .click((): void => this.searchForFiles())
            .appendTo(this.info)

        // Set the idle display
        this.setCoreTaskDisplay();
        // Set the power display
        this.updatePower(power);
        // Disable both core buttons
        this.updateButtons();
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

                // Infinitely search for files
                if (this.searchingForFiles) {
                    this.searchForFiles();
                }
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
            if (!this.searchingForFiles) {
                this.setCoreTaskDisplay();
            }
        }

        this.canvas.drawCore(this.progress);

        if (!this.searchingForFiles) {
            this.updateButtons();
        }
    }

    /**
     * Doubles the core's power
     */
    private overclock(): void {
        this.setTask("Overclocking core", (): void => {
            this.updatePower(this.power * 2);

            this.canOverclock = false;
        }, this.power * 5000);
    }

    /**
     * Starts an infinite core task that will add files to disks until cancelled
     */
    private searchForFiles(): void {
        this.searchingForFiles = true;

        this.setTask("Searching for files", (): void => {
            DiskManager.addFileToDisk(State.getValue("threat-level") || 1, false);
        }, this.power * 50);
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
        this.updateButtons();
    }

    /**
     * Cancels the current task
     */
    public cancelTask(): void {
        if (this.searchingForFiles) {
            this.searchingForFiles = false;
        }

        if (!this.powerDown) {
            this.powerReduction = (this.progress / 400) * 2;
        }

        this.powerDown = true;

        this.setCoreTaskDisplay();
        this.updateButtons();
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
     * Updates the core's function buttons
     */
    private updateButtons(): void {
        this.info.children(".cancel-button")
            .prop("disabled", this.powerDown || !this.isBusy());

        this.info.children(".upgrade-button")
            .prop("disabled", !this.canOverclock || this.isBusy());

        this.info.children(".search-button")
            .prop("disabled", this.powerDown || this.isBusy());
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

    public setCanOverclock(canOverclock: boolean): void {
        this.canOverclock = canOverclock;

        this.updateButtons();
    }
}