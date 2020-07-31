class Disk {
    /** Min file name length */
    private static minFileNameLength: number = 7;
    /** Max file name length */
    private static maxFileNameLength: number = 16;
    /** Max number of files to be displayed */
    private static maxDisplayedFiles: number = 11;
    /** Number of milliseconds to delay before fading in when displaying files */
    private static displayDelay: number = 50;

    /** HTML element parent */
    private parent: JQuery<HTMLElement>;

    /** List of files this disk currently handles */
    private files: any[] = [];
    /** If the files in this disk are being displayed */
    private displayed: boolean = false;
    /** The number of files currently displayed */
    private displayedFiles: number = 0;

    /**
     * Creates a new disk to store files
     * @param id The ID of the disk
     * @param name The name of the disk
     * @param maxStorage Maximum number of kilobytes the disk can hold
     * @param isQuarantine If the disk is a quarantine disk
     */
    public constructor(id: number, name: string, private maxStorage: number, private isQuarantine: boolean) {
        // Create the disk display
        this.parent = $("<div>")
            .attr("id", "disk-" + id)
            .addClass("disk")
            .hide()
            .fadeIn()
            .appendTo(isQuarantine ? "#quarantines" : "#drives");
        $("<span>")
            .addClass("disk-name clickable")
            .text(name)
            .click((): void => DiskManager.displayFiles(this))
            .appendTo(this.parent);
        $("<span>")
            .addClass("disk-usage")
            .appendTo(this.parent);

        // Set the usage percentage
        this.updateUsage();
    }

    /**
     * Display the disk's files
     */
    public displayFiles(): void {    
        // Display all the files with a small delay for a cascade effect
        for (let index: number = 0; index < this.files.length; index++) {
            if (this.displayedFiles === Disk.maxDisplayedFiles) {
                break;
            }

            this.displayFile(this.files[index], index * Disk.displayDelay);
        }

        // Make sure the correct header is displayed (no files to show, scan files or purge files)
        this.updateFileDisplay(this.displayedFiles * Disk.displayDelay);

        // Mark this disk as the one currently displayed
        this.setDisplayed(true);
    }

    /**
     * Tries to add a file to the disk
     * @param size The size in kilobytes of the file
     * @returns If there was enough room to add the file
     */
    public addFile(size: number): boolean {
        // Check if there is enough space on the disk for this file
        if (this.maxStorage - this.getUsage() >= size) {
            // Create the file
            const file: any = {
                "name": this.generateFileName(),
                "size": size
            };
            this.files.push(file);

            // Update the file display
            if (this.isDisplayed()) {
                if (this.displayedFiles !== Disk.maxDisplayedFiles) {
                    this.displayFile(file);
                }

                this.updateFileDisplay();
            }

            this.updateUsage();
            return true;
        }

        return false;
    }

    /**
     * @returns If this disk is currently displayed
     */
    public isDisplayed(): boolean {
        return this.displayed;
    }

    /**
     * @param displayed If the disk should be displayed or not
     */
    public setDisplayed(displayed: boolean): void {
        this.displayed = displayed;

        // Highlight the disk if it is displayed
        const element: any = this.parent.children(".disk-name");
        if (displayed) {
            element.addClass("active");
        } else {
            element.removeClass("active");

            // Reset the number of displayed files
            this.displayedFiles = 0;
        }
    }

    /**
     * @returns If this disk is a quarantine disk
     */
    public isQuarantineStorage(): boolean {
        return this.isQuarantine;
    }

    /**
     * @returns The current usage of the disk in kilobytes
     */
    private getUsage(): number {
        let usage: number = 0;

        for (const file of this.files) {
            usage += file.size;
        }

        return usage;
    }

    /**
     * Sets the HTML usage display using a percentage
     */
    private updateUsage(): void {
        this.parent.children(".disk-usage")
            .text(Math.floor((this.getUsage() / this.maxStorage) * 100) + "%");
    }

    /**
     * Updates the header of the file display depending on amount of files and disk type
     * 
     * Also updates the number of extra files displayed if the maximum has been reached
     * @param delay Number of milliseconds to delay before extra files animation plays
     */
    private updateFileDisplay(delay: number = 0): void {
        const parent: any = $("#disk-view");
        const header: any = parent.children(".header");

        if (this.files.length == 0) {
            header.text("No files to display")
                .removeClass("clickable");
        } else {
            header.addClass("clickable");

            if (this.isQuarantine) {
                header.text("Purge files")
                    .click();
            } else {
                header.text("Scan files")
                    .click();
            }
        }

        // Check if an extra files indicator is needed
        if (this.files.length > Disk.maxDisplayedFiles) {
            let extra: any = parent.children(".extra-files");

            // Check if the element exists and add it if it doesn't
            if (extra.length === 0) {
                extra = $("<div>")
                    .addClass("file extra-files")
                    .hide()
                    .delay(delay)
                    .fadeIn()
                    .appendTo(parent);
            }

            extra.text("...and " + (this.files.length - Disk.maxDisplayedFiles) + " more");
        }
    }

    /**
     * Displays a file on the file display
     * @param file The file to display
     * @param delay The amount of delay in milliseconds before the file is shown
     */
    private displayFile(file: any, delay: number = 0): void {
        const parent: any = $("<div>")
            .addClass("file")
            .hide()
            .delay(delay)
            .fadeIn()
            .appendTo($("#disk-view"));
        $("<span>")
            .text(file.name)
            .appendTo(parent);
        $("<span>")
            .text(file.size + "kb")
            .appendTo(parent);
        
        this.displayedFiles++;
    }

    /**
     * Generates a random alphanumeric file name with a random file extension
     * @returns The alphanumeric file name
     */
    private generateFileName(): string {
        const name: string = Utils.getAlphanumericString(Utils.random(Disk.minFileNameLength, Disk.maxFileNameLength));
        const extension: string = Utils.random(DiskManager.getFileExtensions());

        return name + "." + extension;
    }
}