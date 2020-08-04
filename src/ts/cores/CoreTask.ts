class CoreTask {
    /** The function to run if the task is completed */
    private complete: Function | null;
    /** The function to run if the task is cancelled */
    private cancel: Function | null;

    /**
     * Creates a new core task
     * @param display The display string of this task
     * @param cost The cost of this task
     */
    public static create(display: string, cost: number): CoreTask {
        return new CoreTask(display, cost);
    }

    private constructor(private display: string, private cost: number) {
        this.complete = null;
        this.cancel = null;
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
     * Runs the completion task if it was set
     */
    public onComplete(): void {
        if (this.complete !== null) {
            this.complete();
        }
    }

    /**
     * Runs the cancel task if it was set
     */
    public onCancel(): void {
        if (this.cancel !== null) {
            this.cancel();
        }
    }

    /**
     * Runs this task on the first available core
     * @returns If the task was run
     */
    public run(): boolean {
        return CoreManager.startCoreTask(this);
    }
}