/// <reference path="Core.ts"/>

class CoreManager {
    /** The list of available cores */
    private static coreList: Core[];
    private static maxCoreUpgrades: number;

    /**
     * Retrieves the core states
     */
    public static initialize(): void {
        CoreManager.coreList = State.getValue("cores.count") || [];
        CoreManager.maxCoreUpgrades = State.getValue("cores.max-upgrades") || 0;

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
     * @param core The core to run the task on
     * @returns If the task was run
     */
    public static startCoreTask(task: CoreTask, core?: Core | undefined): boolean {
        if (core === undefined) {
            for (const currentCore of CoreManager.coreList) {
                if (!currentCore.isBusy()) {
                    currentCore.setTask(task);
                    return true;
                }
            }
        } else {
            if (!core.isBusy()) {
                core.setTask(task);
                return true;
            }
        }

        return false;
    }

    /**
     * Increments the maximum number of core upgrades for each core
     */
    public static upgradeCoreSpeeds(): void {
        CoreManager.maxCoreUpgrades++;

        for (const core of CoreManager.coreList) {
            core.setMaxUpgrades(CoreManager.maxCoreUpgrades);
        }
    }
}