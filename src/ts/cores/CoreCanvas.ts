class CoreCanvas {
    /** Width and height of the core canvases */
    private static canvasSize = 50;
    /** Radius of the core canvas */
    private static canvasRadius = CoreCanvas.canvasSize / 2;

    /** Canvas context */
    private context: any;

    public constructor(parent: JQuery<HTMLElement>) {
        const canvas: any = $("<canvas>")
            .attr("width", CoreCanvas.canvasSize)
            .attr("height", CoreCanvas.canvasSize)
            .appendTo(parent);

        // Initial transformations of the canvas
        this.context = canvas[0].getContext("2d");
        this.context.translate(CoreCanvas.canvasRadius, CoreCanvas.canvasRadius);
        // Rotate -90 degrees to start at the top when drawing
        this.context.rotate((-90 * Math.PI) / 180);
    }

    /**
     * Draws the core
     */
    public drawCore(progress: number): void {
        // Clear the canvas
        this.context.clearRect(-CoreCanvas.canvasRadius, -CoreCanvas.canvasRadius, CoreCanvas.canvasSize, CoreCanvas.canvasSize);

        const draw: Function = (color: string, percent: number): void => {
            this.context.beginPath();
            // Arc from the top of the canvas to the current progress percent
            this.context.arc(0, 0, CoreCanvas.canvasRadius - 1, 0, Math.PI * 2 * percent);
            // Set the color of the stroke
            this.context.strokeStyle = color;
            this.context.lineWidth = 2;
            this.context.stroke();
        };

        // Draw the outline
        draw("#333333", 1);
        // Draw the current progress
        draw($("body").css("--clickable-text"), progress / 100);
    }
}