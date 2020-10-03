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

        // Start the main menu animation
        const menu: any = $("#main-menu").css("display", "flex");
        const children: any = menu.children();

        for (let index: number = 0; index < children.length; index++) {
            const child: any = $(children[index]);

            // Start the main menu image animation
            if (child.is("img")) {
                child.addClass("loading-anim");
                continue;
            }

            // Have each child wait for the image animation to complete then fade in
            child.hide()
                .delay(3000 + ((index - 1) * 125))
                .fadeIn();
        }

        $(window).on("beforeunload", (): void => State.save());
    }

    public static startGame(): void {
        const menu: any = $("#main-menu")
            .fadeOut(400, async (): Promise<any> => {
                menu.remove();
                $("#main-content")
                    .fadeIn()
                    .css("display", "flex");
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

                Hack.initialize();
            });
    }
}

((): Promise<any> => Main.initialize())();