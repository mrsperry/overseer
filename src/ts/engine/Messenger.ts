class Messenger {
    /** All displayed messages */
    private static messages: any[] = [];
    /** Max number of messages displayed at once */
    private static maxMessages: number = 15;

    /**
     * Retrieves messages from the current state and writes them
     */
    public static initialize(): void {
        for (const message of State.getValue("messages.history") || []) {
            for (let index: number = 0; index < message.amount; index++) {
                Messenger.write(message.message);
            }
        }
    }

    /**
     * Appends a new message to the messenger
     * @param text The text to write
     */
    public static write(text: string): void {
        const previousMessage: any = Messenger.messages[Messenger.messages.length - 1];
        // Check if there is a duplicate message at the front of the queue
        if (previousMessage !== undefined && text === previousMessage.message) {
            const previousElement: any = $("#messages").children("p")[0];

            // Check if there is already a counter
            if ($(previousElement).children(".amount").length === 0) {
                $("<span>")
                    .addClass("amount")
                    .hide()
                    .fadeIn()
                    .appendTo(previousElement);
            }
            
            $(previousElement).children(".amount").text(" x" + ++previousMessage.amount);
            return;
        }

        Messenger.messages.push({
            "message": text,
            "amount": 1
        });

        $("<p>")
            .html(text)
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
     * Saves the message history to the state
     */
    public static save(): void {
        State.setValue("messages.history", Messenger.messages);
    }

    /**
     * Fades out messages based on their distance from the top of the message list
     */
    private static applyOpacity(): void {
        const children: any = $("#messages").children();

        for (let index: number = 0; index < children.length; index++) {
            const child: any = $(children[index]);

            if (index !== 0) {
                child.stop();
            }

            child.css("opacity", 1 - (index / Messenger.maxMessages));
        }
    }
}