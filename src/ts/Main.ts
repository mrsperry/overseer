/// <reference path="engine/State.ts"/>
/// <reference path="engine/Messenger.ts"/>
/// <reference path="cores/CoreManager.ts"/>

class Main {
    public static initialize(): void {
        State.load();
        Messenger.initialize();

        CoreManager.initialize();
    }
}

((): void => Main.initialize())();