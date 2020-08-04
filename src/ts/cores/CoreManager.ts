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
     * Runs a task on the first available core, if any are not busy
     * @param task The task to run
     * @returns If the task was run
     */
    public static startCoreTask(task: CoreTask): boolean {
        for (const core of CoreManager.coreList) {
            if (!core.isBusy()) {
                core.setTask(task);
                return true;
            }
        }

        return false;
    }
}