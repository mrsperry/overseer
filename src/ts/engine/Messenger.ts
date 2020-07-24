class Messenger {
    /** All displayed messages */
    private static messages: string[];

    /**
     * Retrieves messages from the current state and writes them
     */
    public static initialize(): void {
        Messenger.messages = State.getValue("messages") || [];

        for (const message of Messenger.messages) {
            Messenger.write(message);
        }
    }

    /**
     * Appends a new message to the messenger
     * @param text The text to write
     */
    public static write(text: string): void {
        Messenger.messages.push(text);

        $("<p>")
            .text(text)
            .prependTo("#messages");

        this.applyOpacity();
    }

    /**
     * Fades out messages based on their distance from the top of the message list
     */
    private static applyOpacity(): void {
        const children: any = $("#messages").children();

        for (let index: number = 0; index < children.length; index++) {
            $(children[index]).css("opacity", 1 - (index / 15));
        }
    }
}