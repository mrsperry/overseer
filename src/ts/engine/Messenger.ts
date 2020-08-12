class Messenger {
    /** All displayed messages */
    private static messages: string[];
    /** Max number of messages displayed at once */
    private static maxMessages: number = 15;

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
        // Check if there is a duplicate message at the front of the queue
        if (text === Messenger.messages[Messenger.messages.length - 1]) {
            const previous: any = $("#messages").children("p")[0];

            // Check if there is already a counter
            if ($(previous).children("span").length === 0) {
                $("<span>")
                    .text(" x2")
                    .hide()
                    .fadeIn()
                    .appendTo(previous);
            } else {
                const child = $(previous).children("span")[0];
                const text: string = $(child).text();

                // Edit the number of the counter (" x2" -> " x3")
                $(child).text(" x" + (Number.parseInt(text.substring(2, text.length)) + 1));
            }

            return;
        }

        Messenger.messages.push(text);

        $("<p>")
            .text(text)
            .hide()
            .fadeIn()
            .prependTo("#messages");

        // Check if a message needs to be removed
        if (Messenger.messages.length > Messenger.maxMessages) {
            Messenger.messages.shift();

            $("#messages")
                .children("p:last-child")
                .remove();
        }

        this.applyOpacity();
    }

    /**
     * Fades out messages based on their distance from the top of the message list
     */
    private static applyOpacity(): void {
        const children: any = $("#messages").children();

        for (let index: number = 0; index < children.length; index++) {
            $(children[index]).css("opacity", 1 - (index / Messenger.maxMessages));
        }
    }
}