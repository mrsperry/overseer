"use strict";
class State {
    static load() {
        State.data = JSON.parse(localStorage.getItem("save") || "{}");
    }
    static save() {
        localStorage.setItem("save", JSON.stringify(State.data, null, 4));
    }
    static getValue(path) {
        const keys = path.split(".");
        let parent = State.data;
        for (const key of keys) {
            if (parent[key] === undefined) {
                return null;
            }
            parent = parent[key];
        }
        return parent;
    }
    static setValue(path, value) {
        State.set(State.data, path, value);
    }
    static set(parent, path, value) {
        if (path.includes(".")) {
            const keys = path.split(".");
            const key = keys.shift();
            if (parent[key] === undefined) {
                parent[key] = {};
            }
            State.set(parent[key], keys.join("."), value);
        }
        else {
            parent[path] = value;
        }
    }
}
class Stats {
    static async initialize() {
        Stats.data = State.getValue("stats") || await $.getJSON("src/data/stats.json");
    }
    static increment(namespace, id) {
        Stats.data[namespace][id]++;
    }
    static add(namespace, id, amount) {
        Stats.data[namespace][id] += amount;
    }
    static useHighest(namespace, id, value) {
        const current = Stats.data[namespace][id];
        if (current === undefined || current < value) {
            Stats.data[namespace][id] = value;
        }
    }
    static generateReport() {
        let result = "";
        for (const namespace in Stats.data) {
            result += "\n" + Utils.capitalize(namespace) + ":\n";
            for (const stat in Stats.data[namespace]) {
                result += Utils.formatID(stat) + ": " + Stats.data[namespace][stat] + "\n";
            }
        }
        return result;
    }
}
class Messenger {
    static initialize() {
        Messenger.messages = State.getValue("messages") || [];
        for (const message of Messenger.messages) {
            Messenger.write(message);
        }
    }
    static write(text) {
        if (text === Messenger.messages[Messenger.messages.length - 1]) {
            const previous = $("#messages").children("p")[0];
            if ($(previous).children("span").length === 0) {
                $("<span>")
                    .text(" x2")
                    .hide()
                    .fadeIn()
                    .appendTo(previous);
            }
            else {
                const child = $(previous).children("span")[0];
                const text = $(child).text();
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
        if (Messenger.messages.length > Messenger.maxMessages) {
            Messenger.messages.shift();
            $("#messages")
                .children("p:last-child")
                .remove();
        }
        this.applyOpacity();
    }
    static applyOpacity() {
        const children = $("#messages").children();
        for (let index = 0; index < children.length; index++) {
            $(children[index]).css("opacity", 1 - (index / Messenger.maxMessages));
        }
    }
}
Messenger.maxMessages = 15;
class CoreCanvas {
    constructor(parent) {
        const canvas = $("<canvas>")
            .attr("width", CoreCanvas.canvasSize)
            .attr("height", CoreCanvas.canvasSize)
            .appendTo(parent);
        this.context = canvas[0].getContext("2d");
        this.context.translate(CoreCanvas.canvasRadius, CoreCanvas.canvasRadius);
        this.context.rotate((-90 * Math.PI) / 180);
    }
    drawCore(progress) {
        this.context.clearRect(-CoreCanvas.canvasRadius, -CoreCanvas.canvasRadius, CoreCanvas.canvasSize, CoreCanvas.canvasSize);
        const draw = (color, percent) => {
            this.context.beginPath();
            this.context.arc(0, 0, CoreCanvas.canvasRadius - 1, 0, Math.PI * 2 * percent);
            this.context.strokeStyle = color;
            this.context.lineWidth = 2;
            this.context.stroke();
        };
        draw("#333333", 1);
        draw($("body").css("--clickable-text"), progress / 100);
    }
}
CoreCanvas.canvasSize = 50;
CoreCanvas.canvasRadius = CoreCanvas.canvasSize / 2;
class CoreTask {
    constructor(display, cost, type) {
        this.display = display;
        this.cost = cost;
        this.type = type;
        this.core = null;
        this.disk = null;
        this.handle = null;
        this.startTime = 0;
        this.isInfinite = false;
        this.isRunning = false;
        this.complete = null;
        this.cancel = null;
    }
    static create(display, cost, type) {
        return new CoreTask(display, cost, type);
    }
    static deserialize(state) {
        const core = CoreManager.getCore(state.core);
        const disk = DiskManager.getDisk(state.disk);
        let task;
        switch (state.type) {
            case 0:
                task = core.overclock();
                break;
            case 1:
                task = core.searchForFiles();
                break;
            case 2:
                task = disk.wipeDisk(false, core);
                break;
            default:
                task = disk.wipeDisk(true, core);
                break;
        }
        task.startTime = Date.now() - (state.saveTime - state.startTime);
    }
    updateCore() {
        const progress = (this.core.getPower() / (this.getCost() * 2)) * (Date.now() - this.startTime);
        this.core.getCanvas().drawCore(this.isInfinite ? 100 : progress);
        if (progress >= 100) {
            if (this.complete !== null) {
                this.complete();
            }
            if (this.isInfinite) {
                this.startTime = Date.now();
            }
            else {
                this.cleanup();
                Stats.increment("cores", "tasks-completed");
            }
        }
    }
    cleanup() {
        this.isRunning = false;
        if (this.handle !== null) {
            window.clearInterval(this.handle);
        }
        this.core.getCanvas().drawCore(0);
        this.core.setCoreTaskDisplay();
        this.core.updateButtons();
    }
    isBusy() {
        return this.isRunning;
    }
    getDisplay() {
        return this.display;
    }
    getCost() {
        return this.cost;
    }
    getIsInfinite() {
        return this.isInfinite;
    }
    setIsInfinite(isInfinite) {
        this.isInfinite = isInfinite;
        return this;
    }
    setCore(core) {
        this.core = core;
        return this;
    }
    setDisk(disk) {
        this.disk = disk;
        return this;
    }
    setOnComplete(onComplete) {
        this.complete = onComplete;
        return this;
    }
    setOnCancel(onCancel) {
        this.cancel = onCancel;
        return this;
    }
    onCancel() {
        if (this.isInfinite) {
            this.setIsInfinite(false);
        }
        if (this.cancel !== null) {
            this.cancel();
        }
        this.cleanup();
        Stats.increment("cores", "tasks-cancelled");
    }
    run(core) {
        if (CoreManager.startCoreTask(this, core)) {
            this.isRunning = true;
            this.handle = window.setInterval(() => this.updateCore(), 1);
            this.startTime = Date.now();
            this.core.setCoreTaskDisplay(this.display);
            this.core.updateButtons();
            return true;
        }
        return false;
    }
    serialize() {
        return {
            "core": this.core.getID(),
            "disk": this.disk.getID(),
            "type": this.type,
            "startTime": this.startTime,
            "saveTime": Date.now()
        };
    }
}
class Core {
    constructor(id, power) {
        this.id = id;
        this.power = power;
        this.task = null;
        this.upgrades = 0;
        const parent = $("<div>")
            .attr("id", "core-" + id)
            .addClass("core")
            .hide()
            .fadeIn()
            .appendTo("#cores");
        this.canvas = new CoreCanvas(parent);
        this.canvas.drawCore(0);
        this.info = $("<div>")
            .addClass("core-info")
            .appendTo(parent);
        $("<div>")
            .addClass("core-task")
            .appendTo(this.info);
        $("<span>")
            .text("Core #" + (id + 1))
            .appendTo(this.info);
        $("<span>")
            .addClass("core-power")
            .appendTo(this.info);
        $("<br>")
            .appendTo(this.info);
        $("<button>")
            .addClass("core-button overclock-button")
            .text("[+]")
            .click(() => this.overclock())
            .appendTo(this.info);
        $("<button>")
            .addClass("core-button cancel-button")
            .text("[x]")
            .click(() => this.cancelTask())
            .appendTo(this.info);
        $("<button>")
            .addClass("core-button search-button")
            .text("[search]")
            .click(() => this.searchForFiles())
            .appendTo(this.info);
        this.setCoreTaskDisplay();
        this.updatePower(power);
        this.updateButtons();
    }
    static deserialize(state) {
        let core;
        if (state.id !== 0) {
            core = CoreManager.addCore(state.power, false);
        }
        else {
            core = CoreManager.getCore(0);
        }
        core.upgrades = state.upgrades;
        if (state.task !== null) {
            CoreTask.deserialize(state.task);
        }
    }
    updatePower(power) {
        this.power = power;
        this.info.children(".core-power")
            .text(" @ " + power + "Mhz");
    }
    cancelTask() {
        this.task?.onCancel();
        this.setCoreTaskDisplay();
        this.updateButtons();
    }
    setCoreTaskDisplay(display = "") {
        const child = this.info.children(".core-task");
        if (display === "") {
            child.removeClass("clickable-no-click")
                .text("Core idle");
        }
        else {
            child.addClass("clickable-no-click")
                .text(display);
        }
    }
    updateButtons() {
        this.info.children(".cancel-button")
            .prop("disabled", !this.isBusy());
        this.info.children(".overclock-button")
            .prop("disabled", this.upgrades >= CoreManager.getMaxCoreUpgrades() || this.isBusy());
        this.info.children(".search-button")
            .prop("disabled", this.isBusy());
    }
    overclock() {
        const task = CoreTask.create("Overclocking core", this.power * 1000, CoreTaskType.Overclock);
        task.setOnComplete(() => {
            this.updatePower(this.power * 2);
            this.upgrades++;
            Stats.increment("cores", "times-overclocked");
        }).run(this);
        return task;
    }
    searchForFiles() {
        const task = CoreTask.create("Searching for files", Core.fileSearchCost, CoreTaskType.Search);
        task.setIsInfinite(true)
            .setOnComplete(() => DiskManager.addFileToDisk())
            .run(this);
        return task;
    }
    getID() {
        return this.id;
    }
    getCanvas() {
        return this.canvas;
    }
    getPower() {
        return this.power;
    }
    isBusy() {
        return this.task?.isBusy() || false;
    }
    setTask(task) {
        this.task = task;
    }
    serialize() {
        return {
            "id": this.id,
            "power": this.power,
            "upgrades": this.upgrades,
            "task": this.task?.isBusy() ? this.task.serialize() : null
        };
    }
}
Core.fileSearchCost = 20;
class CoreManager {
    static initialize() {
        CoreManager.coreList = State.getValue("cores.count") || [];
        CoreManager.maxCoreUpgrades = State.getValue("cores.max-upgrades") || 0;
        this.addCore(1);
    }
    static addCore(power, count = true) {
        const core = new Core(CoreManager.coreList.length, power);
        CoreManager.coreList.push(core);
        if (count) {
            Stats.increment("cores", "number-of-cores");
        }
        return core;
    }
    static startCoreTask(task, core) {
        if (core === undefined) {
            for (const currentCore of CoreManager.coreList) {
                if (!currentCore.isBusy()) {
                    currentCore.setTask(task.setCore(currentCore));
                    return true;
                }
            }
        }
        else {
            if (!core.isBusy()) {
                core.setTask(task.setCore(core));
                return true;
            }
        }
        return false;
    }
    static upgradeCoreSpeeds() {
        CoreManager.maxCoreUpgrades++;
        for (const core of CoreManager.coreList) {
            core.updateButtons();
        }
    }
    static getMaxCoreUpgrades() {
        return CoreManager.maxCoreUpgrades;
    }
    static getCore(id) {
        return CoreManager.coreList[id] || CoreManager.coreList[0];
    }
}
class Utils {
    static random(arg1, arg2) {
        if (arg1 === undefined) {
            return Utils.random(0, 2) === 0;
        }
        if (typeof (arg1) === "number" && arg2 !== undefined) {
            return Math.floor(Math.random() * (arg2 - arg1)) + arg1;
        }
        else if (Array.isArray(arg1)) {
            if (arg1.length == 0) {
                return null;
            }
            return arg1[Utils.random(0, arg1.length)];
        }
    }
    static shuffle(array) {
        const copy = array.slice(0);
        for (let index = copy.length - 1; index > 0; index--) {
            const holder = Math.floor(Math.random() * (index + 1));
            [copy[index], copy[holder]] = [copy[holder], copy[index]];
        }
        return copy;
    }
    static createUniqueList(data, amount, limit) {
        const result = [];
        let counter = 0;
        while (result.length < amount && counter < (limit || 100)) {
            const item = data[Utils.random(0, data.length)];
            if (!result.includes(item)) {
                result.push(item);
            }
            counter++;
        }
        return result;
    }
    static getAlphanumericString(length) {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
        let result = "";
        for (let index = 0; index < length; index++) {
            result += Utils.random(chars);
        }
        return result;
    }
    static capitalize(item) {
        return item.charAt(0).toUpperCase() + item.substring(1, item.length);
    }
    static formatID(id) {
        const words = id.split("-");
        words[0] = Utils.capitalize(words[0]);
        return words.join(" ");
    }
    static stringify(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}
class DiskManager {
    static async initialize() {
        DiskManager.disks = [];
        const diskNameData = await $.getJSON("src/data/disk-names.json");
        DiskManager.fileExtensions = diskNameData.extensions;
        DiskManager.diskNames = [];
        DiskManager.generateDiskNames(diskNameData, 3);
        DiskManager.diskSize = 100;
        DiskManager.threatLevel = 1;
        DiskManager.displayFiles(DiskManager.addDisk(false));
        DiskManager.addDisk(true);
    }
    static addDisk(isQuarantine, count = false) {
        const name = isQuarantine ? DiskManager.getQuarantineName() : DiskManager.getDiskName();
        const disk = new Disk(DiskManager.disks.length, name, DiskManager.diskSize, isQuarantine);
        DiskManager.disks.push(disk);
        if (count) {
            Stats.increment("disks", "number-of-" + (isQuarantine ? "quarantines" : "disks"));
        }
        return disk;
    }
    static addFileToDisk() {
        for (const disk of DiskManager.disks) {
            if (disk.isQuarantineStorage() || disk.isBusy()) {
                continue;
            }
            if (disk.addFile(this.threatLevel)) {
                Stats.increment("disks", "files-discovered");
                return;
            }
        }
    }
    static addFileToQuarantine(file) {
        for (const disk of DiskManager.disks) {
            if (!disk.isQuarantineStorage()) {
                continue;
            }
            if (disk.addFile(file)) {
                Stats.increment("disks", "threats-quarantined");
                return true;
            }
        }
        return false;
    }
    static displayFiles(disk) {
        if (disk.isDisplayed()) {
            return;
        }
        for (const disk of DiskManager.disks) {
            disk.setDisplayed(false);
        }
        $("#disk-view").children(".file").remove();
        disk.displayFiles();
    }
    static upgradeDiskStorage() {
        DiskManager.diskSize *= 4;
        for (const disk of DiskManager.disks) {
            disk.setSize(DiskManager.diskSize);
        }
    }
    static quarantineBreakout() {
        let lostFiles = 0;
        const quarantines = [];
        for (let index = 0; index < DiskManager.disks.length; index++) {
            const disk = DiskManager.disks[index];
            if (disk.isQuarantineStorage()) {
                quarantines.push(disk);
            }
        }
        const filesToLose = Utils.random(1, (DiskManager.threatLevel * 10) + 1);
        for (let index = 0; index < filesToLose; index++) {
            const disk = quarantines[Utils.random(0, quarantines.length)];
            if (disk.removeRandomFile()) {
                lostFiles++;
            }
        }
        return lostFiles;
    }
    static hasQuarantineFiles() {
        for (const disk of DiskManager.disks) {
            if (disk.isQuarantineStorage()) {
                if (disk.getFiles().length > 0) {
                    return true;
                }
            }
        }
        return false;
    }
    static addThreatLevel() {
        DiskManager.threatLevel++;
    }
    static getThreatLevel() {
        return DiskManager.threatLevel;
    }
    static getFileExtensions() {
        return DiskManager.fileExtensions;
    }
    static getDisk(id) {
        return DiskManager.disks[id] || DiskManager.disks[0];
    }
    static isQuarantineAvailable() {
        for (const disk of DiskManager.disks) {
            if (disk.isQuarantineStorage() && !disk.isBusy()) {
                return true;
            }
        }
        return false;
    }
    static generateDiskNames(data, count) {
        const systems = Utils.createUniqueList(data.systems, count);
        const users = Utils.createUniqueList(data.users, count);
        const directories = Utils.createUniqueList(data.directories, count * count);
        for (let index = 0; index < count; index++) {
            for (let dirCount = 0; dirCount < count; dirCount++) {
                DiskManager.diskNames.push("/" + systems[index] + "/" + users[index] + "/" + directories[(index * count) + dirCount]);
            }
        }
    }
    static getDiskName() {
        return DiskManager.diskNames.shift() || "Unavailable";
    }
    static getQuarantineName() {
        return "/quarantine/level-" + DiskManager.threatLevel;
    }
}
class Research {
    static async initialize() {
        Research.data = await $.getJSON("src/data/research.json");
        Research.purchased = State.getValue("research.purchased") || [];
        Research.addReliability(State.getValue("research.reliability") || 0);
    }
    static addReliability(amount) {
        Research.reliability += amount;
        $("#research").children(".reliability")
            .text("Reliability: " + Research.reliability.toFixed(2));
        Research.displayResearch();
        Stats.useHighest("research", "highest-reliability", this.reliability);
        Stats.useHighest("research", "highest-reliability-gained", amount);
    }
    static displayResearch() {
        for (let index = 1; index <= Research.data.length; index++) {
            const item = Research.data[index - 1];
            const disabled = Research.reliability < 1 + (index * Research.costExponent);
            const child = $("#research-" + index);
            if (child.length !== 0) {
                $(child).prop("disabled", disabled);
                continue;
            }
            if (Research.purchased.includes(index) || Research.reliability < 1 + (index * Research.displayExponent)) {
                continue;
            }
            if ($("#research").children("button").length === Research.maxDisplayed) {
                return;
            }
            const parent = $("<button>")
                .attr("id", "research-" + index)
                .addClass("bordered")
                .prop("disabled", disabled)
                .click(() => {
                Research.purchaseResearch(index, item.type);
                parent.prop("disabled", true)
                    .fadeOut(400, () => {
                    parent.remove();
                    Research.displayResearch();
                });
            })
                .hide()
                .delay(Research.displayDelay * index)
                .fadeIn()
                .appendTo("#research");
            $("<span>")
                .text(item.title)
                .appendTo(parent);
            $("<span>")
                .text("+" + Utils.formatID(item.type) + " (" + (1 + (index * Research.costExponent)) + ")")
                .appendTo(parent);
        }
    }
    static purchaseResearch(index, type) {
        Research.purchased.push(index);
        Stats.increment("research", "research-purchased");
        switch (type) {
            case "add-core":
                CoreManager.addCore(1);
                break;
            case "core-speeds":
                CoreManager.upgradeCoreSpeeds();
                break;
            case "add-disk":
                DiskManager.addDisk(false);
                break;
            case "disk-size":
                DiskManager.upgradeDiskStorage();
                break;
            case "threat-level":
                DiskManager.addThreatLevel();
                DiskManager.addDisk(true);
                break;
        }
    }
}
Research.maxDisplayed = 5;
Research.displayDelay = 50;
Research.reliability = 0;
Research.costExponent = 3.25;
Research.displayExponent = 2.75;
class Main {
    static initialize() {
        const menu = $("#main-menu")
            .fadeOut(400, async () => {
            menu.remove();
            $("#main-content")
                .fadeIn()
                .css("display", "grid");
            $("footer")
                .fadeIn()
                .css("display", "flex");
            State.load();
            await Stats.initialize();
            Messenger.initialize();
            CoreManager.initialize();
            DiskManager.initialize();
            await Research.initialize();
            HackTimer.initialize();
        });
    }
}
var CoreTaskType;
(function (CoreTaskType) {
    CoreTaskType[CoreTaskType["Overclock"] = 0] = "Overclock";
    CoreTaskType[CoreTaskType["Search"] = 1] = "Search";
    CoreTaskType[CoreTaskType["Scan"] = 2] = "Scan";
    CoreTaskType[CoreTaskType["Purge"] = 3] = "Purge";
})(CoreTaskType || (CoreTaskType = {}));
class Disk {
    constructor(id, name, maxStorage, isQuarantine) {
        this.id = id;
        this.name = name;
        this.maxStorage = maxStorage;
        this.isQuarantine = isQuarantine;
        this.files = [];
        this.displayed = false;
        this.displayedFiles = 0;
        this.isWiping = false;
        this.parent = $("<div>")
            .attr("id", "disk-" + id)
            .addClass("disk")
            .hide()
            .fadeIn()
            .appendTo(isQuarantine ? "#quarantines" : "#drives");
        $("<span>")
            .addClass("disk-name clickable")
            .text(name)
            .click(() => DiskManager.displayFiles(this))
            .appendTo(this.parent);
        $("<span>")
            .addClass("disk-usage")
            .appendTo(this.parent);
        this.updateUsage();
    }
    static deserialize(state) {
        let disk;
        if (state.id !== 0) {
            disk = DiskManager.addDisk(state.isQuarantine, false);
        }
        else {
            disk = DiskManager.getDisk(0);
        }
        disk.name = name;
        disk.files = state.files.map((file) => DiskFile.deserialize(file));
        disk.isWiping = state.isWiping;
        disk.setDisplayed(state.displayed);
        disk.setSize(state.maxStorage);
        if (state.isDisplayed) {
            disk.displayFiles();
        }
        return disk;
    }
    displayFiles() {
        for (let index = 0; index < this.files.length; index++) {
            if (this.displayedFiles === Disk.maxDisplayedFiles) {
                break;
            }
            this.displayFile(this.files[index], index * Disk.displayDelay);
        }
        this.updateFileDisplay(this.displayedFiles * Disk.displayDelay);
        this.setDisplayed(true);
    }
    displayFile(file, delay = 0) {
        const parent = $("<div>")
            .addClass("file")
            .hide()
            .delay(delay)
            .fadeIn()
            .appendTo($("#disk-view"));
        $("<span>")
            .text(file.getName())
            .appendTo(parent);
        $("<span>")
            .text(file.getSize() + "kb")
            .appendTo(parent);
        this.displayedFiles++;
    }
    addFile(arg1) {
        const file = typeof (arg1) === "number" ? new DiskFile(arg1) : arg1;
        if (this.maxStorage - this.getUsage() >= file.getSize()) {
            this.files.push(file);
            if (this.isDisplayed()) {
                if (this.displayedFiles !== Disk.maxDisplayedFiles) {
                    this.displayFile(file);
                }
                this.updateFileDisplay();
            }
            this.updateUsage();
            return true;
        }
        return false;
    }
    updateUsage() {
        this.parent.children(".disk-usage")
            .text(Math.floor((this.getUsage() / this.maxStorage) * 100) + "%");
    }
    updateFileDisplay(delay = 0) {
        const parent = $("#disk-view");
        const header = parent.children(".header")
            .removeClass("disabled clickable")
            .off("click");
        const subheader = parent.children(".subheader")
            .fadeIn();
        const size = subheader.children(".disk-size");
        if (this.files.length == 0) {
            header.text("No files to display");
            subheader.hide();
        }
        else {
            header.addClass(this.isWiping ? "disabled" : "clickable")
                .text((this.isQuarantine ? "Purge" : "Scan") + " files");
            size.text(Utils.stringify(this.getUsage()) + "kb/" + Utils.stringify(this.maxStorage) + "kb");
            if (!this.isWiping) {
                header.click(() => this.wipeDisk(this.isQuarantine));
            }
        }
        if (this.files.length > Disk.maxDisplayedFiles) {
            let extra = parent.children(".extra-files");
            if (extra.length === 0) {
                extra = $("<div>")
                    .addClass("file extra-files")
                    .hide()
                    .delay(delay)
                    .fadeIn()
                    .appendTo(parent);
            }
            extra.text("...and " + (this.files.length - Disk.maxDisplayedFiles) + " more");
        }
    }
    removeRandomFile() {
        if (this.files.length === 0) {
            return false;
        }
        this.files.splice(Utils.random(0, this.files.length), 1);
        if (this.displayed) {
            this.setDisplayed(false);
            DiskManager.displayFiles(this);
            this.updateUsage();
        }
        return true;
    }
    wipeDisk(operation, core) {
        const callback = () => operation ? this.purgeFiles() : this.scanFiles();
        const display = (operation ? "Purge" : "Scan") + ": " + this.name;
        const type = operation ? CoreTaskType.Purge : CoreTaskType.Scan;
        const task = CoreTask.create(display, this.getUsage(), type)
            .setOnComplete(() => {
            callback();
            this.files = [];
            this.displayedFiles = 0;
            if (this.displayed) {
                for (const child of $("#disk-view").children(".file")) {
                    $(child).fadeOut(400, () => {
                        $(child).remove();
                    });
                }
                this.updateFileDisplay();
            }
            this.updateUsage();
            this.isWiping = false;
        })
            .setOnCancel(() => {
            this.isWiping = false;
            if (this.displayed) {
                this.updateFileDisplay();
            }
        })
            .setDisk(this);
        if (type === CoreTaskType.Scan && !DiskManager.isQuarantineAvailable()) {
            Messenger.write("All quarantine drives are currently busy");
            return task;
        }
        if (task.run(core)) {
            this.isWiping = true;
            this.updateFileDisplay();
        }
        else {
            Messenger.write("No cores are currently available");
        }
        return task;
    }
    scanFiles() {
        const files = this.getFiles();
        const length = files.length;
        let threats = 0;
        for (let index = 0; index < length; index++) {
            const file = files[index];
            if (file.getIsThreat()) {
                threats++;
                DiskManager.addFileToQuarantine(file);
            }
        }
        Messenger.write("Scanned " + length + " files and found " + threats + " " + (threats === 1 ? "vulnerability" : "vulnerabilities"));
        Stats.add("disks", "files-scanned", length);
    }
    purgeFiles() {
        const files = this.getFiles();
        const length = files.length;
        let reliability = 0;
        for (const file of files) {
            reliability += file.getSize() / 100;
        }
        Research.addReliability(reliability);
        Messenger.write("Purged " + length + " file" + (length === 1 ? "" : "s") + " and gained " + reliability.toFixed(2) + " reliability");
        Stats.add("disks", "threats-purged", length);
    }
    isDisplayed() {
        return this.displayed;
    }
    setDisplayed(displayed) {
        this.displayed = displayed;
        const element = this.parent.children(".disk-name");
        if (displayed) {
            element.addClass("active");
        }
        else {
            element.removeClass("active");
            this.displayedFiles = 0;
        }
    }
    setSize(size) {
        this.maxStorage = size;
        this.updateUsage();
    }
    isQuarantineStorage() {
        return this.isQuarantine;
    }
    getUsage() {
        let usage = 0;
        for (const file of this.files) {
            usage += file.getSize();
        }
        return usage;
    }
    getFiles() {
        return this.files;
    }
    getID() {
        return this.id;
    }
    isBusy() {
        return this.isWiping;
    }
    serialize() {
        return {
            "id": this.id,
            "name": this.name,
            "files": this.files.map((file) => file.serialize()),
            "maxStorage": this.maxStorage,
            "isQuarantine": this.isQuarantine,
            "isDisplayed": this.displayed,
            "isWiping": this.isWiping
        };
    }
}
Disk.maxDisplayedFiles = 10;
Disk.displayDelay = 50;
class DiskFile {
    constructor(threatLevel) {
        this.threatLevel = threatLevel;
        const name = Utils.getAlphanumericString(Utils.random(DiskFile.minNameLength, DiskFile.maxNameLength));
        const extension = Utils.random(DiskManager.getFileExtensions());
        this.name = name + "." + extension;
        this.size = Utils.random(1, 20 + ((threatLevel - 1) * 100));
        this.isThreat = Utils.random(0, 1 + (threatLevel * 10)) == 0;
    }
    static deserialize(state) {
        const file = new DiskFile(0);
        file.name = state.name;
        file.size = state.size;
        file.isThreat = state.isThreat;
        return file;
    }
    getName() {
        return this.name;
    }
    getSize() {
        return this.size;
    }
    getIsThreat() {
        return this.isThreat;
    }
    getThreatLevel() {
        return this.threatLevel;
    }
    serialize() {
        return {
            "name": this.name,
            "size": this.size,
            "isThreat": this.isThreat
        };
    }
}
DiskFile.minNameLength = 7;
DiskFile.maxNameLength = 16;
class Modal {
    constructor(className = undefined) {
        const container = $("<div>")
            .addClass("modal-container")
            .hide()
            .fadeIn()
            .appendTo("body");
        $("<div>")
            .addClass("modal-bg")
            .appendTo(container);
        this.content = $("<div>")
            .addClass("modal-content " + (className === undefined ? "" : className) + "-content")
            .appendTo(container);
    }
    getContent() {
        return this.content;
    }
    remove(delay = 0) {
        const container = $(".modal-container")
            .delay(delay)
            .fadeOut(400, () => container.remove());
    }
}
class Settings {
    static show() {
        Settings.modal = new Modal("settings");
        const content = Settings.modal.getContent();
        $("<h1>")
            .text("Settings")
            .appendTo(content);
        const mainColor = $("<div>")
            .addClass("color-picker")
            .appendTo(content);
        $("<label>")
            .attr("for", "main-color")
            .text("Main color: ")
            .appendTo(mainColor);
        Settings.mainPicker = $("<input>")
            .attr("id", "main-color")
            .attr("type", "color")
            .attr("value", Settings.mainColor)
            .on("input change", (event) => Settings.updateColor(event.target.value, false))
            .appendTo(mainColor);
        $("<p>")
            .addClass("clickable-no-click")
            .text("Example text")
            .appendTo(mainColor);
        const accentColor = $("<div>")
            .addClass("color-picker")
            .appendTo(content);
        $("<label>")
            .attr("for", "accent-color")
            .text("Accent color: ")
            .appendTo(accentColor);
        Settings.accentPicker = $("<input>")
            .attr("id", "accent-color")
            .attr("type", "color")
            .attr("value", Settings.accentColor)
            .on("input change", (event) => Settings.updateColor(event.target.value, true))
            .appendTo(accentColor);
        $("<p>")
            .addClass("clickable-no-click active")
            .text("Example text")
            .appendTo(accentColor);
        $("<a>")
            .addClass("clickable")
            .text("Reset settings")
            .click(() => Settings.resetValues())
            .appendTo(content);
        const close = $("<button>")
            .addClass("bordered")
            .click(() => Settings.modal.remove())
            .appendTo(content);
        $("<span>")
            .text("Close")
            .appendTo(close);
    }
    static updateColor(value, hover) {
        $("body").get(0).style.setProperty("--clickable-text" + (hover ? "-hover" : ""), value);
        if (hover) {
            Settings.accentColor = value;
            Settings.accentPicker.get(0).value = value;
        }
        else {
            Settings.mainColor = value;
            Settings.mainPicker.get(0).value = value;
        }
    }
    static resetValues() {
        Settings.updateColor(Settings.reset.mainColor, false);
        Settings.updateColor(Settings.reset.accentColor, true);
    }
}
Settings.reset = {
    "mainColor": "#5CD670",
    "accentColor": "#ADEAB7"
};
Settings.mainColor = "#5CD670";
Settings.accentColor = "#ADEAB7";
class Hack {
    constructor(time) {
        this.time = time;
        this.handle = 0;
        this.locked = false;
        this.modal = new Modal("hack");
        this.content = this.modal.getContent();
        this.addPretextContent();
        HackTimer.stop();
        Stats.increment("hacks", "timed-hacked");
    }
    addPretextContent() {
        $("<h1>")
            .addClass("centered bold pretext-header")
            .text("Quarantine Breach Detected")
            .appendTo(this.content);
        $("<p>")
            .addClass("centered pretext")
            .text("Real time quarantine monitoring has picked up an unknown number of files executing cracking functions!")
            .appendTo(this.content);
        $("<p>")
            .addClass("centered pretext")
            .html("If left unchecked these files may damage the integrity of the quarantine drives and <span class='clickable-no-click active-error'>allow other threats to escape</span>.")
            .appendTo(this.content);
        $("<p>")
            .addClass("centered pretext")
            .html("There is a <span class='clickable-no-click active-error'>limited time span</span> where available containment functions will be effective...")
            .appendTo(this.content);
        $("<a>")
            .addClass("clickable")
            .text("Run counter-measures")
            .click(() => this.content.fadeOut(400, () => {
            this.content.empty().fadeIn();
            this.addContent();
            this.handle = window.setInterval(() => this.countdown(), 1000);
        }))
            .appendTo(this.content);
    }
    addContent() {
        const header = $("<h1>")
            .addClass("centered")
            .text("Time until quarantine breakout: ")
            .appendTo(this.content);
        $("<span>")
            .addClass("hack-countdown clickable-no-click bold")
            .text(this.time)
            .appendTo(header);
    }
    countdown() {
        this.content.children("h1")
            .children(".hack-countdown")
            .text(--this.time);
        if (this.time === 0) {
            this.fail();
        }
    }
    success() {
        this.removeInterface(true);
        Messenger.write("Quarantine lockdown successful; all files accounted for");
        Stats.increment("hacks", "completed-hacks");
    }
    fail() {
        this.removeInterface(false);
        Messenger.write("Quarantine lockdown failed; " + DiskManager.quarantineBreakout() + " files not found");
        Stats.increment("hacks", "failed-hacks");
    }
    removeInterface(success) {
        window.clearInterval(this.handle);
        this.locked = true;
        this.modal.remove(1500);
        this.content.addClass(success ? "success" : "fail");
        HackTimer.start();
    }
}
class Cryptogram extends Hack {
    constructor(level) {
        const data = Cryptogram.levels[level - 1];
        super(data.time);
        this.password = Utils.createUniqueList(Cryptogram.letters.split(""), data.characters).join("");
        this.progress = "";
    }
    addContent() {
        super.addContent();
        const header = $("<div>")
            .addClass("header centered")
            .text("Password cipher:")
            .appendTo(this.content);
        const letterContainer = $("<ul>")
            .appendTo(header);
        for (let index = 0; index < this.password.length; index++) {
            $("<li>")
                .attr("id", "cipher-" + index)
                .text("0x" + this.password.charCodeAt(index).toString(16))
                .appendTo(letterContainer);
        }
        $("<h1>")
            .attr("id", "password")
            .addClass("centered")
            .appendTo(this.content);
        const listContainer = $("<div>")
            .addClass("cryptogram")
            .appendTo(this.content);
        const letters = Cryptogram.letters;
        const listCount = 4;
        const letterCount = Math.ceil(letters.length / listCount);
        for (let lists = 0; lists < listCount; lists++) {
            const list = $("<ol>")
                .appendTo(listContainer);
            for (let index = 0; index < letterCount; index++) {
                const currentIndex = (lists * letterCount) + index;
                const letter = letters[currentIndex];
                const code = $("<li>")
                    .text(letter + ": 0x" + letters.charCodeAt(currentIndex).toString(16))
                    .click(() => {
                    if (this.locked) {
                        return;
                    }
                    code.addClass("clickable-no-click");
                    if (this.validateInput(letter.toUpperCase())) {
                        code.off("click");
                    }
                    else {
                        code.addClass("active-error");
                    }
                })
                    .appendTo(list);
                if (this.password.includes(letter)) {
                    code.addClass("password-letter");
                }
            }
        }
    }
    fail() {
        super.fail();
        for (const letter of $(".password-letter")) {
            if (!$(letter).hasClass("clickable-no-click")) {
                $(letter).addClass("clickable-no-click active-error");
            }
        }
        Stats.increment("hacks", "cryptograms-failed");
    }
    validateInput(letter) {
        this.progress += letter;
        if (this.password.charAt(this.progress.length - 1) !== letter) {
            this.fail();
            return false;
        }
        if (this.progress === this.password) {
            this.success();
            Stats.increment("hacks", "cryptograms-completed");
        }
        $("#cipher-" + (this.progress.length - 1))
            .addClass("clickable-no-click");
        $("#password")
            .text(this.progress);
        return true;
    }
}
Cryptogram.letters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
Cryptogram.levels = [
    {
        "time": 20,
        "characters": 5
    },
    {
        "time": 25,
        "characters": 7
    },
    {
        "time": 30,
        "characters": 10
    }
];
class HackTimer {
    static initialize() {
        HackTimer.start();
        window.setInterval(HackTimer.checkStatus, 60000);
    }
    static start() {
        HackTimer.startTime = Date.now();
        HackTimer.interval = Utils.random(HackTimer.minInterval, HackTimer.maxInterval + 1);
        HackTimer.isRunning = true;
    }
    static stop() {
        HackTimer.isRunning = false;
    }
    static checkStatus() {
        if (!HackTimer.isRunning || !DiskManager.hasQuarantineFiles()) {
            return;
        }
        if (Date.now() - HackTimer.startTime >= HackTimer.interval * 60000) {
            const threatLevel = DiskManager.getThreatLevel();
            switch (Utils.random(0, 4)) {
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
    }
}
HackTimer.minInterval = 3;
HackTimer.maxInterval = 15;
class HiddenPasswords extends Hack {
    constructor(level) {
        const data = HiddenPasswords.data.levels[level - 1];
        super(data.time);
        this.passwords = Utils.createUniqueList(HiddenPasswords.data.passwords, data.passwords);
        this.markedPasswords = 0;
        this.lines = data.lines;
        this.lineLength = HiddenPasswords.lineLength;
        this.passwordContainer = [];
    }
    addContent() {
        super.addContent();
        const parent = $("<section>")
            .addClass("hidden-passwords")
            .appendTo(this.content);
        const header = $("<div>")
            .text("Suspected passwords:")
            .addClass("header centered")
            .appendTo(parent);
        const passwordContainer = $("<ul>")
            .appendTo(header);
        let text = Utils.getAlphanumericString(this.lines * this.lineLength);
        for (let index = 0; index < text.length / this.lineLength; index++) {
            $("<p>")
                .addClass("text-line")
                .html(text.slice(index * this.lineLength, (index * this.lineLength) + this.lineLength))
                .appendTo(parent);
        }
        const takenLines = [];
        for (let index = 0; index < this.passwords.length; index++) {
            const password = this.passwords[index];
            $("<li>")
                .attr("id", "hidden-password-" + index)
                .text(password)
                .appendTo(passwordContainer);
            let line;
            do {
                line = Utils.random(0, this.lines);
            } while (takenLines.includes(line));
            takenLines.push(line);
            const element = $(parent.children(".text-line")[line]);
            const insertIndex = Utils.random(0, this.lineLength - password.length);
            const leftoverText = element.text().slice(insertIndex + password.length);
            element.text(element.text().slice(0, insertIndex));
            const passwordElement = $("<span>")
                .attr("password-index", index)
                .text(password)
                .click(() => {
                if (this.locked) {
                    return;
                }
                this.markPassword(passwordElement);
            })
                .appendTo(element);
            this.passwordContainer.push(passwordElement);
            $("<span>")
                .text(leftoverText)
                .appendTo(element);
        }
    }
    markPassword(element) {
        element.addClass("clickable-no-click")
            .off("click");
        const index = Number.parseInt(element.attr("password-index"));
        $("#hidden-password-" + index).addClass("clickable-no-click");
        if (++this.markedPasswords === this.passwords.length) {
            this.success();
            Stats.increment("hacks", "hidden-passwords-completed");
        }
    }
    fail() {
        super.fail();
        for (const password of this.passwordContainer) {
            if (!password.hasClass("clickable-no-click")) {
                password.addClass("clickable-no-click active-error");
                const index = Number.parseInt(password.attr("password-index"));
                $("#hidden-password-" + index).addClass("clickable-no-click active-error");
            }
        }
        Stats.increment("hacks", "hidden-passwords-failed");
    }
}
HiddenPasswords.lineLength = 55;
HiddenPasswords.data = {
    "levels": [
        {
            "time": 20,
            "passwords": 2,
            "lines": 7
        },
        {
            "time": 35,
            "passwords": 4,
            "lines": 13
        },
        {
            "time": 50,
            "passwords": 6,
            "lines": 20
        }
    ],
    "passwords": [
        "variable",
        "admin",
        "guest",
        "password",
        "codified",
        "quarantine",
        "anonymous",
        "linux",
        "compiler",
        "program",
        "testing",
        "default",
        "generic",
        "public",
        "global",
        "shared",
        "home",
        "root",
        "control",
        "system"
    ]
};
class NumberMultiples extends Hack {
    constructor(level) {
        const data = NumberMultiples.levels[level - 1];
        super(data.time);
        this.highestNumber = data["highest-number"];
        this.gridSize = data["grid-size"];
        this.numberOfMultipliers = data.multipliers;
        this.multipliers = [];
        this.multiples = [];
        this.numbers = [];
    }
    addContent() {
        super.addContent();
        const parent = $("<div>")
            .addClass("number-multiples")
            .appendTo(this.content);
        const header = $("<div>")
            .text("Suspected multipliers:")
            .addClass("header centered")
            .appendTo(parent);
        const multiplierContainer = $("<ul>")
            .appendTo(header);
        const table = $("<table>")
            .appendTo(parent);
        for (let x = 0; x < this.gridSize; x++) {
            const row = $("<tr>")
                .appendTo(table);
            for (let y = 0; y < this.gridSize; y++) {
                let number;
                do {
                    number = Utils.random(2, this.highestNumber + 1);
                } while (this.numbers.includes(number));
                this.numbers.push(number);
                const cell = $("<td>")
                    .addClass("clickable")
                    .text(number)
                    .click(() => {
                    if (this.locked) {
                        return;
                    }
                    cell.addClass(this.checkMultiple(number) ? "active" : "active-error")
                        .off("click");
                })
                    .appendTo(row);
            }
        }
        const multipliers = [];
        for (let multiplier = NumberMultiples.minMultiplier; multiplier < NumberMultiples.maxMultiplier + 1; multiplier++) {
            multipliers.push(multiplier);
        }
        const selected = [];
        while (this.multipliers.length !== this.numberOfMultipliers) {
            let x, y;
            do {
                x = Utils.random(0, this.gridSize);
                y = Utils.random(0, this.gridSize);
            } while (selected.includes([x, y]));
            selected.push([x, y]);
            for (let multiplierIndex = 0; multiplierIndex < multipliers.length; multiplierIndex++) {
                const multiplier = multipliers[Utils.random(0, multipliers.length)];
                if (!this.multipliers.includes(multiplier) && this.numbers[(x * this.gridSize) + y] % multiplier === 0) {
                    this.multipliers.push(multiplier);
                    $("<li>")
                        .text(multiplier)
                        .appendTo(multiplierContainer);
                    break;
                }
            }
        }
        for (const number of this.numbers) {
            for (const multiplier of this.multipliers) {
                if (number % multiplier === 0) {
                    this.multiples.push(number);
                    break;
                }
            }
        }
    }
    checkMultiple(number) {
        let isMultiple = false;
        for (const multiplier of this.multipliers) {
            if (number >= multiplier && number % multiplier === 0) {
                isMultiple = true;
                break;
            }
        }
        if (!isMultiple) {
            super.fail();
            Stats.increment("hacks", "number-multiplies-failed");
            return false;
        }
        else {
            this.multiples.splice(this.multiples.indexOf(number), 1);
            if (this.multiples.length === 0) {
                super.success();
                Stats.increment("hacks", "number-multiples-completed");
            }
            return true;
        }
    }
}
NumberMultiples.minMultiplier = 2;
NumberMultiples.maxMultiplier = 10;
NumberMultiples.levels = [
    {
        "time": 20,
        "highest-number": 20,
        "grid-size": 3,
        "multipliers": 2
    },
    {
        "time": 40,
        "highest-number": 30,
        "grid-size": 4,
        "multipliers": 3
    },
    {
        "time": 60,
        "highest-number": 40,
        "grid-size": 5,
        "multipliers": 5
    }
];
class OrderedNumbers extends Hack {
    constructor(level) {
        const data = OrderedNumbers.levels[level - 1];
        super(data.time);
        this.maxNumbers = data["max-numbers"];
        this.numberPerRow = data["numbers-per-row"];
        this.order = [];
    }
    addContent() {
        super.addContent();
        const parent = $("<table>")
            .addClass("ordered-numbers")
            .appendTo(this.content);
        let numbers = [];
        for (let index = 0; index < this.maxNumbers; index++) {
            numbers.push(index + 1);
        }
        numbers = Utils.shuffle(numbers);
        for (let rowIndex = 0; rowIndex < this.numberPerRow; rowIndex++) {
            const row = $("<tr>")
                .appendTo(parent);
            for (let index = 0; index < this.numberPerRow; index++) {
                const display = numbers[(rowIndex * this.numberPerRow) + index];
                const data = $("<td>")
                    .attr("data-index", display)
                    .addClass("clickable")
                    .text(display)
                    .click(() => {
                    if (this.locked) {
                        return;
                    }
                    const result = this.addNumber(Number.parseInt(data.attr("data-index")));
                    data.addClass(result ? "active" : "active-error")
                        .off("click");
                })
                    .appendTo(row);
            }
        }
    }
    addNumber(index) {
        if (index === (this.order.length + 1)) {
            this.order.push(index);
            if (this.order.length === this.maxNumbers) {
                super.success();
                Stats.increment("hacks", "ordered-numbers-completed");
            }
            return true;
        }
        else {
            super.fail();
            Stats.increment("hacks", "ordered-number-failed");
            return false;
        }
    }
}
OrderedNumbers.levels = [
    {
        "time": 20,
        "max-numbers": 9,
        "numbers-per-row": 3
    },
    {
        "time": 30,
        "max-numbers": 16,
        "numbers-per-row": 4
    },
    {
        "time": 40,
        "max-numbers": 25,
        "numbers-per-row": 5
    },
];
