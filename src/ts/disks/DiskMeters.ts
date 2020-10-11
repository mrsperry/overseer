class DiskMeters {
    /** The parent element of the meters */
    private static parent: JQuery<HTMLElement>;

    /**
     * Loads disk meter data from the state
     * 
     * This populates the meters with data from core assignments
     */
    public static initialize(): void {
        // Add the meter elements and display them
        DiskMeters.parent = $(".disk-meters").html(Views.get("disks/disk-meters"));
        Utils.showElements(".disk-meters");

        // Add initial measurements
        DiskMeters.update();
    }

    /**
     * Populate the disk meters with measurements from core assignments
     */
    public static update(): void {
        const meter: any = DiskMeters.parent.children(".meter");
        
        meter.children(".files-added").text(CoreAssignments.getSearching() + "/s");
        meter.children(".files-scanned").text(CoreAssignments.getScanning() + "/s");
        meter.children(".files-purged").text(CoreAssignments.getPurging() + "/s");
    }
}