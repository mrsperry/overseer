class CoreManager {
    /** The list of available cores */
    private static coreList: Core[];

    /**
     * Retrieves the core states
     */
    public static initialize(): void {
        CoreManager.coreList = State.getValue("cores.count") || [];
    }

    /**
     * Creates a new core
     */
    public static addCore(name: string, power: number): void {
        CoreManager.coreList.push(new Core(CoreManager.coreList.length, name, power));
    }

    /**
     * Runs a task on the first available core
     * @param callback The function to run after task completion
     * @param cost The cost of the task
     * @returns If there is an available core for this task
     */
    public static startCoreTask(callback: any, cost: any): boolean {
        for (const core of CoreManager.coreList) {
            if (!core.isBusy()) {
                core.setTask(callback, cost);
                return true;
            }
        }

        return false;
    }
}