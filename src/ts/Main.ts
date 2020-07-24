/// <reference path="engine/State.ts"/>
/// <reference path="engine/Messenger.ts"/>

class Main {
    public static initialize(): void {
        State.load();
        Messenger.initialize();
    }
}

((): void => Main.initialize())();