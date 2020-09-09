class Views {
    /** The object in which all views are stored */
    private static data: any = {};

    /**
     * Loads views from file
     */
    public static async initialize(): Promise<any> {
        // Load the views manifest
        const manifest: string = await $.get("src/views/manifest.txt");
        // Get each file in the manifest
        for (const fileName of manifest.split("\n")) {
            Views.data[fileName.trim()] = await $.get("src/views/" + fileName + ".html");
        }
    }

    /**
     * Gets a view with the given ID
     * @param id The ID of the view
     */
    public static get(id: string): string {
        return Views.data[id] || "Could not find view: " + id;
    }
}