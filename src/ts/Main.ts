/// <reference path="engine/State.ts"/>

class Main {
    public static initialize(): void {
        State.load();
    }
}

((): void => Main.initialize())();