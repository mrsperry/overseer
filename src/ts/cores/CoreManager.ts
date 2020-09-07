/// <reference path="Core.ts"/>

class CoreManager {
    /** The list of available cores */
    private static coreList: Core[];
    /** The current number of times a core can overclock */
    private static maxCoreUpgrades: number;

    /**
     * Retrieves the core states
     */
    public static initialize(): void {
        // Set the maximum number of core upgrades
        CoreManager.maxCoreUpgrades = State.getValue("cores.max-core-upgrades") || 0;

        CoreManager.coreList = [];
        // Deserialized saved cores
        for (const core of State.getValue("cores.list") || []) {
            Core.deserialize(core);
        }

        // Add initial core if none were saved
        if (CoreManager.coreList.length === 0) {
            CoreManager.addCore(1, false);
        }
    }

    /**
     * Adds all core data to the state
     */
    public static save(): void {
        const data: any = {
            "list": [],
            "max-core-upgrades": CoreManager.maxCoreUpgrades
        };

        for (const core of CoreManager.coreList) {
            data.list.push(core.serialize());
        }

        State.setValue("cores", data);
    }

    /**
     * Creates a new core
     * @param power The power of the core
     * @param count If this core should be added as a statistic
     * @returns The created core
     */
    public static addCore(power: number, count: boolean = true): Core {
        const core: Core = new Core(CoreManager.coreList.length, power);
        CoreManager.coreList.push(core);

        if (count) {
            Stats.increment("cores", "cores-obtained");
        }

        return core;
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
                    currentCore.setTask(task.setCore(currentCore));
                    return true;
                }
            }
        } else {
            if (!core.isBusy()) {
                core.setTask(task.setCore(core));
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
            core.updateButtons();
        }
    }

    /**
     * @returns The max number of times a core can be overclocked
     */
    public static getMaxCoreUpgrades(): number {
        return CoreManager.maxCoreUpgrades;
    }
    
    /**
     * @param id The ID of the core
     * @returns The core with the given ID or the first core
     */
    public static getCore(id: number): Core {
        return CoreManager.coreList[id] || CoreManager.coreList[0];
    }
}