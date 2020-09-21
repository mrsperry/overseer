/// <reference path="Verdict.ts"/>

class SuspiciousFolder extends Verdict {
    /** The min amount of reliability to change */
    private static minReliability: number = 25;
    /** The max amount of reliability to change */
    private static maxReliability: number = 75;
    /** The min amount of files to gain */
    private static minFiles: number = 1;
    /** The max amount of files to gain */
    private static maxFiles: number = 6;

    /**
     * Creates a new SuspiciousFolder verdict
     */
    public constructor() {
        super("suspicious-folder");
    }

    /**
     * Registers the on click events
     */
    protected registerEvents(): void {
        const options: any = this.content.children(".option-holder");
        options.children(".prompt-admin").one("click", (): void => this.promptAdmin(0));
        options.children(".purge-folder").one("click", (): void => this.purgeFolder(1));
        options.children(".collect-files").one("click", (): void => this.collectFiles(2));
    }

    /**
     * Used when selecting "Prompt admin"
     * @param option The number of the button
     */
    private promptAdmin(option: number): void {
        // 50-50 chance of success
        const success: boolean = Utils.random();

        // Wait for the verdict to resolve
        $.when(super.resolve(option, success)).done((): void => {
            // Get a random amount of reliability
            let amount: number = Utils.random(SuspiciousFolder.minReliability, SuspiciousFolder.maxReliability) / 100;
            const amountString: string = amount.toString();
            // Invert the sign of the reliability
            if (!success) {
                amount *= -1;
            }

            // Add the reliability gained/lost text
            const reliability: any = $("<p>")
                .addClass("centered")
                .text("Reliability " + (success ? "gained" : "lost") + ": ")
                .appendTo(this.content.children(".paragraph-holder"));
            $("<span>")
                .addClass("clickable-no-click " + (success ? "" : "active-error"))
                .text(amountString)
                .appendTo(reliability);

            Research.addReliability(amount);
        });
    }

    /**
     * Used when selecting "Purge folder"
     * @param option The number of the button
     */
    private purgeFolder(option: number): void {
        super.resolve(option, true);
    }

    /**
     * Used when selecting "Collect files"
     * @param option The number of the button
     */
    private collectFiles(option: number): void {
        // 1 in 4 chance of failure
        const success: boolean = Utils.random(0, 4) !== 0;

        // Wait until the verdict resolves
        $.when(super.resolve(option, success)).done((): void => {
            if (success) {
                // The number of files to try to add
                const filesToAdd: number = Utils.random(SuspiciousFolder.minFiles, SuspiciousFolder.maxFiles);
                // The number of files actually added to a disk
                let amount: number = 0;

                // Try to add each file to a disk
                for (let index: number = 0; index < filesToAdd; index++) {
                    if (DiskManager.addFileToDisk()) {
                        amount++;
                    } else {
                        break;
                    }
                }

                // Add the files gained text
                const files: any = $("<p>")
                    .addClass("centered")
                    .text("Files gained: ")
                    .appendTo(this.content.children(".paragraph-holder"));
                $("<span>")
                    .addClass("clickable-no-click")
                    .text(amount)
                    .appendTo(files);
            }
        });
    }
}