class HackTimer {
    /** The min number of minutes before another hack can occur */
    private static minInterval: number = 3;
    /** The max number of minutes before another hack can occur */
    private static maxInterval: number = 15;

    /** The starting time to use when checking the current interval */
    private static startTime: number;
    /** How many minutes should pass before a new hack is created */
    private static interval: number;

    /** If the timer is currently running */
    private static isRunning: boolean;

    /**
     * Starts the hack timer
     */
    public static initialize(): void {
        HackTimer.start();

        // Run a check every minute
        window.setInterval(HackTimer.checkStatus, 60000);

        // Start a hack of the same type if one was saved
        const type: number = State.getValue("hack-type");
        if (type !== null && type !== -1) {
            HackTimer.createHack(type);
        }
    }

    /**
     * Gets a new interval and starts the timer
     */
    public static start(): void {
        HackTimer.startTime = Date.now();
        HackTimer.interval = Utils.random(HackTimer.minInterval, HackTimer.maxInterval + 1);

        HackTimer.isRunning = true;
    }

    /**
     * Stops the current timer
     */
    public static stop(): void {
        HackTimer.isRunning = false;
    }

    /**
     * Starts a new random hack with the current threat level
     * @param type The type of hack to create
     */
    public static createHack(type?: number): void {
        const threatLevel: number = DiskManager.getThreatLevel();

        // Get a random type if not specified
        if (type === undefined) {
            type = Utils.random(0, 4);
        }

        // Set the type of hack to the state
        State.setValue("hack-type", type);
        
        // Create a new hack
        switch (type) {
            case 0:
                new Cryptogram(threatLevel);
                break;
            case 1:
                new HiddenPasswords(threatLevel);
                break;
            case 2:
                new NumberMultiples(threatLevel);
                break;
            default:
                new OrderedNumbers(threatLevel);
                break;
        }
    }

    /**
     * Checks if a new hack should be created
     */
    private static checkStatus(): void {
        // Cancel creating a hack if the timer isn't running or there are no quarantine files
        if (!HackTimer.isRunning || !DiskManager.hasQuarantineFiles()) {
            return;
        }

        // Check if the elapsed minutes are greater or equal to the interval
        if (Date.now() - HackTimer.startTime >= HackTimer.interval * 60000) {
            HackTimer.createHack();
        }
    }
}