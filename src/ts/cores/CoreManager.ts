/// <reference path="Core.ts"/>

class CoreManager {
    /** The list of available cores */
    private static coreList: Core[];

    /**
     * Retrieves the core states
     */
    public static initialize(): void {
        CoreManager.coreList = State.getValue("cores.count") || [];

        this.addCore(100);
    }

    /**
     * Creates a new core
     * @param power The power of the core
     */
    public static addCore(power: number): void {
        CoreManager.coreList.push(new Core(CoreManager.coreList.length, power));
    }

    /**
     * Runs a task on the first available core
     * @param display The name of this task
     * @param callback The function to run after task completion
     * @param cost The cost of the task
     * @returns If there is an available core for this task
     */
    public static startCoreTask(display: string, callback: any, cost: any): boolean {
        for (const core of CoreManager.coreList) {
            if (!core.isBusy()) {
                core.setTask(display, callback, cost);
                return true;
            }
        }

        return false;
    }
}