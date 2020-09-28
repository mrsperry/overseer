class Progression {
    /**
     * Creates a progression event
     * @param id The ID of the progression trigger
     * @param callback An optional callback function run when the progression dialog is closed
     */
    public static trigger(id: string, callback: any = null): void {
        // Check if this progression has already been made
        if (State.getValue("progression." + id)) {
            return;
        }

        // Create the modal
        const modal: Modal = new Modal();
        // Set the event content
        const content: any = modal.getContent().html(Views.get("progression/" + id));

        // Add a continue button
        const button: any = $("<button>")
            .addClass("bordered")
            .one("click", (): void => {
                modal.remove();

                // Run the callback
                if (callback !== null) {
                    callback();
                }
            })
            .appendTo(content);
        $("<span>")
            .text("Continue")
            .appendTo(button);

        // Mark this progression as completed
        State.setValue("progression." + id, true);
    }

    /**
     * Checks if a progression event has triggered
     * @param id The ID of the progression trigger
     * @returns If the progression has been triggered
     */
    public static hasTriggered(id: string): boolean {
        return State.getValue("progression." + id);
    }
}