/// <reference path="engine/State.ts"/>
/// <reference path="engine/Messenger.ts"/>
/// <reference path="cores/CoreManager.ts"/>
/// <reference path="disks/DiskManager.ts"/>
/// <reference path="menus/Stats.ts"/>
/// <reference path="Research.ts"/>

class Main {
    public static async initialize(): Promise<any> {
        State.load();
        await Stats.initialize();
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

                Messenger.initialize();
        
                CoreManager.initialize();
                DiskManager.initialize();
                await Research.initialize();
                HackTimer.initialize();

                $(window).on("beforeunload", (): void => State.save());
            });
    }
}

((): Promise<any> => Main.initialize())();