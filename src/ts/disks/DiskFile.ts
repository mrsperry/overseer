class DiskFile implements ISerializable {
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

    /**
     * Creates a new disk file
     * @param threatLevel The threat level of the file
     */
    public constructor(private threatLevel: number) {
        const name: string = Utils.getAlphanumericString(Utils.random(DiskFile.minNameLength, DiskFile.maxNameLength));
        const extension: string = Utils.random(DiskManager.getFileExtensions());
        this.name = name + "." + extension;

        this.size = Utils.random(1, 20 + ((threatLevel - 1) * 100));

        this.isThreat = Utils.random(0, 1 + (threatLevel * 5)) == 0;
    }

    /**
     * Creates a new disk file from a serialized state
     * @param state The serialized state
     * @returns The created file
     */
    public static deserialize(state: any): DiskFile {
        const file: DiskFile = new DiskFile(0);
        file.name = state.name;
        file.size = state.size;
        file.isThreat = state.isThreat;
        return file;
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
     * @param size The new size of the file
     */
    public setSize(size: number): void {
        this.size = size;
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

    /**
     * @returns The serialized state of this disk file
     */
    public serialize(): any {
        return {
            "name": this.name,
            "size": this.size,
            "isThreat": this.isThreat
        };
    }
}