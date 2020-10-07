class CoreAssignments {
    /** The number of unassigned cores */
    private static unassigned: number;
    /** The number of cores searching for files */
    private static searching: number;
    /** The number of cores scanning files */
    private static scanning: number;
    /** The number of cores purging vulnerabilities */
    private static purging: number;
    /** The number of cores siphoning data */
    private static siphoning: number;

    /**
     * Loads core assignment data from the state
     * 
     * This will also display the core assignment elements
     */
    public static initialize(): void {
        // Add the assignment element and display them
        const parent: any = $(".core-assignments").html(Views.get("cores/core-assignments"));
        Utils.showElements(".core-assignments");
        
        // Add the click events for the assignment buttons
        for (const assignment of parent.children()) {
            const type: number = Number.parseInt($(assignment).attr("type") || "1");
            const counter: any = $(assignment).children(".assignment-counter");

            counter.children(".add").on("click", (): void => CoreAssignments.changeAssignment(type, true));
            counter.children(".subtract").on("click", (): void => CoreAssignments.changeAssignment(type, false));
        }

        // Set the global variables
        CoreAssignments.unassigned = State.getValue("cores.assignments.unassigned") || CoreManager.getTotalCores();
        CoreAssignments.searching = State.getValue("cores.assignments.searching") || 0;
        CoreAssignments.scanning = State.getValue("cores.assignments.scanning") || 0;
        CoreAssignments.purging = State.getValue("cores.assignments.purging") || 0;
        CoreAssignments.siphoning = State.getValue("cores.assignments.siphoning") || 0;

        // Update the assignment UI
        CoreAssignments.updateAssignments();
    }

    /**
     * Changes an assignment value
     * @param type The type of assignment to change
     * @param increment If the value should increment or decrement
     */
    private static changeAssignment(type: number, increment: boolean): void {
        // Get the actual change amount
        const amount: number = increment ? 1 : -1;
        // Apply the opposite operation to the number of unassigned cores
        CoreAssignments.unassigned -= amount;

        // Add or subtract the appropriate designation
        switch (type) {
            case 0:
                CoreAssignments.searching += amount;
                break;
            case 1:
                CoreAssignments.scanning += amount;
                break;
            case 2:
                CoreAssignments.purging += amount;
                break;
            case 3:
                CoreAssignments.siphoning += amount;
                break;
        }

        // Update the assignment UI
        CoreAssignments.updateAssignments();
    }

    /**
     * Updates the assignment UI
     */
    private static updateAssignments(): void {
        const parent: any = $(".core-assignments");
        // Get the number of cores on each assignment
        const types: number[] = [CoreAssignments.searching, CoreAssignments.scanning, CoreAssignments.purging, CoreAssignments.siphoning];
        
        // Update each assignment's elements
        for (let index: number = 0; index < types.length; index++) {
            const counter: any = $(parent.children()[index]).children(".assignment-counter");
            counter.children(".assignment-count").text(types[index]);

            // Check if there are any unassigned cores
            counter.children(".add").prop("disabled", CoreAssignments.unassigned === 0);
            // Check if there are no more cores assigned to this task
            counter.children(".subtract").prop("disabled", types[index] === 0);
        }
    }
}