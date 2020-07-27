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
class CoreManager {
    static initialize() {
        CoreManager.coreList = State.getValue("cores.count") || [];
    }
    static addCore(name, power) {
        CoreManager.coreList.push(new Core(CoreManager.coreList.length, name, power));
    }
    static startCoreTask(callback, cost) {
        for (const core of CoreManager.coreList) {
            if (!core.isBusy()) {
                core.setTask(callback, cost);
                return true;
            }
        }
        return false;
    }
}
class Utils {
    static random(arg1, arg2) {
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
}
class DiskManager {
    static async initialize() {
        DiskManager.disks = [];
        const diskNameData = await $.getJSON("src/data/disk-names.json");
        DiskManager.fileExtensions = diskNameData.extensions;
        DiskManager.diskNames = [];
        DiskManager.generateDiskNames(diskNameData, 3);
        DiskManager.quarantineLevel = 0;
        DiskManager.displayFiles(DiskManager.addDisk(500, false));
        DiskManager.addDisk(500, true);
    }
    static addDisk(maxStorage, isQuarantine) {
        const name = isQuarantine ? DiskManager.getQuarantineName() : DiskManager.getDiskName();
        const disk = new Disk(DiskManager.disks.length, name, maxStorage, isQuarantine);
        DiskManager.disks.push(disk);
        return disk;
    }
    static addFileToDisk(size, quarantine) {
        for (const disk of DiskManager.disks) {
            if ((quarantine && !disk.isQuarantineStorage()) || (!quarantine && disk.isQuarantineStorage())) {
                continue;
            }
            if (disk.addFile(size)) {
                return;
            }
        }
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
        return "/quarantine/level-" + ++DiskManager.quarantineLevel;
    }
}
class Main {
    static async initialize() {
        State.load();
        Messenger.initialize();
        CoreManager.initialize();
        await DiskManager.initialize();
    }
}
(() => Main.initialize())();
class Core {
    constructor(id, name, power) {
        this.id = id;
        this.power = power;
        this.handle = null;
        this.progress = 0;
        this.cost = 0;
        this.callback = null;
        this.powerDown = false;
        this.powerReduction = 0;
        this.parent = $("<div>")
            .attr("id", "core-" + id)
            .addClass("core")
            .hide()
            .fadeIn()
            .appendTo("#cores");
        $("<span>")
            .text(name)
            .appendTo(this.parent);
        $("<span>")
            .addClass("core-power")
            .appendTo(this.parent);
        $("<div>")
            .addClass("core-progress")
            .appendTo(this.parent);
        this.updatePower(power);
    }
    updatePower(power) {
        this.power = power;
        this.parent.children(".core-power")
            .text(" @ " + power + "Mhz");
    }
    updateCore() {
        if (this.powerDown) {
            this.progress -= this.powerReduction;
            if (this.progress <= 0) {
                window.clearInterval(this.handle);
                this.handle = null;
                this.progress = 0;
                this.cost = 0;
                this.callback = null;
                this.powerDown = false;
                this.powerReduction = 0;
            }
        }
        else {
            this.progress += (this.power / this.cost) * 10;
        }
        if (this.progress >= 100) {
            if (this.callback !== null) {
                this.callback();
                this.callback = null;
            }
            this.progress = 100;
            this.cost = 0;
            this.powerDown = true;
            this.powerReduction = (100 / 400) * 2;
            this.removeCancelButton();
        }
        const progress = this.progress + "%";
        const color = $("body").css("--clickable-text");
        this.parent.children(".core-progress")
            .css("background-image", "linear-gradient(90deg, " + color + " " + progress + ", rgba(0, 0, 0, 0.5) " + progress + ")");
    }
    setTask(callback, cost) {
        this.handle = window.setInterval(() => this.updateCore(), 1);
        this.cost = cost;
        this.callback = callback;
        this.addCancelButton();
    }
    cancelTask() {
        this.powerDown = true;
        this.powerReduction = (this.progress / 400) * 2;
        this.removeCancelButton();
    }
    addCancelButton() {
        $("<button>")
            .addClass("cancel-button")
            .text("[ x ]")
            .click(() => this.cancelTask())
            .hide()
            .fadeIn()
            .insertBefore(this.parent.children(".core-progress"));
    }
    removeCancelButton() {
        const element = $(this.parent.children(".cancel-button"))
            .off("click")
            .fadeOut(400, () => element.remove());
    }
    getID() {
        return this.id;
    }
    isBusy() {
        return this.handle !== null;
    }
}
class Disk {
    constructor(id, name, maxStorage, isQuarantine) {
        this.maxStorage = maxStorage;
        this.isQuarantine = isQuarantine;
        this.files = [];
        this.displayed = false;
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
        this.updateFileDisplay();
        for (let index = 0; index < this.files.length; index++) {
            this.displayFile(this.files[index], index * 50);
        }
        this.setDisplayed(true);
    }
    addFile(size) {
        if (this.maxStorage - this.getUsage() >= size) {
            const file = {
                "name": this.generateFileName(),
                "size": size
            };
            this.files.push(file);
            if (this.isDisplayed()) {
                this.displayFile(file);
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
        }
    }
    isQuarantineStorage() {
        return this.isQuarantine;
    }
    getUsage() {
        let usage = 0;
        for (const file of this.files) {
            usage += file.size;
        }
        return usage;
    }
    updateUsage() {
        this.parent.children(".disk-usage")
            .text(Math.floor((this.getUsage() / this.maxStorage) * 100) + "%");
    }
    updateFileDisplay() {
        const header = $("#disk-view").children(".header");
        if (this.files.length == 0) {
            header.text("No files to display")
                .removeClass("clickable");
        }
        else {
            header.addClass("clickable");
            if (this.isQuarantine) {
                header.text("Purge files")
                    .click();
            }
            else {
                header.text("Scan files")
                    .click();
            }
        }
    }
    displayFile(file, delay = 0) {
        const parent = $("<div>")
            .addClass("file")
            .hide()
            .delay(delay)
            .fadeIn()
            .appendTo($("#disk-view"));
        $("<span>")
            .text(file.name)
            .appendTo(parent);
        $("<span>")
            .text(file.size + "kb")
            .appendTo(parent);
    }
    generateFileName() {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
        let result = "";
        for (let index = 0; index < Utils.random(Disk.minFileNameLength, Disk.maxFileNameLength); index++) {
            result += Utils.random(chars);
        }
        return result + "." + Utils.random(DiskManager.getFileExtensions());
    }
}
Disk.minFileNameLength = 7;
Disk.maxFileNameLength = 16;
