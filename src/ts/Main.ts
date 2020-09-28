/// <reference path="engine/State.ts"/>
/// <reference path="engine/Messenger.ts"/>
/// <reference path="engine/Views.ts"/>
/// <reference path="events/verdicts/Verdict.ts"/>
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
        await Views.initialize();
        await Verdict.initialize();
        Version.check();

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
                DataCore.initialize();
                ChannelManager.initialize();
                CoreManager.initialize();
                // Unpause the game after core tasks have been initialized
                if (State.getValue("paused")) {
                    State.togglePause();
                }
                await Research.initialize();

                VerdictTimer.initialize();
                ChannelDetection.initialize();

                Progression.trigger("start", (): void => {
                    $("#messages")
                        .fadeIn();
                    $("#cores")
                        .fadeIn()
                        .css("display", "flex");
                    $("#disks")
                        .fadeIn()
                        .css("display", "grid");
                });
            });
    }
}

((): Promise<any> => Main.initialize())();