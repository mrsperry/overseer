"use strict";
class State {
    static load() {
        State.data = JSON.parse(localStorage.getItem("save") || "{}");
    }
    static save() {
        Settings.save();
        Stats.save();
        if (State.playing) {
            Messenger.save();
            Research.save();
            CoreManager.save();
            DiskManager.save();
            ChannelManager.save();
        }
        localStorage.setItem("save", JSON.stringify(State.data, null, 4));
    }
    static reset() {
        $(window).off("beforeunload");
        State.save();
        localStorage.setItem("save", JSON.stringify({
            "settings": State.data.settings || {},
            "stats": State.data.stats || {}
        }, null, 4));
        window.location.reload();
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
    static togglePause() {
        if (State.getValue("paused")) {
            State.setValue("paused", false);
            State.setValue("unpause-time", Date.now());
        }
        else {
            State.setValue("paused", true);
            State.setValue("pause-time", Date.now());
        }
    }
    static gameStarted() {
        State.playing = true;
    }
}
State.playing = false;
class Messenger {
    static initialize() {
        for (const message of State.getValue("messages.history") || []) {
            for (let index = 0; index < message.amount; index++) {
                Messenger.write(message.message);
            }
        }
    }
    static write(text) {
        const previousMessage = Messenger.messages[Messenger.messages.length - 1];
        if (previousMessage !== undefined && text === previousMessage.message) {
            const previousElement = $("#messages").children("p")[0];
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
        if (Messenger.messages.length > Messenger.maxMessages) {
            Messenger.messages.shift();
            $("#messages")
                .children("p:last-child")
                .remove();
        }
        this.applyOpacity();
    }
    static save() {
        State.setValue("messages.history", Messenger.messages);
    }
    static applyOpacity() {
        const children = $("#messages").children();
        for (let index = 0; index < children.length; index++) {
            const child = $(children[index]);
            if (index !== 0) {
                child.stop();
            }
            child.css("opacity", 1 - (index / Messenger.maxMessages));
        }
    }
}
Messenger.messages = [];
Messenger.maxMessages = 15;
class Views {
    static async initialize() {
        const manifest = await $.get("src/views/manifest.txt");
        for (const fileName of manifest.split("\n")) {
            Views.data[fileName.trim()] = await $.get("src/views/" + fileName + ".html");
        }
    }
    static get(id) {
        return Views.data[id] || "Could not find view: " + id;
    }
}
Views.data = {};
class Verdict {
    constructor(id) {
        this.modal = new Modal("verdict");
        this.data = Verdict.verdicts[id];
        this.content = this.modal.getContent();
        this.addContent();
        this.registerEvents();
    }
    static async initialize() {
        Verdict.verdicts = await $.getJSON("src/data/verdicts.json");
    }
    addContent() {
        $("<h1>")
            .text(this.data.title)
            .appendTo(this.content);
        const paragraphs = $("<div>")
            .addClass("paragraph-holder")
            .appendTo(this.content);
        for (const paragraph of Utils.createStringList(this.data.description)) {
            $("<p>")
                .addClass("centered")
                .html(paragraph)
                .appendTo(paragraphs);
        }
        const options = $("<div>")
            .addClass("option-holder")
            .appendTo(this.content);
        for (const option of this.data.options) {
            const button = $("<button>")
                .addClass("bordered " + option.id)
                .appendTo(options);
            $("<span>")
                .text(Utils.formatID(option.id))
                .appendTo(button);
        }
    }
    async resolve(option, success) {
        return new Promise((resolve) => {
            this.content.fadeOut(400, () => {
                this.content.fadeIn();
                const paragraphHolder = this.content.children(".paragraph-holder")
                    .empty().fadeIn();
                const paragraphs = Utils.createStringList(this.data.options[option][success ? "success" : "fail"]);
                for (const paragraph of paragraphs) {
                    $("<p>")
                        .addClass("centered")
                        .html(paragraph)
                        .appendTo(paragraphHolder);
                }
                const optionHolder = this.content.children(".option-holder")
                    .empty().fadeIn();
                const close = $("<button>")
                    .addClass("bordered")
                    .one("click", () => this.modal.remove())
                    .appendTo(optionHolder);
                $("<span>")
                    .text("Continue")
                    .appendTo(close);
                resolve();
            });
        });
    }
    static getVerdict(id) {
        return Verdict.verdicts[id];
    }
}
class CoreCanvas {
    constructor(parent) {
        const canvas = parent.children("canvas")
            .attr("width", CoreCanvas.canvasSize)
            .attr("height", CoreCanvas.canvasSize);
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
        this.channel = null;
        this.handle = null;
        this.startTime = 0;
        this.isInfinite = false;
        this.isRunning = false;
        this.isPaused = false;
        this.complete = null;
        this.cancel = null;
    }
    static create(display, cost, type) {
        return new CoreTask(display, cost, type);
    }
    static deserialize(state) {
        const core = CoreManager.getCore(state.core);
        let task;
        switch (state.type) {
            case 0:
                task = core.overclock();
                break;
            case 1:
                task = core.searchForFiles();
                break;
            case 2:
                task = DiskManager.getDisk(state.disk).wipeDisk(false, core);
                break;
            case 3:
                task = DiskManager.getDisk(state.disk).wipeDisk(true, core);
                break;
            case 4:
                task = ChannelManager.getChannel(state.channel).createChannelAction(false);
                break;
            default:
                task = ChannelManager.getChannel(state.channel).createChannelAction(true);
                break;
        }
        task.startTime = Date.now() - (state.saveTime - state.startTime);
    }
    updateCore() {
        if (State.getValue("paused")) {
            this.isPaused = true;
            const progress = (this.core.getPower() / (this.getCost() * 2)) * (State.getValue("pause-time") - this.startTime);
            this.core.getCanvas().drawCore(this.isInfinite ? 100 : progress);
            return;
        }
        else if (this.isPaused) {
            this.isPaused = false;
            this.startTime -= State.getValue("pause-time") - State.getValue("unpause-time");
        }
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
        else {
            Messenger.write("No cores are currently available");
        }
        return false;
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
    setChannel(channel) {
        this.channel = channel;
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
    serialize() {
        return {
            "core": this.core.getID(),
            "disk": this.disk?.getID() || 0,
            "channel": this.channel?.getID() || 0,
            "type": this.type,
            "startTime": this.startTime,
            "saveTime": Date.now()
        };
    }
}
class Core {
    constructor(id) {
        this.id = id;
        this.task = null;
        this.power = 1;
        this.upgrades = 0;
        const parent = $("<div>")
            .attr("id", "core-" + id)
            .addClass("core")
            .html(Views.get("core"))
            .hide()
            .fadeIn()
            .appendTo("#cores");
        this.canvas = new CoreCanvas(parent);
        this.canvas.drawCore(0);
        this.info = parent.children(".core-info");
        this.info.children(".core-name").text("Core #" + (id + 1));
        this.info.children(".overclock-button").on("click", () => this.overclock());
        this.info.children(".cancel-button").on("click", () => this.cancelTask());
        this.info.children(".search-button").on("click", () => this.searchForFiles());
        this.setCoreTaskDisplay();
        this.updatePower();
        this.updateButtons();
    }
    static deserialize(state) {
        const core = CoreManager.addCore(false);
        core.setUpgrades(state.upgrades);
        if (state.task !== null) {
            CoreTask.deserialize(state.task);
        }
    }
    updatePower() {
        let power = 1;
        for (let index = 0; index < this.upgrades; index++) {
            power *= 2;
        }
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
            .prop("disabled", this.upgrades === CoreManager.getMaxCoreUpgrades() || this.isBusy());
        this.info.children(".search-button")
            .prop("disabled", this.isBusy());
    }
    overclock() {
        const task = CoreTask.create("Overclocking core", this.power * 1000, CoreTaskType.Overclock);
        task.setOnComplete(() => {
            this.upgrades++;
            this.updatePower();
            Stats.increment("cores", "times-overclocked");
        }).run(this);
        return task;
    }
    searchForFiles() {
        const task = CoreTask.create("Searching for files", Core.fileSearchCost, CoreTaskType.Search);
        task.setIsInfinite(true)
            .setOnComplete(() => {
            if (!DiskManager.addFileToDisk() && Settings.isSettingEnabled("stop-searching-automatically")) {
                this.cancelTask();
            }
        })
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
    setUpgrades(upgrades) {
        this.upgrades = upgrades;
        this.updatePower();
        this.updateButtons();
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
        CoreManager.maxCoreUpgrades = State.getValue("cores.max-core-upgrades") || 0;
        CoreManager.coreList = [];
        for (const core of State.getValue("cores.list") || []) {
            Core.deserialize(core);
        }
        if (CoreManager.coreList.length === 0) {
            CoreManager.addCore(false);
        }
    }
    static save() {
        const data = {
            "list": [],
            "max-core-upgrades": CoreManager.maxCoreUpgrades
        };
        for (const core of CoreManager.coreList) {
            data.list.push(core.serialize());
        }
        State.setValue("cores", data);
    }
    static addCore(count = true) {
        const core = new Core(CoreManager.coreList.length);
        core.setUpgrades(CoreManager.maxCoreUpgrades);
        CoreManager.coreList.push(core);
        if (count) {
            Stats.increment("cores", "cores-obtained");
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
    static createStringList(items) {
        if (Array.isArray(items)) {
            return items;
        }
        else {
            return [items];
        }
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
    static addCommas(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    static addPostfix(number) {
        if (number < 1000) {
            return number + "kb";
        }
        else {
            return +(number / 1000).toFixed(1) + "mb";
        }
    }
    static hexToHue(hex) {
        let red = "0x" + hex[1] + hex[2];
        let green = "0x" + hex[3] + hex[4];
        let blue = "0x" + hex[5] + hex[6];
        red /= 255;
        green /= 255;
        blue /= 255;
        const max = Math.max(red, green, blue);
        const min = Math.min(red, green, blue);
        let hue = 0;
        let difference = max - min;
        switch (max) {
            case red:
                hue = (green - blue) / difference + (green < blue ? 6 : 0);
                break;
            case green:
                hue = (blue - red) / difference + 2;
                break;
            case blue:
                hue = (red - green) / difference + 4;
                break;
        }
        return hue / 6 * 100 * 3.6;
    }
}
class DiskManager {
    static async initialize() {
        const diskNameData = await $.getJSON("src/data/disk-names.json");
        DiskManager.fileExtensions = diskNameData.extensions;
        DiskManager.diskNames = State.getValue("disks.disk-names") || [];
        if (DiskManager.diskNames.length === 0) {
            DiskManager.generateDiskNames(diskNameData, 3);
        }
        DiskManager.diskSize = State.getValue("disks.disk-size") || 100;
        DiskManager.threatLevel = State.getValue("disks.threat-level") || 1;
        DiskManager.disks = [];
        for (const disk of State.getValue("disks.list") || []) {
            Disk.deserialize(disk);
        }
        if (DiskManager.disks.length === 0) {
            DiskManager.displayFiles(DiskManager.addDisk(false, false));
            DiskManager.addDisk(true, false);
        }
    }
    static save() {
        const data = {
            "list": [],
            "disk-names": DiskManager.diskNames,
            "disk-size": DiskManager.diskSize,
            "threat-level": DiskManager.threatLevel
        };
        for (const disk of DiskManager.disks) {
            data.list.push(disk.serialize());
        }
        State.setValue("disks", data);
    }
    static addDisk(isQuarantine, count = false, name) {
        if (name === undefined) {
            name = isQuarantine ? DiskManager.getQuarantineName() : DiskManager.getDiskName();
        }
        const disk = new Disk(DiskManager.disks.length, name, DiskManager.diskSize, isQuarantine);
        DiskManager.disks.push(disk);
        if (count) {
            Stats.increment("disks", (isQuarantine ? "quarantines" : "disks") + "-obtained");
        }
        return disk;
    }
    static addFileToDisk() {
        for (const disk of DiskManager.disks) {
            if (disk.isQuarantineStorage() || disk.isBusy()) {
                continue;
            }
            if (disk.addFile(Utils.random(1, this.threatLevel + 1))) {
                Stats.increment("disks", "files-discovered");
                return true;
            }
        }
        return false;
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
        if (DiskManager.threatLevel === 1) {
            Progression.trigger("channel-unlock");
        }
        DiskManager.threatLevel++;
        Research.incrementExponent(DiskManager.threatLevel);
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
        return "/quarantine/zone-" + DiskManager.threatLevel;
    }
}
class Settings {
    static initialize() {
        Settings.mainColor = State.getValue("settings.main-color") || Settings.reset.mainColor;
        Settings.setColorVariable("clickable-text", Settings.mainColor);
        Settings.accentColor = State.getValue("settings.accent-color") || Settings.reset.accentColor;
        Settings.setColorVariable("clickable-text-hover", Settings.accentColor);
        Settings.toggles = State.getValue("settings.toggles") || Settings.reset.toggles;
    }
    static show() {
        Settings.modal = new Modal("settings");
        const content = Settings.modal.getContent()
            .html(Views.get("menus/settings"));
        Settings.mainPicker = $("#main-color")
            .attr("value", Settings.mainColor)
            .on("input change", (event) => Settings.updateColor(event.target.value, false));
        Settings.accentPicker = $("#accent-color")
            .attr("value", Settings.accentColor)
            .on("input change", (event) => Settings.updateColor(event.target.value, true));
        for (const id in Settings.toggles) {
            const element = $("#" + id);
            const enable = $(element).children("button:first-child");
            enable.on("click", () => Settings.toggleSetting(id, true));
            const disable = $(element).children("button:last-child");
            disable.on("click", () => Settings.toggleSetting(id, false));
            Settings.toggleSetting(id, Settings.toggles[id] || false);
        }
        $("#reset-settings").on("click", () => Settings.resetValues());
        $("#restart-game").on("click", () => State.reset());
        content.children("button")
            .one("click", () => Settings.modal.remove());
    }
    static save() {
        State.setValue("settings.main-color", Settings.mainColor);
        State.setValue("settings.accent-color", Settings.accentColor);
        State.setValue("settings.toggles", Settings.toggles);
    }
    static isSettingEnabled(setting) {
        return Settings.toggles[setting] || false;
    }
    static updateColor(value, hover) {
        Settings.setColorVariable("clickable-text" + (hover ? "-hover" : ""), value);
        if (hover) {
            Settings.accentColor = value;
            Settings.accentPicker.get(0).value = value;
        }
        else {
            Settings.mainColor = value;
            Settings.mainPicker.get(0).value = value;
        }
    }
    static setColorVariable(name, value) {
        $("body").get(0).style.setProperty("--" + name, value);
        if (name === "clickable-text") {
            $("#main-menu-image").css("filter", "hue-rotate(" + (Utils.hexToHue(value) - Settings.originalHue) + "deg)");
            try {
                DataCore.resetData(ChannelManager.getDisplayedChannel().getProgress());
            }
            catch (exception) { }
        }
    }
    static toggleSetting(id, enabled) {
        const parent = $("#" + id);
        const enable = parent.children("button:first-child");
        const disable = parent.children("button:last-child");
        if (enabled) {
            enable.addClass("active");
            disable.removeClass("active");
        }
        else {
            enable.removeClass("active");
            disable.addClass("active");
        }
        Settings.toggles[id] = enabled;
    }
    static resetValues() {
        Settings.updateColor(Settings.reset.mainColor, false);
        Settings.updateColor(Settings.reset.accentColor, true);
    }
}
Settings.reset = {
    "mainColor": "#5CD670",
    "accentColor": "#ADEAB7",
    "toggles": {
        "stop-searching-automatically": false,
        "poor-eyesight-features": false
    }
};
Settings.originalHue = Utils.hexToHue(Settings.reset.mainColor);
class Stats {
    static async initialize() {
        Stats.data = State.getValue("stats") || await $.getJSON("src/data/stats.json");
    }
    static save() {
        State.setValue("stats", Stats.data);
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
        const modal = new Modal("stats");
        const content = modal.getContent();
        $("<h1>")
            .text("Statistics")
            .appendTo(content);
        const lists = $("<ul>").appendTo(content);
        for (const namespace in Stats.data) {
            const list = $("<ul>").appendTo(lists);
            $("<h2>")
                .text(Utils.capitalize(namespace))
                .appendTo(list);
            for (const stat in Stats.data[namespace]) {
                const amount = Stats.data[namespace][stat];
                const whole = Math.floor(amount);
                let result = Utils.addCommas(whole);
                if (amount % 1 !== 0) {
                    result += (amount - whole).toFixed(2).substring(1, 4);
                }
                $("<li>")
                    .text(Utils.formatID(stat) + ": " + result)
                    .appendTo(list);
            }
        }
        const close = $("<button>")
            .addClass("bordered")
            .one("click", () => modal.remove())
            .appendTo(content);
        $("<span>")
            .text("Close")
            .appendTo(close);
    }
}
class Research {
    static async initialize() {
        Research.data = await $.getJSON("src/data/research.json");
        Research.purchased = State.getValue("research.purchased") || [];
        Research.addReliability(State.getValue("research.reliability") || 0, false);
    }
    static save() {
        State.setValue("research.purchased", Research.purchased);
        State.setValue("research.reliability", Research.reliability);
    }
    static addReliability(amount, count = true) {
        Research.reliability += amount;
        $("#research").children(".reliability")
            .text("Reliability: " + Research.reliability.toFixed(2));
        Research.displayResearch();
        Stats.useHighest("research", "highest-reliability", this.reliability);
        if (count) {
            Stats.useHighest("research", "highest-reliability-gain", amount);
        }
    }
    static displayResearch() {
        for (let index = 0; index < Research.data.length; index++) {
            const option = Research.data[index];
            const isChoice = Array.isArray(option);
            const base = index + 1;
            let cost = Research.baseCost * (base === 1 ? 1 : (base - 1) * Research.costExponent);
            let fraction = cost - Math.floor(cost);
            fraction -= fraction % 0.25;
            cost = Math.floor(cost) + fraction;
            const disabled = Research.reliability < cost;
            const element = $("#research-" + index);
            if (element.length !== 0) {
                if (isChoice) {
                    for (const child of element.children("button")) {
                        $(child).prop("disabled", disabled);
                    }
                    continue;
                }
                else {
                    element.prop("disabled", disabled);
                    continue;
                }
            }
            if (Research.purchased.includes(index)) {
                continue;
            }
            if (Research.reliability < Research.baseDisplay * (base === 1 ? 1 : (base - 1) * Research.costExponent)) {
                continue;
            }
            const threatLevel = DiskManager.getThreatLevel();
            if (isChoice) {
                if ((threatLevel < option[0].level)) {
                    continue;
                }
            }
            else if (threatLevel < option.level) {
                continue;
            }
            if ($("#research").children().length === Research.maxDisplayed + 1) {
                return;
            }
            const createButton = (data, showCost) => {
                const button = $("<button>")
                    .addClass("bordered")
                    .prop("disabled", disabled);
                $("<span>")
                    .text(data.title)
                    .appendTo(button);
                $("<span>")
                    .text("+" + Utils.formatID(data.type) + (showCost ? " (" + cost + ")" : ""))
                    .appendTo(button);
                return button;
            };
            let parent;
            if (isChoice) {
                parent = $("<div>").addClass("option-choice");
                const button1 = createButton(option[0], false)
                    .appendTo(parent);
                $("<span>")
                    .addClass("pointer")
                    .text("<")
                    .appendTo(parent);
                $("<span>")
                    .text(cost)
                    .appendTo(parent);
                $("<span>")
                    .addClass("pointer")
                    .text(">")
                    .appendTo(parent);
                const button2 = createButton(option[1], false).appendTo(parent);
                const purchase = (type) => {
                    Research.purchaseResearch(index, type);
                    parent.fadeOut(400, () => {
                        parent.remove();
                        Research.displayResearch();
                    });
                };
                button1.one("click", () => purchase(option[0].type));
                button2.one("click", () => purchase(option[1].type));
            }
            else {
                parent = createButton(option, true)
                    .one("click", () => {
                    parent.fadeOut(400, () => {
                        parent.remove();
                        Research.displayResearch();
                    });
                    Research.purchaseResearch(index, option.type);
                });
            }
            parent.hide()
                .attr("id", "research-" + index)
                .delay(Research.displayDelay * (index + 1))
                .fadeIn()
                .appendTo("#research");
        }
    }
    static purchaseResearch(index, type) {
        Research.purchased.push(index);
        Stats.increment("research", "research-purchased");
        switch (type) {
            case "add-core":
                CoreManager.addCore();
                Messenger.write("New core online; auxillary <span class='clickable-no-click'>task processing</span> is available");
                break;
            case "core-speeds":
                CoreManager.upgradeCoreSpeeds();
                Messenger.write("Primary cores cleared for additional <span class='clickable-no-click'>overclocking</span> and recycling");
                break;
            case "add-disk":
                DiskManager.addDisk(false);
                Messenger.write("Additional <span class='clickable-no-click'>disk drive</span> mounted and initialized");
                break;
            case "disk-size":
                DiskManager.upgradeDiskStorage();
                Messenger.write("Disk drive <span class='clickable-no-click'>storage</span> has been greatly expanded");
                break;
            case "threat-level":
                DiskManager.addThreatLevel();
                DiskManager.addDisk(true);
                Messenger.write("Disk fabrication and <span class='clickable-no-click'>quarantine zone</span> conversion complete");
                break;
        }
    }
    static incrementExponent(amount) {
        Research.costExponent += 0.09 * amount;
        Research.baseDisplay += 0.1;
    }
}
Research.maxDisplayed = 5;
Research.displayDelay = 50;
Research.baseCost = 0.75;
Research.baseDisplay = 0.5;
Research.costExponent = 2.35;
Research.reliability = 0;
class Main {
    static async initialize() {
        State.load();
        Settings.initialize();
        await Stats.initialize();
        await Views.initialize();
        await Verdict.initialize();
        $(window).on("beforeunload", () => State.save());
    }
    static startGame() {
        const menu = $("#main-menu")
            .fadeOut(400, async () => {
            menu.remove();
            $("#main-content")
                .fadeIn()
                .css("display", "grid");
            $("footer")
                .fadeIn()
                .css("display", "flex");
            State.gameStarted();
            Messenger.initialize();
            await DiskManager.initialize();
            DataCore.initialize();
            ChannelManager.initialize();
            CoreManager.initialize();
            if (State.getValue("paused")) {
                State.togglePause();
            }
            await Research.initialize();
            HackTimer.initialize();
            ChannelDetection.initialize();
        });
    }
}
(() => Main.initialize())();
var CoreTaskType;
(function (CoreTaskType) {
    CoreTaskType[CoreTaskType["Overclock"] = 0] = "Overclock";
    CoreTaskType[CoreTaskType["Search"] = 1] = "Search";
    CoreTaskType[CoreTaskType["Scan"] = 2] = "Scan";
    CoreTaskType[CoreTaskType["Purge"] = 3] = "Purge";
    CoreTaskType[CoreTaskType["Crack"] = 4] = "Crack";
    CoreTaskType[CoreTaskType["Siphon"] = 5] = "Siphon";
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
            .html(Views.get("disk"))
            .hide()
            .fadeIn()
            .appendTo(isQuarantine ? "#quarantines" : "#drives");
        this.parent.children(".disk-name")
            .text(name)
            .on("click", () => DiskManager.displayFiles(this));
        this.parent.children(".disk-info")
            .children("button")
            .text("[" + (isQuarantine ? "x" : "+") + "]");
        this.updateInfo();
    }
    static deserialize(state) {
        const disk = DiskManager.addDisk(state.isQuarantine, false, state.name);
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
            .text(Utils.addPostfix(file.getSize()))
            .appendTo(parent);
        this.displayedFiles++;
    }
    addFile(arg1) {
        const usage = this.getUsage();
        if (usage === this.maxStorage) {
            return false;
        }
        const file = typeof (arg1) === "number" ? new DiskFile(arg1) : arg1;
        if (this.maxStorage - usage < file.getSize()) {
            file.setSize(this.maxStorage - usage);
        }
        this.files.push(file);
        if (this.isDisplayed()) {
            if (this.displayedFiles !== Disk.maxDisplayedFiles) {
                this.displayFile(file);
            }
            this.updateFileDisplay();
        }
        this.updateInfo();
        return true;
    }
    updateInfo() {
        const info = this.parent.children(".disk-info");
        const disabled = this.isWiping || this.getUsage() === 0;
        const button = info.children("button")
            .prop("disabled", disabled)
            .off("click");
        if (!disabled) {
            button.on("click", () => this.wipeDisk(this.isQuarantine));
        }
        info.children(".disk-usage")
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
            size.text(Utils.addPostfix(this.getUsage()) + "/" + Utils.addPostfix(this.maxStorage));
            if (!this.isWiping) {
                header.on("click", () => this.wipeDisk(this.isQuarantine));
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
        }
        this.updateInfo();
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
            this.updateInfo();
            this.isWiping = false;
        })
            .setOnCancel(() => {
            this.isWiping = false;
            if (this.displayed) {
                this.updateFileDisplay();
            }
            this.updateInfo();
        })
            .setDisk(this);
        if (type === CoreTaskType.Scan && !DiskManager.isQuarantineAvailable()) {
            Messenger.write("All quarantine drives are currently busy");
            return task;
        }
        if (task.run(core)) {
            this.isWiping = true;
            if (this.displayed) {
                this.updateFileDisplay();
            }
            this.updateInfo();
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
        Messenger.write("Scanned <span class='clickable-no-click'>" + length + "</span> files and found <span class='clickable-no-click active-error'>" + threats + "</span> vulnerabilit" + (threats === 1 ? "y" : "ies"));
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
        Messenger.write("Purged <span class='clickable-no-click'>" + length + "</span> file" + (length === 1 ? "" : "s") + " and gained <span class='clickable-no-click'>" + reliability.toFixed(2) + "</span> reliability");
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
        this.updateInfo();
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
        this.isThreat = Utils.random(0, 1 + (threatLevel * 5)) == 0;
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
    setSize(size) {
        this.size = size;
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
        State.togglePause();
        const container = $("<div>")
            .addClass("modal-container")
            .html(Views.get("modal"))
            .hide()
            .fadeIn()
            .appendTo("body");
        this.content = container.children(".modal-content");
        if (className !== undefined) {
            this.content.addClass(className + "-content");
        }
    }
    getContent() {
        return this.content;
    }
    remove(delay = 0) {
        State.togglePause();
        const container = $(".modal-container")
            .delay(delay)
            .fadeOut(400, () => container.remove());
    }
}
class Progression {
    static trigger(id) {
        if (State.getValue("progression." + id)) {
            return;
        }
        const modal = new Modal();
        const content = modal.getContent().html(Views.get("progression/" + id));
        const button = $("<button>")
            .addClass("bordered")
            .one("click", () => modal.remove())
            .appendTo(content);
        $("<span>")
            .text("Continue")
            .appendTo(button);
        State.setValue("progression." + id, true);
    }
}
class Hack {
    constructor(time) {
        this.time = time;
        this.handle = 0;
        this.locked = false;
        this.modal = new Modal("hack");
        this.content = this.modal.getContent()
            .html(Views.get("hacks/pretext"));
        this.content.children("a").one("click", () => this.content.fadeOut(400, () => {
            this.content.empty().fadeIn();
            this.handle = window.setInterval(() => this.countdown(), 1000);
            this.addContent();
        }));
        HackTimer.stop();
        Stats.increment("hacks", "times-hacked");
    }
    addContent() {
        this.content.html(Views.get("hacks/base"));
        this.content.children("h1")
            .children(".hack-countdown")
            .text(this.time);
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
        Messenger.write("Quarantine lockdown <span class='clickable-no-click'>successful</span>; all files accounted for");
        Stats.increment("hacks", "hacks-solved");
    }
    fail() {
        this.removeInterface(false);
        const filesLost = DiskManager.quarantineBreakout();
        Messenger.write("Quarantine lockdown <span class='clickable-no-click active-error'>failed</span>; <span class='clickable-no-click active-error'>" + filesLost + "</span> file" + (filesLost === 1 ? "" : "s") + " not found");
        Stats.increment("hacks", "hacks-failed");
    }
    removeInterface(success) {
        window.clearInterval(this.handle);
        State.setValue("hack-type", -1);
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
                    .on("click", () => {
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
            Stats.increment("hacks", "cryptograms-solved");
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
        "time": 25,
        "characters": 5
    },
    {
        "time": 30,
        "characters": 7
    },
    {
        "time": 35,
        "characters": 10
    }
];
class HackTimer {
    static initialize() {
        HackTimer.start();
        window.setInterval(HackTimer.checkStatus, 60000);
        const type = State.getValue("hack-type");
        if (type !== null && type !== -1) {
            HackTimer.createHack(type);
        }
    }
    static start() {
        HackTimer.startTime = Date.now();
        HackTimer.interval = Utils.random(HackTimer.minInterval, HackTimer.maxInterval + 1);
        HackTimer.isRunning = true;
    }
    static stop() {
        HackTimer.isRunning = false;
    }
    static createHack(type) {
        const channels = ChannelManager.getAllChannels().length;
        if (type === undefined) {
            type = Utils.random(0, 4);
        }
        State.setValue("hack-type", type);
        switch (type) {
            case 0:
                new Cryptogram(channels);
                break;
            case 1:
                if (Settings.isSettingEnabled("poor-eyesight-features")) {
                    HackTimer.createHack();
                }
                else {
                    new HiddenPasswords(channels);
                }
                break;
            case 2:
                new NumberMultiples(channels);
                break;
            default:
                new OrderedNumbers(channels);
                break;
        }
    }
    static checkStatus() {
        if (!HackTimer.isRunning || !DiskManager.hasQuarantineFiles()) {
            return;
        }
        if (Date.now() - HackTimer.startTime >= HackTimer.interval * 60000) {
            HackTimer.createHack();
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
                .one("click", () => {
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
            Stats.increment("hacks", "hidden-passwords-solved");
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
            "time": 25,
            "passwords": 2,
            "lines": 7
        },
        {
            "time": 40,
            "passwords": 4,
            "lines": 13
        },
        {
            "time": 55,
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
                    .one("click", () => {
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
                Stats.increment("hacks", "number-multiples-solved");
            }
            return true;
        }
    }
}
NumberMultiples.minMultiplier = 2;
NumberMultiples.maxMultiplier = 10;
NumberMultiples.levels = [
    {
        "time": 25,
        "highest-number": 20,
        "grid-size": 3,
        "multipliers": 2
    },
    {
        "time": 45,
        "highest-number": 30,
        "grid-size": 4,
        "multipliers": 3
    },
    {
        "time": 65,
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
        $("<h1>")
            .text("Linear number sequence detected!")
            .appendTo(this.content);
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
                    .one("click", () => {
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
                Stats.increment("hacks", "ordered-numbers-solved");
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
        "time": 25,
        "max-numbers": 9,
        "numbers-per-row": 3
    },
    {
        "time": 35,
        "max-numbers": 16,
        "numbers-per-row": 4
    },
    {
        "time": 45,
        "max-numbers": 25,
        "numbers-per-row": 5
    },
];
class SuspiciousFolder extends Verdict {
    constructor() {
        super("suspicious-folder");
    }
    registerEvents() {
        const options = this.content.children(".option-holder");
        options.children(".prompt-admin").one("click", () => this.promptAdmin(0));
        options.children(".purge-folder").one("click", () => this.purgeFolder(1));
        options.children(".collect-files").one("click", () => this.collectFiles(2));
    }
    promptAdmin(option) {
        const success = Utils.random();
        $.when(super.resolve(option, success)).done(() => {
            let amount = Utils.random(SuspiciousFolder.minReliability, SuspiciousFolder.maxReliability) / 100;
            if (!success) {
                amount *= -1;
                amount = amount.toString().substring(1, amount.length);
            }
            const reliability = $("<p>")
                .addClass("centered")
                .text("Reliability " + (success ? "gained" : "lost") + ": ")
                .appendTo(this.content.children(".paragraph-holder"));
            $("<span>")
                .addClass("clickable-no-click " + (success ? "" : "active-error"))
                .text(amount)
                .appendTo(reliability);
            Research.addReliability(amount);
        });
    }
    purgeFolder(option) {
        super.resolve(option, true);
    }
    collectFiles(option) {
        const success = Utils.random(0, 4) !== 0;
        $.when(super.resolve(option, success)).done(() => {
            if (success) {
                const filesToAdd = Utils.random(SuspiciousFolder.minFiles, SuspiciousFolder.maxFiles);
                let amount = 0;
                for (let index = 0; index < filesToAdd; index++) {
                    if (DiskManager.addFileToDisk()) {
                        amount++;
                    }
                    else {
                        break;
                    }
                }
                const files = $("<p>")
                    .addClass("centered")
                    .text("Files gained: ")
                    .appendTo(this.content.children(".paragraph-holder"));
                $("<span>")
                    .addClass("clickable-no-click")
                    .text(amount)
                    .appendTo(files);
            }
        });
    }
}
SuspiciousFolder.minReliability = 25;
SuspiciousFolder.maxReliability = 75;
SuspiciousFolder.minFiles = 1;
SuspiciousFolder.maxFiles = 6;
class Channel {
    constructor(id) {
        this.id = id;
        this.parent = $("<div>")
            .addClass("channel")
            .html(Views.get("channel"))
            .hide()
            .fadeIn()
            .appendTo("#channels");
        this.name = this.generateChannelName();
        this.detection = 0;
        this.siphoned = 0;
        this.remaining = (id + 1) * 1000;
        this.dataInterval = this.remaining / 100;
        this.isCracked = false;
        this.isDisplayed = false;
        this.isBusy = false;
        const info = this.parent.children(".channel-info");
        info.children(".channel-name")
            .on("click", () => {
            if (!this.isDisplayed) {
                ChannelManager.displayChannel(this);
            }
        });
        info.children("button")
            .on("click", () => this.createChannelAction(this.isCracked));
        this.updateInfo();
    }
    updateInfo() {
        const info = this.parent.children(".channel-info");
        info.children(".channel-name")
            .text(this.name);
        info.children("button")
            .prop("disabled", this.isBusy || (this.isCracked && this.remaining === 0))
            .text("[" + (this.isCracked ? "siphon" : "crack") + "]");
        const meta = this.parent.children(".channel-meta");
        meta.children(".channel-detection").text("Detection: " + (this.isCracked ? this.detection + "%" : "???"));
        meta.children(".channel-remaining").text((this.isCracked ? Utils.addPostfix(this.remaining) : "???") + " remaining");
    }
    static deserialize(data) {
        const channel = ChannelManager.addChannel();
        channel.name = data.name;
        channel.detection = data.detection;
        channel.siphoned = data.siphoned;
        channel.remaining = data.remaining;
        channel.dataInterval = data.dataInterval;
        channel.isDisplayed = data.isDisplayed;
        channel.isCracked = data.isCracked;
        channel.isBusy = data.isBusy;
        channel.updateInfo();
        if (channel.isDisplayed) {
            ChannelManager.displayChannel(channel);
        }
    }
    createChannelAction(isCracked) {
        const prefix = isCracked ? "Siphoning" : "Cracking";
        const cost = isCracked ? 10 : 50;
        const type = isCracked ? CoreTaskType.Siphon : CoreTaskType.Crack;
        const task = CoreTask.create(prefix + " " + this.name, cost, type)
            .setChannel(this)
            .setOnComplete(() => {
            if (isCracked) {
                this.siphoned++;
                this.remaining--;
                if (this.detection < 100) {
                    if (ChannelDetection.shouldIncreaseDetection()) {
                        this.detection++;
                    }
                }
                if (this.siphoned % this.dataInterval === 0) {
                    if (ChannelDetection.shouldGenerateHack(this.detection)) {
                        HackTimer.createHack();
                    }
                }
                if (this.isDisplayed) {
                    DataCore.setData(this.getProgress());
                }
                if (this.remaining === 0) {
                    task.onCancel();
                    Messenger.write("Targeted data synchronization and <span class='clickable-no-click'>memory core decryption</span> complete");
                }
            }
            else {
                this.isCracked = true;
                this.isBusy = false;
                Messenger.write("Network <span class='clickable-no-click'>channel access acquired</span>; memory core data siphoning available");
            }
            this.updateInfo();
        })
            .setOnCancel(() => {
            this.isBusy = false;
            this.updateInfo();
        });
        if (isCracked) {
            task.setIsInfinite(true);
        }
        if (task.run()) {
            this.isBusy = true;
            this.updateInfo();
        }
        return task;
    }
    generateChannelName() {
        let result = "";
        for (let index = 0; index < Channel.nameLength; index++) {
            result += Utils.getAlphanumericString(2).toUpperCase() + ":";
        }
        return result.substring(0, result.length - 1);
    }
    setDisplayed(displayed) {
        this.isDisplayed = displayed;
        const name = this.parent.children(".channel-info")
            .children(".channel-name");
        if (displayed) {
            name.addClass("active");
        }
        else {
            name.removeClass("active");
        }
    }
    getID() {
        return this.id;
    }
    getDetection() {
        return this.detection;
    }
    setDetection(detection) {
        this.detection = detection;
        this.updateInfo();
    }
    getProgress() {
        return (this.siphoned / (this.remaining + this.siphoned)) * 100;
    }
    getIsBusy() {
        return this.isBusy;
    }
    serialize() {
        return {
            "name": this.name,
            "detection": this.detection,
            "siphoned": this.siphoned,
            "remaining": this.remaining,
            "dataInterval": this.dataInterval,
            "isDisplayed": this.isDisplayed,
            "isCracked": this.isCracked,
            "isBusy": this.isBusy
        };
    }
}
Channel.nameLength = 5;
class ChannelDetection {
    static initialize() {
        window.setInterval(ChannelDetection.update, 1000);
    }
    static shouldIncreaseDetection() {
        const chance = Utils.random(ChannelDetection.minIncreaseChance, ChannelDetection.maxIncreaseChance);
        return chance > Utils.random(0, 100);
    }
    static shouldGenerateHack(detection) {
        return detection > Utils.random(0, 100);
    }
    static update() {
        const channels = ChannelManager.getAllChannels();
        for (const channel of channels) {
            if (channel.getIsBusy()) {
                continue;
            }
            let detection = channel.getDetection();
            if (detection === 0) {
                continue;
            }
            const chance = Utils.random(ChannelDetection.minDecreaseChance, ChannelDetection.maxDecreaseChance);
            if (chance < Utils.random(0, 100)) {
                continue;
            }
            channel.setDetection(--detection);
        }
    }
}
ChannelDetection.minIncreaseChance = 8;
ChannelDetection.maxIncreaseChance = 16;
ChannelDetection.minDecreaseChance = 5;
ChannelDetection.maxDecreaseChance = 12;
class ChannelManager {
    static initialize() {
        ChannelManager.channels = [];
        for (const channel of State.getValue("channels") || []) {
            Channel.deserialize(channel);
        }
        if (ChannelManager.channels.length === 0) {
            ChannelManager.displayChannel(ChannelManager.addChannel());
        }
    }
    static addChannel() {
        const channel = new Channel(ChannelManager.channels.length);
        ChannelManager.channels.push(channel);
        return channel;
    }
    static getChannel(index) {
        return ChannelManager.channels[index];
    }
    static getDisplayedChannel() {
        return ChannelManager.displayed;
    }
    static getAllChannels() {
        return ChannelManager.channels;
    }
    static displayChannel(channel) {
        for (const current of ChannelManager.channels) {
            current.setDisplayed(false);
        }
        channel.setDisplayed(true);
        ChannelManager.displayed = channel;
        DataCore.resetData(channel.getProgress());
    }
    static save() {
        const channels = [];
        for (const channel of ChannelManager.channels) {
            channels.push(channel.serialize());
        }
        State.setValue("channels", channels);
    }
}
class DataCore {
    static initialize() {
        const canvas = $("<canvas>")
            .attr("width", DataCore.canvasSize)
            .attr("height", DataCore.canvasSize)
            .appendTo("#data-core");
        DataCore.context = canvas[0].getContext("2d");
        DataCore.cubes = [];
    }
    static setData(progress) {
        const toAdd = Math.floor(progress) - DataCore.cubes.length;
        for (let index = 0; index < toAdd; index++) {
            DataCore.cubes.push(0);
        }
        DataCore.displayData();
    }
    static resetData(progress) {
        DataCore.context.clearRect(0, 0, DataCore.canvasSize, DataCore.canvasSize);
        DataCore.cubes = [];
        DataCore.setData(progress);
    }
    static displayData() {
        const context = DataCore.context;
        if (DataCore.handler !== undefined) {
            window.clearInterval(DataCore.handler);
        }
        context.fillStyle = $("body").css("--clickable-text");
        let frameCount = 0;
        DataCore.handler = window.setInterval(() => {
            const cubes = DataCore.cubes;
            const cubesToDraw = Math.min(frameCount / DataCore.cubeFadeSpeed, cubes.length);
            for (let index = 0; index < cubesToDraw; index++) {
                const fraction = Math.floor(index / DataCore.cubesPerRow);
                const x = (index * DataCore.realCubeSize) - (fraction * DataCore.canvasSize);
                const y = (DataCore.canvasSize - DataCore.cubeSize) - (fraction * DataCore.realCubeSize);
                let scale = DataCore.cubes[index];
                if (scale >= 100) {
                    continue;
                }
                else {
                    DataCore.cubes[index]++;
                }
                scale /= 100;
                const offset = DataCore.cubeRadius - (DataCore.cubeRadius * scale);
                context.beginPath();
                context.translate(x + offset, y + offset);
                context.scale(scale, scale);
                context.rect(0, 0, DataCore.cubeSize, DataCore.cubeSize);
                context.fill();
                context.setTransform(1, 0, 0, 1, 0, 0);
            }
            if (cubes[cubes.length - 1] >= 100) {
                window.clearInterval(DataCore.handler);
            }
            frameCount++;
        }, 1);
    }
}
DataCore.canvasSize = 300;
DataCore.cubeSize = 29;
DataCore.realCubeSize = 30;
DataCore.cubeRadius = DataCore.cubeSize / 2;
DataCore.cubesPerRow = 10;
DataCore.cubeFadeSpeed = 3;
