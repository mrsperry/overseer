class VerdictTimer {
    /** The min number of minutes before another verdict can occur */
    private static minInterval: number = 3;
    /** The max number of minutes before another verdict can occur */
    private static maxInterval: number = 15;

    /** The starting time to use when checking the current interval */
    private static startTime: number;
    /** How many minutes should pass before a new verdict is created */
    private static interval: number;

    /** If the timer is currently running */
    private static isRunning: boolean;

    /**
     * Starts the verdict timer
     */
    public static initialize(): void {
        VerdictTimer.start();

        // Run a check every minute
        window.setInterval(VerdictTimer.checkStatus, 60000);

        // Start a verdict of the same type if one was saved
        const type: number = State.getValue("verdict-type");
        if (type !== null && type !== -1) {
            VerdictTimer.createVerdict(type);
        }
    }

    /**
     * Gets a new interval and starts the timer
     */
    public static start(): void {
        VerdictTimer.startTime = Date.now();
        VerdictTimer.interval = Utils.random(VerdictTimer.minInterval, VerdictTimer.maxInterval + 1);

        VerdictTimer.isRunning = true;
    }

    /**
     * Stops the current timer
     */
    public static stop(): void {
        VerdictTimer.isRunning = false;
    }

    /**
     * Starts a new random verdict with the current number of channels
     * @param type The type of verdict to create
     */
    public static createVerdict(type?: number): void {
        // Get a random type if not specified
        if (type === undefined) {
            type = Utils.random(0, 1);
        }

        // Set the type of verdict to the state
        State.setValue("verdict-type", type);
        
        // Create a new verdict
        switch (type) {
            default:
                new SuspiciousFolder();
                break;
        }
    }

    /**
     * Checks if a new verdict should be created
     */
    private static checkStatus(): void {
        // Cancel creating a verdict if the timer isn't running
        if (!VerdictTimer.isRunning || State.getValue("paused")) {
            return;
        }

        // Check if the elapsed minutes are greater or equal to the interval
        if (Date.now() - VerdictTimer.startTime >= VerdictTimer.interval * 60000) {
            VerdictTimer.createVerdict();
        }
    }
}