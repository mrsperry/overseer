/// <reference path="engine/State.ts"/>
/// <reference path="engine/Messenger.ts"/>
/// <reference path="cores/CoreManager.ts"/>
/// <reference path="disks/DiskManager.ts"/>
/// <reference path="Research.ts"/>

class Main {
    public static initialize(): void {
        State.load();
        Messenger.initialize();

        CoreManager.initialize();
        DiskManager.initialize();
        Research.initialize();
    }
}

((): void => Main.initialize())();