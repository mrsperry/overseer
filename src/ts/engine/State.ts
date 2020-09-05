class State {
    /** Game state data */
    private static data: any;

    /**
     * Gets the current state from local storage
     */
    public static load(): void {
        State.data = JSON.parse(localStorage.getItem("save") || "{}");
    }

    /**
     * Saves the current state to local storage
     */
    public static save(): void {
        Messenger.save();

        localStorage.setItem("save", JSON.stringify(State.data, null, 4));
    }

    /**
     * Gets a state value or null it could not be found
     * @param path The path of the value
     */
    public static getValue(path: string): any {
        const keys: string[] = path.split(".");
        let parent: any = State.data;

        // Find the requested value
        for (const key of keys) {
            if (parent[key] === undefined) {
                return null;
            }

            parent = parent[key];
        }

        return parent;
    }

    /**
     * Sets a state value
     * @param path The path of the value
     * @param value The value to set
     */
    public static setValue(path: string, value: any): void {
        State.set(State.data, path, value);
    }

    /**
     * Recursively sets a value
     * @param parent The current parent
     * @param path The path of the value
     * @param value The value to set
     */
    private static set(parent: any, path: string, value: any): void {
        // Check if the path has concluded
        if (path.includes(".")) {
            // Get the current key
            const keys: string[] = path.split(".");
            const key: string = <string> keys.shift();

            // Set the key if it was undefined
            if (parent[key] === undefined) {
                parent[key] = {};
            }

            // Set the next key
            State.set(parent[key], keys.join("."), value);
        } else {
            // Set the value
            parent[path] = value;
        }
    }

    /**
     * Toggles the pause state of the game
     */
    public static togglePause(): void {
        if (State.getValue("paused")) {
            State.setValue("paused", false);
            State.setValue("unpause-time", Date.now());
        } else {
            State.setValue("paused", true);
            State.setValue("pause-time", Date.now());
        }
    }
}