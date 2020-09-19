class Progression {
    /**
     * Creates a progression event
     * @param id The ID of the progression trigger
     */
    public static trigger(id: string): void {
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
            .one("click", (): void => modal.remove())
            .appendTo(content);
        $("<span>")
            .text("Continue")
            .appendTo(button);

        // Mark this progression as completed
        State.setValue("progression." + id, true);
    }
}