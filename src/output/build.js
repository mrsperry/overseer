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
class Messenger {
    static initialize() {
        Messenger.messages = State.getValue("messages") || [];
        for (const message of Messenger.messages) {
            Messenger.write(message);
        }
    }
    static write(text) {
        Messenger.messages.push(text);
        $("<p>")
            .text(text)
            .hide()
            .fadeIn()
            .prependTo("#messages");
        this.applyOpacity();
    }
    static applyOpacity() {
        const children = $("#messages").children();
        for (let index = 0; index < children.length; index++) {
            $(children[index]).css("opacity", 1 - (index / 15));
        }
    }
}
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
    constructor(display, cost) {
        this.display = display;
        this.cost = cost;
        this.complete = null;
        this.cancel = null;
    }
    static create(display, cost) {
        return new CoreTask(display, cost);
    }
    getDisplay() {
        return this.display;
    }
    getCost() {
        return this.cost;
    }
    setOnComplete(onComplete) {
        this.complete = onComplete;
        return this;
    }
    setOnCancel(onCancel) {
        this.cancel = onCancel;
        return this;
    }
    onComplete() {
        if (this.complete !== null) {
            this.complete();
        }
    }
    onCancel() {
        if (this.cancel !== null) {
            this.cancel();
        }
    }
    run() {
        return CoreManager.startCoreTask(this);
    }
}
class Core {
    constructor(id, power) {
        this.id = id;
        this.power = power;
        this.handle = null;
        this.progress = 0;
        this.task = CoreTask.create("", 0);
        this.powerDown = false;
        this.powerReduction = 0;
        this.canOverclock = false;
        this.maxUpgrades = 0;
        this.upgrades = 0;
        this.searchingForFiles = false;
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
            .addClass("upgrade-button")
            .text("[+]")
            .click(() => this.overclock())
            .appendTo(this.info);
        $("<button>")
            .addClass("cancel-button")
            .text("[x]")
            .click(() => this.cancelTask())
            .appendTo(this.info);
        $("<button>")
            .addClass("search-button")
            .text("[search]")
            .click(() => this.searchForFiles())
            .appendTo(this.info);
        this.setCoreTaskDisplay();
        this.updatePower(power);
        this.updateButtons();
    }
    updatePower(power) {
        this.power = power;
        this.info.children(".core-power")
            .text(" @ " + power + "Mhz");
    }
    updateCore() {
        if (this.powerDown) {
            this.progress -= this.powerReduction;
            if (this.progress <= 0) {
                window.clearInterval(this.handle);
                this.handle = null;
                this.progress = 0;
                this.powerDown = false;
                this.powerReduction = 0;
                if (this.searchingForFiles) {
                    this.searchForFiles();
                }
            }
        }
        else {
            this.progress += (this.power / this.task.getCost()) * 10;
        }
        if (this.progress >= 100) {
            this.task.onComplete();
            this.progress = 100;
            this.powerDown = true;
            this.powerReduction = (100 / 400) * 2;
            if (!this.searchingForFiles) {
                this.setCoreTaskDisplay();
            }
        }
        this.canvas.drawCore(this.progress);
        if (!this.searchingForFiles) {
            this.updateButtons();
        }
    }
    overclock() {
        CoreTask.create("Overclocking core", this.power * 5000)
            .setOnComplete(() => {
            this.updatePower(this.power * 2);
            this.upgrades++;
            this.canOverclock = false;
        }).run();
    }
    searchForFiles() {
        this.searchingForFiles = true;
        CoreTask.create("Searching for files", this.power * 50)
            .setOnComplete(() => DiskManager.addFileToDisk())
            .run();
    }
    setTask(task) {
        this.task = task;
        this.handle = window.setInterval(() => this.updateCore(), 1);
        this.setCoreTaskDisplay(task.getDisplay());
        this.updateButtons();
    }
    cancelTask() {
        if (this.searchingForFiles) {
            this.searchingForFiles = false;
        }
        if (!this.powerDown) {
            this.powerReduction = (this.progress / 400) * 2;
        }
        this.powerDown = true;
        this.task.onCancel();
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
            .prop("disabled", this.powerDown || !this.isBusy());
        this.info.children(".upgrade-button")
            .prop("disabled", !this.canOverclock || this.isBusy());
        this.info.children(".search-button")
            .prop("disabled", this.powerDown || this.isBusy());
    }
    getID() {
        return this.id;
    }
    isBusy() {
        return this.handle !== null;
    }
    setCanOverclock(canOverclock) {
        this.canOverclock = canOverclock;
        this.updateButtons();
    }
    setMaxUpgrades(max) {
        this.maxUpgrades = max;
        this.setCanOverclock(this.maxUpgrades > this.upgrades);
    }
}
class CoreManager {
    static initialize() {
        CoreManager.coreList = State.getValue("cores.count") || [];
        CoreManager.maxCoreUpgrades = State.getValue("cores.max-upgrades") || 0;
        this.addCore(100);
    }
    static addCore(power) {
        CoreManager.coreList.push(new Core(CoreManager.coreList.length, power));
    }
    static startCoreTask(task) {
        for (const core of CoreManager.coreList) {
            if (!core.isBusy()) {
                core.setTask(task);
                return true;
            }
        }
        return false;
    }
    static upgradeCoreSpeeds() {
        CoreManager.maxCoreUpgrades++;
        for (const core of CoreManager.coreList) {
            core.setMaxUpgrades(CoreManager.maxCoreUpgrades);
        }
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
}
class DiskManager {
    static async initialize() {
        DiskManager.disks = [];
        const diskNameData = await $.getJSON("src/data/disk-names.json");
        DiskManager.fileExtensions = diskNameData.extensions;
        DiskManager.diskNames = [];
        DiskManager.generateDiskNames(diskNameData, 3);
        DiskManager.diskSize = 500;
        DiskManager.threatLevel = 1;
        DiskManager.displayFiles(DiskManager.addDisk(false));
        DiskManager.addDisk(true);
    }
    static addDisk(isQuarantine) {
        const name = isQuarantine ? DiskManager.getQuarantineName() : DiskManager.getDiskName();
        const disk = new Disk(DiskManager.disks.length, name, DiskManager.diskSize, isQuarantine);
        DiskManager.disks.push(disk);
        return disk;
    }
    static addFileToDisk() {
        for (const disk of DiskManager.disks) {
            if (disk.isQuarantineStorage()) {
                continue;
            }
            if (disk.addFile(this.threatLevel)) {
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
        const view = $("#disk-view");
        const display = () => {
            view.show().children(".file").remove();
            view.children(".header").hide().fadeIn();
            disk.displayFiles();
        };
        if (view.is("visible")) {
            view.fadeOut(400, display);
        }
        else {
            display();
        }
    }
    static upgradeDiskStorage() {
        DiskManager.diskSize *= 2;
        for (const disk of DiskManager.disks) {
            disk.setSize(DiskManager.diskSize);
        }
    }
    static addThreatLevel() {
        DiskManager.threatLevel++;
    }
    static getFileExtensions() {
        return DiskManager.fileExtensions;
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
        this.displayResearch();
    }
    static displayResearch() {
        for (let index = 0; index < Research.data.length; index++) {
            const id = $($("#research").children("button").get(index)).attr("id");
            if (Research.purchased.includes(index) || id !== undefined) {
                continue;
            }
            const item = Research.data[index];
            if (item.display > Research.reliability) {
                return;
            }
            const parent = $("<button>")
                .attr("id", "research-" + index)
                .click(() => {
                Research.purchaseResearch(index, item.type);
                parent.prop("disabled", true)
                    .fadeOut(400, () => parent.hide());
            })
                .hide()
                .delay(Research.displayDelay * index)
                .fadeIn()
                .appendTo("#research");
            $("<span>")
                .text(item.title)
                .appendTo(parent);
            $("<span>")
                .text("+" + Research.formatID(item.type))
                .appendTo(parent);
        }
    }
    static purchaseResearch(index, type) {
        Research.purchased.push(index);
        switch (type) {
            case "core-speeds":
                CoreManager.upgradeCoreSpeeds();
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
    static formatID(id) {
        return id.substring(0, 1).toUpperCase() + id.substring(1, id.length).split("-").join(" ");
    }
}
Research.displayDelay = 50;
Research.reliability = 0;
class Main {
    static initialize() {
        State.load();
        Messenger.initialize();
        CoreManager.initialize();
        DiskManager.initialize();
        Research.initialize();
    }
}
(() => Main.initialize())();
class Disk {
    constructor(id, name, maxStorage, isQuarantine) {
        this.name = name;
        this.maxStorage = maxStorage;
        this.isQuarantine = isQuarantine;
        this.files = [];
        this.displayed = false;
        this.displayedFiles = 0;
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
    updateUsage() {
        this.parent.children(".disk-usage")
            .text(Math.floor((this.getUsage() / this.maxStorage) * 100) + "%");
    }
    updateFileDisplay(delay = 0) {
        const parent = $("#disk-view");
        const header = parent.children(".header")
            .off("click");
        if (this.files.length == 0) {
            header.text("No files to display")
                .removeClass("clickable");
        }
        else {
            header.addClass("clickable")
                .text((this.isQuarantine ? "Purge" : "Scan") + " files")
                .click(() => this.wipeDisk(this.isQuarantine));
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
    wipeDisk(operation) {
        const parent = $("#disk-view");
        const header = parent.children(".header");
        const callback = () => operation ? this.purgeFiles() : this.scanFiles();
        const task = CoreTask.create((operation ? "Purging" : "Scanning") + ": " + this.name, this.getUsage())
            .setOnComplete(() => {
            callback();
            this.files = [];
            this.displayedFiles = 0;
            if (this.displayed) {
                for (const child of parent.children(".file")) {
                    $(child).fadeOut(400, () => {
                        $(child).remove();
                    });
                }
            }
            this.updateFileDisplay();
            this.updateUsage();
        })
            .setOnCancel(() => header.addClass("clickable").click(() => callback()));
        if (task.run()) {
            header.removeClass("clickable")
                .off("click");
        }
    }
    scanFiles() {
        const length = this.files.length;
        let threats = 0;
        for (let index = 0; index < length; index++) {
            const file = this.files[index];
            if (file.getIsThreat()) {
                threats++;
                DiskManager.addFileToQuarantine(file);
            }
        }
        Messenger.write("Scanned " + length + " files and found " + threats + " " + (threats === 1 ? "vulnerability" : "vulnerabilities"));
    }
    purgeFiles() {
        let reliability = 0;
        for (const file of this.files) {
            reliability += file.getSize() / 100;
        }
        Research.addReliability(reliability);
        Messenger.write("Purged " + this.files.length + " file" + (this.files.length === 1 ? "" : "s") + " and gained " + reliability.toFixed(2) + " reliability");
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
}
Disk.maxDisplayedFiles = 11;
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
}
DiskFile.minNameLength = 7;
DiskFile.maxNameLength = 16;
class Hack {
    constructor(time) {
        this.time = time;
        this.handle = window.setInterval(() => this.countdown(), 1000);
        this.locked = false;
    }
    addContent() {
        this.parent = $("<div>")
            .addClass("hack-container")
            .hide()
            .fadeIn()
            .appendTo("body");
        $("<div>")
            .addClass("hack-bg")
            .appendTo(this.parent);
        this.content = $("<div>")
            .addClass("hack-content")
            .appendTo(this.parent);
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
    }
    fail() {
        this.removeInterface(false);
    }
    removeInterface(success) {
        window.clearInterval(this.handle);
        this.locked = true;
        this.parent.delay(1500)
            .fadeOut(400, () => {
            this.parent.remove();
        });
        this.content.addClass(success ? "success" : "fail");
    }
}
class Cryptogram extends Hack {
    constructor(level) {
        const data = Cryptogram.levels[level - 1];
        super(data.time);
        this.password = Utils.createUniqueList(Cryptogram.letters.split(""), data.characters).join("");
        this.progress = "";
        this.addContent();
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
    }
    validateInput(letter) {
        this.progress += letter;
        if (this.password.charAt(this.progress.length - 1) !== letter) {
            super.fail();
            return false;
        }
        if (this.progress === this.password) {
            this.success();
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
class HiddenPasswords extends Hack {
    constructor(level) {
        const data = HiddenPasswords.data.levels[level - 1];
        super(data.time);
        this.passwords = Utils.createUniqueList(HiddenPasswords.data.passwords, data.passwords);
        this.markedPasswords = 0;
        this.lines = data.lines;
        this.lineLength = HiddenPasswords.lineLength;
        this.passwordContainer = [];
        this.addContent();
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
        this.addContent();
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
            this.fail();
            return false;
        }
        else {
            this.multiples.splice(this.multiples.indexOf(number), 1);
            if (this.multiples.length === 0) {
                this.success();
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
        this.addContent();
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
                this.success();
            }
            return true;
        }
        else {
            this.fail();
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
