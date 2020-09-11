/// <reference path="engine/State.ts"/>
/// <reference path="engine/Messenger.ts"/>
/// <reference path="cores/CoreManager.ts"/>
/// <reference path="disks/DiskManager.ts"/>
/// <reference path="menus/Settings.ts"/>
/// <reference path="menus/Stats.ts"/>
/// <reference path="Research.ts"/>

class Main {
    public static async initialize(): Promise<any> {
        State.load();
        Settings.initialize();
        await Stats.initialize();

        $(window).on("beforeunload", (): void => State.save());
    }

    public static startGame(): void {
        const menu: any = $("#main-menu")
            .fadeOut(400, async (): Promise<any> => {
                menu.remove();
                $("#main-content")
                    .fadeIn()
                    .css("display", "grid");
                $("footer")
                    .fadeIn()
                    .css("display", "flex");

                State.gameStarted();

                Messenger.initialize();
                await DiskManager.initialize();
                CoreManager.initialize();
                // Unpause the game after core tasks have been initialized
                if (State.getValue("paused")) {
                    State.togglePause();
                }
                await Research.initialize();
                HackTimer.initialize();
            });
    }
}

$(document).ready((): Promise<any> => Main.initialize());