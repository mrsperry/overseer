/// <reference path="CoreCanvas.ts"/>
/// <reference path="CoreTask.ts"/>

class Core {
    /** The core HTML section */
    private info: JQuery<HTMLElement>;
    /** The canvas used by this core */
    private canvas: CoreCanvas;
    /** The current core task */
    private task: CoreTask | null = null;

    /** If this core can overclock */
    private canOverclock: boolean = false;
    /** The maximum upgrades this core can receive */
    private maxUpgrades: number = 0;
    /** The number of times this core has overclocked */
    private upgrades: number = 0;

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
            .addClass("core-button overclock-button")
            .text("[+]")
            .click((): void => Core.overclock(this))
            .appendTo(this.info);
        $("<button>")
            .addClass("core-button cancel-button")
            .text("[x]")
            .click((): void => this.cancelTask())
            .appendTo(this.info);
        $("<button>")
            .addClass("core-button search-button")
            .text("[search]")
            .click((): void => Core.searchForFiles(this))
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
     * Cancels the current task
     */
    public cancelTask(): void {
        this.task?.onCancel();
        this.setCoreTaskDisplay();
        this.updateButtons();
    }

    /**
     * Sets the core's task display
     * 
     * If no string is provided, the core's display will be set to an idle state
     * @param display The text to display
     */
    public setCoreTaskDisplay(display: string = ""): void {
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
    public updateButtons(): void {
        this.info.children(".cancel-button")
            .prop("disabled", !this.isBusy());

        this.info.children(".overclock-button")
            .prop("disabled", !this.canOverclock || this.isBusy());

        this.info.children(".search-button")
            .prop("disabled", this.isBusy());
    }

    /**
     * Increments and updates overclock variables of this core
     */
    public upgrade(): void {
        this.upgrades++;
        this.canOverclock = this.upgrades < this.maxUpgrades && !this.isBusy();
    }

    /**
     * Doubles a core's power
     */
    public static overclock(core: Core): void {
        CoreTask.create("Overclocking core", core.power * 1000, CoreTaskType.Overclock)
            .setOnComplete((): void => {
                core.updatePower(core.power * 2);
                core.upgrade();

                Stats.increment("cores", "times-overclocked");
            }).run(core);
    }

    /**
     * Starts an infinite core task that will add files to disks until cancelled
     */
    public static searchForFiles(core: Core): void {
        CoreTask.create("Searching for files", core.power * 5, CoreTaskType.Search)
            .setIsInfinite(true)
            .setOnComplete((): void => DiskManager.addFileToDisk())
            .run(core);
    }

    /**
     * @returns The ID of this core
     */
    public getID(): number {
        return this.id;
    }

    /**
     * @returns The canvas this core draws to
     */
    public getCanvas(): CoreCanvas {
        return this.canvas;
    }

    /**
     * @returns The power of this core
     */
    public getPower(): number {
        return this.power;
    }

    /**
     * @returns If this core can handle a new task
     */
    public isBusy(): boolean {
        return this.task?.isBusy() || false;
    }

    /**
     * @param task The task this core will run
     */
    public setTask(task: CoreTask): void {
        this.task = task;
    }

    /**
     * @param canOverclock If this core can overclock
     */
    public setCanOverclock(canOverclock: boolean): void {
        this.canOverclock = canOverclock;

        this.updateButtons();
    }

    /**
     * Sets the maximum number of upgrades for this core and updates core buttons
     * @param max The new maximum number of upgrades
     */
    public setMaxUpgrades(max: number): void {
        this.maxUpgrades = max;

        this.setCanOverclock(this.maxUpgrades > this.upgrades);
    }
}