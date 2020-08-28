/// <reference path="../Utils.ts"/>

class DiskManager {
    /** Currently handled disks */
    private static disks: Disk[];

    /** List of available file extensions */
    private static fileExtensions: string[];
    /** List of available disk names */
    private static diskNames: string[];

    /** The size of all disks */
    private static diskSize: number;
    /** Current level of threat used for quarantine disks */
    private static threatLevel: number;

    /**
     * Initializes disk names and displays
     */
    public static async initialize(): Promise<any> {
        DiskManager.disks = [];

        // Get the disk name data
        const diskNameData: any = await $.getJSON("src/data/disk-names.json");
        DiskManager.fileExtensions = diskNameData.extensions;
        DiskManager.diskNames = [];
        DiskManager.generateDiskNames(diskNameData, 3);

        // Set the initial size of disks
        DiskManager.diskSize = 100;
        // Set initial quarantine level
        DiskManager.threatLevel = 1;

        // Add an initial disk and display its files by default
        DiskManager.displayFiles(DiskManager.addDisk(false));
        // Add an initial quarantine disk
        DiskManager.addDisk(true);
    }

    /**
     * Adds a new disk
     * @param isQuarantine If the disk is a quarantine disk
     * @param count If this disk should count as a statistic
     * @returns The added disk
     */
    public static addDisk(isQuarantine: boolean, count: boolean = false): Disk {
        // Get the name of the disk
        const name: string = isQuarantine ? DiskManager.getQuarantineName() : DiskManager.getDiskName();

        // Create the disk
        const disk: Disk = new Disk(DiskManager.disks.length, name, DiskManager.diskSize, isQuarantine);
    
        DiskManager.disks.push(disk);

        if (count) {
            Stats.increment("disks", "number-of-" + (isQuarantine ? "quarantines" : "disks"));
        }

        return disk;
    }

    /**
     * Tries to add a file to regular disks; if no disk has enough space then it will not be added
     */
    public static addFileToDisk(): void {
        for (const disk of DiskManager.disks) {
            if (disk.isQuarantineStorage() || disk.isBusy()) {
                continue;
            }

            if (disk.addFile(this.threatLevel)) {
                Stats.increment("disks", "files-discovered");
                return;
            }
        }
    }

    /**
     * Tries to add a file to quarantine disks; if no disk has enough space then it will not be added
     * @returns If the file was added to quarantine
     */
    public static addFileToQuarantine(file: DiskFile): boolean {
        for (const disk of DiskManager.disks) {
            if (!disk.isQuarantineStorage()) {
                continue;
            }

            if (disk.addFile(file)) {
                Stats.increment("disks", "threats-quarantined");
                return true;
            }
        }

        return false;
    }

    /**
     * Displays all files in a disk
     * @param disk The disk to display
     */
    public static displayFiles(disk: Disk): void {
        if (disk.isDisplayed()) {
            return;
        }

        // Mark each disk as not displayed
        for (const disk of DiskManager.disks) {
            disk.setDisplayed(false);
        }

        // Remove previous display
        $("#disk-view").children(".file").remove();
        // Display the files
        disk.displayFiles();
    }

    /**
     * Doubles the current disk size and updates all disks to the new size
     */
    public static upgradeDiskStorage(): void {
        DiskManager.diskSize *= 2;

        for (const disk of DiskManager.disks) {
            disk.setSize(DiskManager.diskSize);
        }
    }

    /**
     * Removes files randomly from quarantines disks
     */
    public static quarantineBreakout(): number {
        let lostFiles: number = 0;

        // Get all quarantine disks
        const quarantines: Disk[] = [];
        for (let index: number = 0; index < DiskManager.disks.length; index++) {
            const disk: Disk = DiskManager.disks[index];
            if (disk.isQuarantineStorage()) {
                quarantines.push(disk);
            }
        }

        // Randomly remove files from the disks
        const filesToLose: number = Utils.random(1, (DiskManager.threatLevel * 10) + 1);
        for (let index: number = 0; index < filesToLose; index++) {
            const disk: Disk = quarantines[Utils.random(0, quarantines.length)];

            if (disk.removeRandomFile()) {
                lostFiles++;
            }
        }

        return lostFiles;
    }

    /**
     * @returns If there are files in any quarantine disk
     */
    public static hasQuarantineFiles(): boolean {
        for (const disk of DiskManager.disks) {
            if (disk.isQuarantineStorage()) {
                if (disk.getFiles().length > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Increments the threat level
     */
    public static addThreatLevel(): void {
        DiskManager.threatLevel++;
    }

    /**
     * @returns The current threat level
     */
    public static getThreatLevel(): number {
        return DiskManager.threatLevel;
    }

    /**
     * @returns The list of available file extensions
     */
    public static getFileExtensions(): string[] {
        return DiskManager.fileExtensions;
    }

    /**
     * @param id The ID of the disk
     * @returns The disk with the given ID or the first disk
     */
    public static getDisk(id: number): Disk {
        return DiskManager.disks[id] || DiskManager.disks[0];
    }

    /**
     * @returns If any quarantine disk is available to handle a task
     */
    public static isQuarantineAvailable(): boolean {
        for (const disk of DiskManager.disks) {
            if (disk.isQuarantineStorage() && !disk.isBusy()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Creates unique disk names
     * @param data Data containing system, user and directory names
     * @param count The number of unique names to make
     */
    private static generateDiskNames(data: any, count: number): void {
        const systems: string[] = Utils.createUniqueList(data.systems, count);
        const users: string[] = Utils.createUniqueList(data.users, count);
        const directories: string[] = Utils.createUniqueList(data.directories, count * count);

        // Each system will have one user but multiple directories
        for (let index: number = 0; index < count; index++) {
            for (let dirCount: number = 0; dirCount < count; dirCount++) {
                DiskManager.diskNames.push("/" + systems[index] + "/" + users[index] + "/" + directories[(index * count) + dirCount]);
            }
        }
    }

    /**
     * @returns Gets a random disk name if one is available
     */
    private static getDiskName(): string {
        return DiskManager.diskNames.shift() || "Unavailable";
    }

    /**
     * @returns Gets the current quarantine disk name
     */
    private static getQuarantineName(): string {
        return "/quarantine/level-" + DiskManager.threatLevel;
    }
}