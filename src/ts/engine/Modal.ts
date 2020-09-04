class Modal {
    /** The main content element */
    private content: JQuery<HTMLElement>;

    /**
     * Creates a new Modal
     * 
     * Adds an optional class with a "-content" postfix
     * @param className The optional class name
     */
    public constructor(className: string | undefined = undefined) {
        State.togglePause();

        const container: any = $("<div>")
            .addClass("modal-container")
            .hide()
            .fadeIn()
            .appendTo("body");
        $("<div>")
            .addClass("modal-bg")
            .appendTo(container);
        this.content = $("<div>")
            .addClass("modal-content " + (className === undefined ? "" : className) + "-content")
            .appendTo(container);
    }

    /**
     * @returns The main content element
     */
    public getContent(): JQuery<HTMLElement> {
        return this.content;
    }

    /**
     * Removes the modal after a specified delay
     * @param delay The amount of milliseconds to wait before fading out; defaults to zero
     */
    public remove(delay: number = 0): void {
        State.togglePause();

        const container: any = $(".modal-container")
            .delay(delay)
            .fadeOut(400, (): void => container.remove());
    }
}