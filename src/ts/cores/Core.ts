/// <reference path="CoreCanvas.ts"/>
/// <reference path="CoreTask.ts"/>

class Core implements ISerializable {
    /** The cost of searching for a single file */
    private static fileSearchCost: number = 20;

    /** The core HTML section */
    private info: JQuery<HTMLElement>;
    /** The canvas used by this core */
    private canvas: CoreCanvas;
    /** The current core task */
    private task: CoreTask | null = null;

    private power: number = 1;
    private upgrades: number = 0;

    /**
     * Creates a new core
     * @param id The ID of the core
     * @param power The power of the core
     */
    public constructor(private id: number) {
        // Append the core HTML
        const parent: any = $("<div>")
            .attr("id", "core-" + id)
            .addClass("core")
            .html(Views.get("core"))
            .hide()
            .fadeIn()
            .appendTo("#cores");

        // Draw an idle core
        this.canvas = new CoreCanvas(parent);
        this.canvas.drawCore(0);

        // Append all the information about the core
        this.info = parent.children(".core-info");
        this.info.children(".core-name").text("Core #" + (id + 1));
        this.info.children(".overclock-button").click((): CoreTask => this.overclock());
        this.info.children(".cancel-button").click((): void => this.cancelTask());
        this.info.children(".search-button").click((): CoreTask => this.searchForFiles());

        // Set the idle display
        this.setCoreTaskDisplay();
        // Set the power display
        this.updatePower();
        // Disable both core buttons
        this.updateButtons();
    }

    /**
     * Creates a new core from a serialized state
     * @param state The serialized state to use to create the core
     */
    public static deserialize(state: any): void {
        const core: Core = CoreManager.addCore(false);
        core.setUpgrades(state.upgrades);

        if (state.task !== null) {
            CoreTask.deserialize(state.task);
        }
    }

    /**
     * Sets the power level of this core and updates the display
     */
    public updatePower(): void {
        let power: number = 1;
        for (let index: number = 0; index < this.upgrades; index++) {
            power *= 2;
        }

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
            .prop("disabled", this.upgrades === CoreManager.getMaxCoreUpgrades() || this.isBusy());

        this.info.children(".search-button")
            .prop("disabled", this.isBusy());
    }

    /**
     * Doubles a core's power
     * @returns The created core task
     */
    public overclock(): CoreTask {
        const task: CoreTask = CoreTask.create("Overclocking core", this.power * 1000, CoreTaskType.Overclock);

        task.setOnComplete((): void => {
            this.upgrades++;
            this.updatePower();

            Stats.increment("cores", "times-overclocked");
        }).run(this);

        return task;
    }

    /**
     * Starts an infinite core task that will add files to disks until cancelled
     * @returns The created core task
     */
    public searchForFiles(): CoreTask {
        const task: CoreTask = CoreTask.create("Searching for files", Core.fileSearchCost, CoreTaskType.Search);

        task.setIsInfinite(true)
            .setOnComplete((): void => DiskManager.addFileToDisk())
            .run(this);

        return task;
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
     * @param upgrades The number of upgrades this core should have
     */
    public setUpgrades(upgrades: number): void {
        this.upgrades = upgrades;
        
        this.updatePower();
        this.updateButtons();
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
     * @returns A serialized state of this core
     */
    public serialize(): any {
        return {
            "id": this.id,
            "power": this.power,
            "upgrades": this.upgrades,
            "task": this.task?.isBusy() ? this.task.serialize() : null
        };
    }
}