class CoreTask implements ISerializable {
    /** The core this task is running on */
    private core: any = null;
    /** The disk this task modifies */
    private disk: any = null;

    /** Window handler for this core's interval */
    private handle: number | null = null;
    /** The time this task was started */
    private startTime: number = 0;
    /** If this task should run until cancelled */
    private isInfinite: boolean = false;
    /** If this task is currently running */
    private isRunning: boolean = false;
    /** If this task is currently paused */
    private isPaused: boolean = false;

    /** The function to run if the task is completed */
    private complete: Function | null = null;
    /** The function to run if the task is cancelled */
    private cancel: Function | null = null;

    /**
     * Creates a new core task
     * @param display The display name of this task
     * @param cost The cost of this task
     */
    public static create(display: string, cost: number, type: CoreTaskType): CoreTask {
        return new CoreTask(display, cost, type);
    }

    /**
     * Creates a new core task from a serialized state
     * @param state The serialized state to use to create the task
     */
    public static deserialize(state: any): void {
        const core: Core = CoreManager.getCore(state.core);
        const disk: Disk = DiskManager.getDisk(state.disk);

        let task: CoreTask;
        switch (state.type) {
            case 0:
                task = core.overclock();
                break;
            case 1:
                task = core.searchForFiles();
                break;
            case 2:
                task = disk.wipeDisk(false, core);
                break;
            default:
                task = disk.wipeDisk(true, core);
                break;
        }

        // Set the start time relative to the current time (no progress change)
        task.startTime = Date.now() - (state.saveTime - state.startTime);
    }

    private constructor(private display: string, private cost: number, private type: CoreTaskType) { }

    /**
     * Updates the task's progress on its current task
     */
    public updateCore(): void {
        // Check if the task should pause
        if (State.getValue("paused")) {
            this.isPaused = true;

            // Get the progress of the core when it was paused
            const progress: number = (this.core.getPower() / (this.getCost() * 2)) * (State.getValue("pause-time") - this.startTime);
            // Draw the progress
            this.core.getCanvas().drawCore(this.isInfinite ? 100 : progress);
            return;
        } else if (this.isPaused) {
            this.isPaused = false;

            // Fix the start time based on the amount of time paused
            this.startTime -= State.getValue("pause-time") - State.getValue("unpause-time");
        }

        // Update the progress of the core
        const progress: number = (this.core.getPower() / (this.getCost() * 2)) * (Date.now() - this.startTime);
        // Draw the progress
        this.core.getCanvas().drawCore(this.isInfinite ? 100 : progress);

        // Check if the task is complete
        if (progress >= 100) {
            if (this.complete !== null) {
                this.complete();
            }

            // Reroll progress or cleanup
            if (this.isInfinite) {
                this.startTime = Date.now();
            } else {
                this.cleanup();

                Stats.increment("cores", "tasks-completed");
            }
        }
    }

    /**
     * Cleans up the core task's handle and displays
     */
    private cleanup(): void {
        this.isRunning = false;

        if (this.handle !== null) {
            window.clearInterval(this.handle);
        }

        // Clear the core canvas
        this.core.getCanvas().drawCore(0);
        // Update the parent core's display
        this.core.setCoreTaskDisplay();
        this.core.updateButtons();
    }

    /**
     * Runs the cancel task if it was set
     */
    public onCancel(): void {
        if (this.isInfinite) {
            this.setIsInfinite(false);
        }

        if (this.cancel !== null) {
            this.cancel();
        }

        this.cleanup();

        Stats.increment("cores", "tasks-cancelled");
    }

    /**
     * Attempts to start this core task
     * @param core The core to run the task on
     */
    public run(core?: Core): boolean {
        if (CoreManager.startCoreTask(this, core)) {
            // Mark the core as running and start updating
            this.isRunning = true;
            this.handle = window.setInterval((): void => this.updateCore(), 1);
            this.startTime = Date.now();

            // Update parent core's displays
            this.core.setCoreTaskDisplay(this.display);
            this.core.updateButtons();

            return true;
        }

        return false;
    }

    /**
     * @returns If this task is currently running
     */
    public isBusy(): boolean {
        return this.isRunning;
    }

    /**
     * @returns The display string of this task
     */
    public getDisplay(): string {
        return this.display;
    }

    /**
     * @returns The cost of this task
     */
    public getCost(): number {
        return this.cost;
    }

    /**
     * @returns If this task should run until cancelled
     */
    public getIsInfinite(): boolean {
        return this.isInfinite;
    }

    /**
     * @param infinite If this task should run until cancelled
     */
    public setIsInfinite(isInfinite: boolean): CoreTask {
        this.isInfinite = isInfinite;
        return this;
    }

    /**
     * @param core The core this task is currently running on
     */
    public setCore(core: Core): CoreTask {
        this.core = core;

        return this;
    }

    /**
     * @param disk The disk this task modifies
     */
    public setDisk(disk: Disk): CoreTask {
        this.disk = disk;

        return this;
    }

    /**
     * @param onComplete The function to run if the task is completed
     */
    public setOnComplete(onComplete: Function): CoreTask {
        this.complete = onComplete;
        return this;
    }

    /**
     * @param onCancel The function to run if the task is cancelled
     */
    public setOnCancel(onCancel: Function): CoreTask {
        this.cancel = onCancel;
        return this;
    }

    /**
     * @returns An object representing this core's state
     */
    public serialize(): any {
        return {
            "core": this.core.getID(),
            "disk": this.disk?.getID() || 0,
            "type": this.type,
            "startTime": this.startTime,
            "saveTime": Date.now()
        };
    }
}