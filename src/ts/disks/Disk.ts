class Disk implements ISerializable {
    /** Max number of files to be displayed */
    private static maxDisplayedFiles: number = 10;
    /** Number of milliseconds to delay before fading in when displaying files */
    private static displayDelay: number = 50;

    /** HTML element parent */
    private parent: JQuery<HTMLElement>;

    /** List of files this disk currently handles */
    private files: DiskFile[] = [];
    /** If the files in this disk are being displayed */
    private displayed: boolean = false;
    /** The number of files currently displayed */
    private displayedFiles: number = 0;
    /** If the disk is currently being wiped */
    private isWiping: boolean = false;

    /**
     * Creates a new disk to store files
     * @param id The ID of the disk
     * @param name The name of the disk
     * @param maxStorage Maximum number of kilobytes the disk can hold
     * @param isQuarantine If the disk is a quarantine disk
     */
    public constructor(private id: number, private name: string, private maxStorage: number, private isQuarantine: boolean) {
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
     * Creates a new disk from a serialized state
     * @param state The serialized state
     * @returns The created disk
     */
    public static deserialize(state: any): Disk {
        const disk: Disk = DiskManager.addDisk(state.isQuarantine, false, state.name);
        disk.files = state.files.map((file: any): DiskFile => DiskFile.deserialize(file));
        disk.isWiping = state.isWiping;
        disk.setDisplayed(state.displayed);
        disk.setSize(state.maxStorage);

        if (state.isDisplayed) {
            disk.displayFiles();
        }

        return disk;
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
     * Displays a file on the file display
     * @param file The file to display
     * @param delay The amount of delay in milliseconds before the file is shown
     */
    private displayFile(file: DiskFile, delay: number = 0): void {
        const parent: any = $("<div>")
            .addClass("file")
            .hide()
            .delay(delay)
            .fadeIn()
            .appendTo($("#disk-view"));
        $("<span>")
            .text(file.getName())
            .appendTo(parent);
        $("<span>")
            .text(file.getSize() + "kb")
            .appendTo(parent);
        
        this.displayedFiles++;
    }

    /**
     * Tries to add a file to this disk
     * @param file The file to add
     * @returns If the file was added
     */
    public addFile(file: DiskFile): boolean;
    /**
     * Creates a new file and tries to add it to this disk
     * @param threatLevel The threat level of the file
     * @returns If the file was added
     */
    public addFile(threatLevel: number): boolean;
    public addFile(arg1: DiskFile | number): boolean {
        const usage: number = this.getUsage();
        // Check if there is enough space on the disk for this file
        if (usage === this.maxStorage) {
            return false;
        }

        const file: DiskFile = typeof(arg1) === "number" ? new DiskFile(arg1) : arg1;
        // Shrink the file to fit into the disk if it is too big
        if (this.maxStorage - usage < file.getSize()) {
            file.setSize(this.maxStorage - usage);
        }

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
        const header: any = parent.children(".header")
            .removeClass("disabled clickable")
            .off("click");
        const subheader: any = parent.children(".subheader")
            .fadeIn();
        const size: any = subheader.children(".disk-size");

        if (this.files.length == 0) {
            header.text("No files to display");
            subheader.hide();
        } else {
            header.addClass(this.isWiping ? "disabled" : "clickable")
                .text((this.isQuarantine ? "Purge" : "Scan") + " files");
            size.text(Utils.stringify(this.getUsage()) + "kb/" + Utils.stringify(this.maxStorage) + "kb");

            if (!this.isWiping) {
                header.click((): CoreTask => this.wipeDisk(this.isQuarantine));
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
     * Removes a random file
     * @returns If there was a file to remove
     */
    public removeRandomFile(): boolean {
        if (this.files.length === 0) {
            return false;
        }

        this.files.splice(Utils.random(0, this.files.length), 1);

        // Update all displays
        if (this.displayed) {
            this.setDisplayed(false);
            DiskManager.displayFiles(this);
            this.updateUsage();
        }

        return true;
    }

    /**
     * Performs an operation on the disk then clears it
     * @param operation The operation to perform: true for purging, false for scanning
     * @param core The core this task should run on
     * @returns The created core task
     */
    public wipeDisk(operation: boolean, core?: Core): CoreTask {
        const callback: Function = (): void => operation ? this.purgeFiles() : this.scanFiles();
        const display: string = (operation ? "Purge" : "Scan") + ": " + this.name;
        const type: CoreTaskType = operation ? CoreTaskType.Purge : CoreTaskType.Scan;

        const task: CoreTask = CoreTask.create(display, this.getUsage(), type)
            .setOnComplete((): void => {
                callback();

                this.files = [];
                this.displayedFiles = 0;
                
                // Remove files from the display
                if (this.displayed) {
                    for (const child of $("#disk-view").children(".file")) {
                        $(child).fadeOut(400, (): void => {
                            $(child).remove();
                        });
                    }

                    this.updateFileDisplay();
                }

                this.updateUsage();

                this.isWiping = false;
            })
            .setOnCancel((): void => {
                this.isWiping = false;

                if (this.displayed) {
                    this.updateFileDisplay();
                }
            })
            .setDisk(this);
        
        // Make sure a quarantine drive is available when scanning
        if (type === CoreTaskType.Scan && !DiskManager.isQuarantineAvailable()) {
            Messenger.write("All quarantine drives are currently busy")
            return task;
        }

        // Update header if the task can be run
        if (task.run(core)) {
            this.isWiping = true;
            this.updateFileDisplay();
        } else {
            Messenger.write("No cores are currently available");
        }

        return task;
    }

    /**
     * Scans the files on this disk for threats
     * 
     * Threats found are moved to quarantine
     */
    private scanFiles(): void {
        const files: DiskFile[] = this.getFiles();
        const length: number = files.length;

        let threats: number = 0;
        for (let index: number = 0; index < length; index++) {
            const file: DiskFile = files[index];

            // Move infected files to quarantine
            if (file.getIsThreat()) {
                threats++;
                DiskManager.addFileToQuarantine(file);
            }
        }

        Messenger.write("Scanned <span class='clickable-no-click'>" + length + "</span> files and found <span class='clickable-no-click active-error'>" + threats + "</span> vulnerabilit" + (threats === 1 ? "y" : "ies"));
        Stats.add("disks", "files-scanned", length);
    }

    /**
     * Purges files from a quarantine disk for reliability
     */
    private purgeFiles(): void {
        const files: DiskFile[] = this.getFiles();
        const length: number = files.length;

        let reliability: number = 0;
        for (const file of files) {
            reliability += file.getSize() / 100;
        }
        Research.addReliability(reliability);

        Messenger.write("Purged <span class='clickable-no-click'>" + length + "</span> file" + (length === 1 ? "" : "s") + " and gained <span class='clickable-no-click'>" + reliability.toFixed(2) + "</span> reliability");
        Stats.add("disks", "threats-purged", length);
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
     * @param size The new size of the disk
     */
    public setSize(size: number): void {
        this.maxStorage = size;
        this.updateUsage();
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
            usage += file.getSize();
        }

        return usage;
    }

    /**
     * @returns The list of all files on this disk
     */
    public getFiles(): DiskFile[] {
        return this.files;
    }

    /**
     * @returns The ID of this disk
     */
    public getID(): number {
        return this.id;
    }

    /**
     * @returns If the disk is currently being wiped
     */
    public isBusy(): boolean  {
        return this.isWiping;
    }

    /**
     * @returns The serialized state of this disk
     */
    public serialize(): any {
        return {
            "id": this.id,
            "name": this.name,
            "files": this.files.map((file: DiskFile): void => file.serialize()),
            "maxStorage": this.maxStorage,
            "isQuarantine": this.isQuarantine,
            "isDisplayed": this.displayed,
            "isWiping": this.isWiping
        };
    }
}