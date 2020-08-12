class CoreTask {
    /** The core this task is running on */
    private core: any = null;
    /** Window handler for this core's interval */
    private handle: number | null = null;
    /** Current task progress */
    private progress: number = 0;
    /** If this task should run until cancelled */
    private infinite: boolean = false;
    /** If this task is currently running */
    private isRunning: boolean = false;

    /** The function to run if the task is completed */
    private complete: Function | null = null;
    /** The function to run if the task is cancelled */
    private cancel: Function | null = null;

    /**
     * Creates a new core task
     * @param display The display name of this task
     * @param cost The cost of this task
     */
    public static create(display: string, cost: number): CoreTask {
        return new CoreTask(display, cost);
    }

    private constructor(private display: string, private cost: number) { }

    /**
     * Updates the task's progress on its current task
     */
    public updateCore(): void {
        // Update the progress of the core
        this.progress += (this.core.getPower() / this.getCost()) * 2;
        // Draw the progress
        this.core.getCanvas().drawCore(this.infinite ? 100 : this.progress);

        // Check if the task is complete
        if (this.progress >= 100) {
            if (this.complete !== null) {
                this.complete();
            }

            // Reroll progress or cleanup
            if (this.infinite) {
                this.progress = 0;
            } else {
                this.cleanup();
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
    public isInfinite(): boolean {
        return this.infinite;
    }

    /**
     * @param infinite If this task should run until cancelled
     */
    public setIsInfinite(infinite: boolean): CoreTask {
        this.infinite = infinite;
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
     * Runs the cancel task if it was set
     */
    public onCancel(): void {
        if (this.isInfinite()) {
            this.setIsInfinite(false);
        }

        if (this.cancel !== null) {
            this.cancel();
        }

        this.cleanup();
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

            // Update parent core's displays
            this.core.setCoreTaskDisplay(this.display);
            this.core.updateButtons();

            return true;
        }

        return false;
    }
}