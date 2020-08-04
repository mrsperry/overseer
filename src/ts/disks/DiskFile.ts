class DiskFile {
    /** Min file name length */
    private static minNameLength: number = 7;
    /** Max file name length */
    private static maxNameLength: number = 16;

    /** The display name of this file (name.extension) */
    private name: string;
    /** The size of this file in kilobytes */
    private size: number;
    /** If this file is a threat */
    private isThreat: boolean;

    public constructor(private threatLevel: number) {
        const name: string = Utils.getAlphanumericString(Utils.random(DiskFile.minNameLength, DiskFile.maxNameLength));
        const extension: string = Utils.random(DiskManager.getFileExtensions());
        this.name = name + "." + extension;

        this.size = Utils.random(1, 20 + ((threatLevel - 1) * 100));

        this.isThreat = Utils.random(0, 175 - (threatLevel * 50)) == 0;
    }

    /**
     * @returns The display name of this file
     */
    public getName(): string {
        return this.name;
    }

    /**
     * @returns The size of this file in kilobytes
     */
    public getSize(): number {
        return this.size;
    }

    /**
     * @returns If this file is a threat
     */
    public getIsThreat(): boolean {
        return this.isThreat;
    }

    /**
     * @returns The threat level of this file
     */
    public getThreatLevel(): number {
        return this.threatLevel;
    }
}