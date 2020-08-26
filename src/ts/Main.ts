/// <reference path="engine/State.ts"/>
/// <reference path="engine/Stats.ts"/>
/// <reference path="engine/Messenger.ts"/>
/// <reference path="cores/CoreManager.ts"/>
/// <reference path="disks/DiskManager.ts"/>
/// <reference path="Research.ts"/>

class Main {
    public static async initialize(): Promise<any> {
        State.load();
        await Stats.initialize();
        Messenger.initialize();

        CoreManager.initialize();
        DiskManager.initialize();
        await Research.initialize();
        HackTimer.initialize();
    }
}

((): Promise<any> => Main.initialize())();