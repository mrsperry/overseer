class DataCore {
    /** The width and height of the canvas display */
    private static canvasSize: number = 300;
    /** The size of individual cubes */
    private static cubeSize: number = 29;
    /** The actual size of individual cubes including any padding */
    private static realCubeSize: number = 30;
    /** The number of cubes per row */
    private static cubesPerRow: number = 10;

    /** The canvas display context */
    private static context: any;
    /** The current progress of the data core */
    private static progress: number;

    /**
     * Loads data core data from the state
     */
    public static initialize(): void {
        // Create the display canvas
        const canvas: any = $("<canvas>")
            .attr("width", DataCore.canvasSize)
            .attr("height", DataCore.canvasSize)
            .appendTo("#data-core");

        // Get the context
        DataCore.context = canvas[0].getContext("2d");
        // Display any saved data
        DataCore.progress = State.getValue("data-core") || 0;
        DataCore.displayData(DataCore.progress);
    }

    /**
     * Displays a data core's progress
     * 
     * Each 1% of progress translates to one cube displayed
     * @param progress The amount of progress to display
     */
    public static displayData(progress: number): void {
        DataCore.progress = progress;

        // Get the context
        const context: any = DataCore.context;
        // Reset the canvas
        context.clearRect(0, 0, DataCore.canvasSize, DataCore.canvasSize);
        context.fillStyle = $("body").css("--clickable-text");

        // Draw the progress cubes
        for (let index: number = 0; index < Math.floor(progress); index++) {
            // Find a fraction of the index (used to determine when to wrap to a new line)
            const fraction: number = Math.floor(index / DataCore.cubesPerRow);
            // Get the x and y coordinates
            const x: number = (index * DataCore.realCubeSize) - (fraction * DataCore.canvasSize);
            const y: number = (DataCore.canvasSize - DataCore.cubeSize) - (fraction * DataCore.realCubeSize);
            
            // Draw the cube
            context.beginPath();
            context.rect(x, y, DataCore.cubeSize, DataCore.cubeSize);
            context.fill();
        }
    }

    /**
     * Saves the data core to the state
     */
    public static save(): void {
        State.setValue("data-core", DataCore.progress);
    }
}