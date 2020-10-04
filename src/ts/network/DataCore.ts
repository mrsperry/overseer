class DataCore {
    /** The width and height of the canvas display */
    private static canvasSize: number = 280;
    /** The size of individual cubes */
    private static cubeSize: number = 27;
    /** The actual size of individual cubes including any padding */
    private static realCubeSize: number = 28;
    /** Half of the cube size */
    private static cubeRadius: number = DataCore.cubeSize / 2;
    /** The number of cubes per row */
    private static cubesPerRow: number = 10;
    /** The number used to control the speed at which cubes start fading in (higher = slower) */
    private static cubeFadeSpeed: number = 3;

    /** The canvas display context */
    private static context: any;
    /** The handler for the window interval that draws the canvas */
    private static handler: number;
    /** List of displayed cubes */
    private static cubes: any[];

    /**
     * Creates the data core canvas element
     */
    public static initialize(): void {
        if (Progression.hasTriggered("channel-unlock")) {
            Utils.showElements(".data-core", ".network-tab");
        }

        // Create the display canvas
        const canvas: any = $("<canvas>")
            .attr("width", DataCore.canvasSize)
            .attr("height", DataCore.canvasSize)
            .appendTo(".data-core");
        
        DataCore.context = canvas[0].getContext("2d");
        DataCore.handler = -1;
        DataCore.cubes = [];
    }

    /**
     * Sets the data core progress
     * 
     * The progress must be higher than the previous progress for any visual change to occur
     * @param progress The amount of progress
     */
    public static setData(progress: number): void {
        // Get the number of cubes to add
        const toAdd: number = Math.floor(progress) - DataCore.cubes.length;

        // Add additional cubes
        for (let index: number = 0; index < toAdd; index++) {
            DataCore.cubes.push(0);
        }

        DataCore.displayData();
    }

    /**
     * Sets the data core progress
     * 
     * This will reset the data by clearing any visible cubes then adding the appropriate amount
     * @param progress The amount of progress
     */
    public static resetData(progress: number): void {
        // Clear the canvas and cube list
        DataCore.context.clearRect(0, 0, DataCore.canvasSize, DataCore.canvasSize);
        window.clearInterval(DataCore.handler);
        DataCore.handler = -1;
        DataCore.cubes = [];

        // Set the new progress amount
        DataCore.setData(progress);
    }

    /**
     * Displays a data core's progress
     * 
     * Each 1% of progress translates to one cube displayed
     * @param progress The amount of progress to display
     */
    private static displayData(): void {
        // Get the context
        const context: any = DataCore.context;

        // Don't create a new handler if one is already running
        if (DataCore.handler !== -1) {
            return;
        }

        // Set the fill style
        context.fillStyle = $("body").css("--clickable-text");

        // Number of frames that have passed
        let frameCount: number = 0;
        // Create a new interval
        DataCore.handler = window.setInterval((): void => {
            // Get the cubes to draw
            const cubes: any[] = DataCore.cubes;
            // Calculate the number of cubes to draw this frame (adds a cascade effect)
            const cubesToDraw: number = Math.min(frameCount / DataCore.cubeFadeSpeed, cubes.length);

            // Draw the progress cubes
            for (let index: number = 0; index < cubesToDraw; index++) {
                // Find a fraction of the index (used to determine when to wrap to a new line)
                const fraction: number = Math.floor(index / DataCore.cubesPerRow);
                // Get the x and y coordinates
                const x: number = (index * DataCore.realCubeSize) - (fraction * DataCore.canvasSize);
                const y: number = (DataCore.canvasSize - DataCore.cubeSize) - (fraction * DataCore.realCubeSize);
                
                // Get the scale of this cube
                let scale: number = DataCore.cubes[index];
                if (scale >= 100) {
                    // Skip cubes that are already scaled by 100%
                    continue;
                } else {
                    // Increment the scale if it is not at 100%
                    DataCore.cubes[index]++;
                }
                // Convert the scale to a value between 0 and 1
                scale /= 100;

                // Calculate the offset to center the cube at scales lower than 1
                const offset: number = DataCore.cubeRadius - (DataCore.cubeRadius * scale);

                context.beginPath();
                // Translate to the correct offset position
                context.translate(x + offset, y + offset);
                // Scale the transform
                context.scale(scale, scale);
                context.rect(0, 0, DataCore.cubeSize, DataCore.cubeSize);
                context.fill();
                // Reset the transform after the cube has been drawn
                context.setTransform(1, 0, 0, 1, 0, 0);
            }

            // Check if this handler can be cleared (once all cubes are 100% scaled)
            if (cubes[cubes.length - 1] >= 100) {
                window.clearInterval(DataCore.handler);
                DataCore.handler = -1;
            }

            // Increment the number of frames
            frameCount++;
        }, 1);
    }
}