class CoreCanvas {
    /** Width and height of the core canvases */
    private static canvasSize: number = 50;
    /** Width and height of the compact canvases */
    private static compactSize: number = 16;

    /** The canvas element */
    private canvas: any;
    /** Canvas context */
    private context: any;

    /** The size of the canvas */
    private size: number;
    /** The radius of the canvas */
    private radius: number;

    /**
     * Creates a new core canvas
     * @param parent The parent core element
     * @param isCompact If the canvas should be a compact size
     */
    public constructor(parent: JQuery<HTMLElement>, isCompact: boolean) {
        // Get the size of the canvas
        this.size = isCompact ? CoreCanvas.compactSize : CoreCanvas.canvasSize;
        this.radius = this.size / 2;

        this.canvas = parent.children("canvas")
            .attr("width", this.size)
            .attr("height", this.size);

        // Initial transformations of the canvas
        this.context = this.canvas[0].getContext("2d");
        this.context.translate(this.radius, this.radius);
        // Rotate -90 degrees to start at the top when drawing
        this.context.rotate((-90 * Math.PI) / 180);
    }

    /**
     * Draws the core
     */
    public drawCore(progress: number): void {
        // Clear the canvas
        this.context.clearRect(-this.radius, -this.radius, this.size, this.size);

        const draw: Function = (color: string, percent: number): void => {
            this.context.beginPath();
            // Arc from the top of the canvas to the current progress percent
            this.context.arc(0, 0, this.radius - 1, 0, Math.PI * 2 * percent);
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