abstract class Verdict {
    /** All verdict data */
    private static verdicts: any;

    /** The modal this verdict uses */
    private modal: Modal;
    /** The current verdict data */
    private data: any;

    /** The main content section of this verdict */
    protected content: any;

    /**
     * Loads all verdict data
     */
    public static async initialize(): Promise<any> {
        Verdict.verdicts = await $.getJSON("src/data/verdicts.json");
    }

    /**
     * Creates a new verdict
     * @param id The ID of the verdict data to use
     */
    public constructor(id: string) {
        // Create the modal
        this.modal = new Modal("verdict");
        // Get the data for this verdict
        this.data = Verdict.verdicts[id];

        this.content = this.modal.getContent();

        this.addContent();
        this.registerEvents();
    }

    /**
     * Creates the main verdict screen from the current data
     */
    private addContent(): void {
        // Set the verdict title
        $("<h1>")
            .text(this.data.title)
            .appendTo(this.content);

        // Add each paragraph from the description
        const paragraphs: any = $("<div>")
            .addClass("paragraph-holder")
            .appendTo(this.content);
        for (const paragraph of Utils.createStringList(this.data.description)) {
            $("<p>")
                .addClass("centered")
                .html(paragraph)
                .appendTo(paragraphs);
        }

        // Add each option button
        const options: any = $("<div>")
            .addClass("option-holder")
            .appendTo(this.content);
        for (const option of this.data.options) {
            const button: any = $("<button>")
                .addClass("bordered " + option.id)
                .appendTo(options);
            $("<span>")
                .text(Utils.formatID(option.id))
                .appendTo(button);
        }
    }

    /**
     * Resolves this verdict and adds the final HTML
     * @param option The option number selected
     * @param success If the player succeeded
     * @returns A promise that will resolve after all content has been added while still being faded out
     */
    protected async resolve(option: number, success: boolean): Promise<any> {
        return new Promise((resolve: any) => {
            // Hide all content
            this.content.fadeOut(400, (): void => {
                this.content.fadeIn();

                // Get rid of the original paragraphs
                const paragraphHolder: any = this.content.children(".paragraph-holder")
                    .empty().fadeIn();
                // Add the new paragraphs from this resolution
                const paragraphs: string[] = Utils.createStringList(this.data.options[option][success ? "success": "fail"]);
                for (const paragraph of paragraphs) {
                    $("<p>")
                        .addClass("centered")
                        .html(paragraph)
                        .appendTo(paragraphHolder);
                }

                // Get rid of the original options
                const optionHolder: any = this.content.children(".option-holder")
                    .empty().fadeIn();
                // Add a continue button
                const close: any = $("<button>")
                    .addClass("bordered")
                    .one("click", (): void => this.modal.remove())
                    .appendTo(optionHolder);
                $("<span>")
                    .text("Continue")
                    .appendTo(close);

                // Resolve the promise to allow additional verdict specific content
                resolve();
            });
        });
    }

    /**
     * Registers the click events for each option
     */
    protected abstract registerEvents(): void;

    /**
     * @param id The ID of the verdict data
     * @returns The verdict data
     */
    protected static getVerdict(id: string): any {
        return Verdict.verdicts[id];
    }
}