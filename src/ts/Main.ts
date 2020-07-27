/// <reference path="engine/State.ts"/>
/// <reference path="engine/Messenger.ts"/>
/// <reference path="cores/CoreManager.ts"/>
/// <reference path="disks/DiskManager.ts"/>

class Main {
    public static async initialize(): Promise<any> {
        State.load();
        Messenger.initialize();

        CoreManager.initialize();
        await DiskManager.initialize();
    }
}

((): Promise<any> => Main.initialize())();