class Version {
    /** The current version */
    private static current: string = "v1.0.0";

    /**
     * Checks to see if the version has changed since last session
     */
    public static check(): void {
        // Check if the game has been started before
        if (State.getValue("progression.start")) {
            const previous: any = State.getValue("version");

            // Check if the previous and current versions match
            if (previous !== null && previous !== Version.current) {
                Version.promptRestart();
            }
        }
    }

    /**
     * Opens a prompt to the user that suggests restarting their game
     * 
     * This should only be called if the current and previous versions do not match
     */
    private static promptRestart(): void {
        const modal: Modal = new Modal();
        const content: any = modal.getContent();
        content.html(Views.get("prompt-restart"));

        // Set the click events of the buttons
        content.children(".restart").one("click", (): void => State.reset());
        content.children(".close").one("click", (): void => modal.remove());
    }

    /**
     * Saves the current version to the state
     */
    public static save(): void {
        State.setValue("version", Version.current);
    }
}