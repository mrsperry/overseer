/// <reference path="engine/State.ts"/>
/// <reference path="engine/Stats.ts"/>
/// <reference path="engine/Messenger.ts"/>
/// <reference path="cores/CoreManager.ts"/>
/// <reference path="disks/DiskManager.ts"/>
/// <reference path="Research.ts"/>

class Main {
    public static initialize(): void {
        const menu: any = $("#main-menu")
            .fadeOut(400, async (): Promise<any> => {
                menu.remove();
                $("#main-content")
                    .fadeIn()
                    .css("display", "grid");

                State.load();
                await Stats.initialize();
                Messenger.initialize();
        
                CoreManager.initialize();
                DiskManager.initialize();
                await Research.initialize();
                HackTimer.initialize();
            });
    }
}