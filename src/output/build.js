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
    static addCore(power) {
        CoreManager.coreList.push(new Core(CoreManager.coreList.length, power));
    }
    static startCoreTask(display, callback, cost) {
        for (const core of CoreManager.coreList) {
            if (!core.isBusy()) {
                core.setTask(display, callback, cost);
                return true;
            }
        }
        return false;
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
class Research {
    static async initialize() {
        Research.data = await $.getJSON("src/data/research.json");
        Research.purchased = State.getValue("research.purchased") || [];
        Research.addReliability(State.getValue("research.reliability") || 0);
    }
    static addReliability(amount) {
        Research.reliability += amount;
        $("#research").children(".reliability")
            .text("Reliability: " + Research.reliability);
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
                .hide()
                .delay(Research.displayDelay * index)
                .fadeIn()
                .appendTo("#research");
            $("<span>")
                .text(item.title)
                .appendTo(parent);
            $("<span>")
                .text(item.description)
                .appendTo(parent);
        }
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
class Core {
    constructor(id, power) {
        this.id = id;
        this.power = power;
        this.handle = null;
        this.progress = 0;
        this.cost = 0;
        this.callback = null;
        this.powerDown = false;
        this.powerReduction = 0;
        const parent = $("<div>")
            .attr("id", "core-" + id)
            .addClass("core")
            .hide()
            .fadeIn()
            .appendTo("#cores");
        const canvas = $("<canvas>")
            .attr("width", Core.canvasSize)
            .attr("height", Core.canvasSize)
            .appendTo(parent);
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
            .click(() => this.cancelTask())
            .appendTo(this.info);
        $("<button>")
            .addClass("cancel-button")
            .text("[x]")
            .click(() => this.cancelTask())
            .appendTo(this.info);
        this.context = canvas[0].getContext("2d");
        this.context.translate(Core.canvasRadius, Core.canvasRadius);
        this.context.rotate((-90 * Math.PI) / 180);
        this.drawCore();
        this.setCoreTaskDisplay();
        this.updatePower(power);
        this.updateUpgradeButton(false);
        this.updateCancelButton(false);
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
            this.setCoreTaskDisplay();
            this.updateCancelButton(false);
        }
        this.clearCoreCanvas();
        this.drawCore();
    }
    setTask(display, callback, cost) {
        this.setCoreTaskDisplay(display);
        this.handle = window.setInterval(() => this.updateCore(), 1);
        this.cost = cost;
        this.callback = callback;
        this.updateCancelButton(true);
    }
    cancelTask() {
        this.powerDown = true;
        this.powerReduction = (this.progress / 400) * 2;
        this.setCoreTaskDisplay();
        this.updateCancelButton(false);
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
    updateUpgradeButton(enabled) {
        this.info.children(".upgrade-button")
            .prop("disabled", !enabled);
    }
    updateCancelButton(enabled) {
        this.info.children(".cancel-button")
            .prop("disabled", !enabled);
    }
    drawCore() {
        const draw = (color, percent) => {
            this.context.beginPath();
            this.context.arc(0, 0, Core.canvasRadius - 1, 0, Math.PI * 2 * percent);
            this.context.strokeStyle = color;
            this.context.stroke();
        };
        draw("#333333", 1);
        draw($("body").css("--clickable-text"), this.progress / 100);
    }
    clearCoreCanvas() {
        this.context.clearRect(-Core.canvasRadius, -Core.canvasRadius, Core.canvasSize, Core.canvasSize);
    }
    getID() {
        return this.id;
    }
    isBusy() {
        return this.handle !== null;
    }
}
Core.canvasSize = 50;
Core.canvasRadius = Core.canvasSize / 2;
class Disk {
    constructor(id, name, maxStorage, isQuarantine) {
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
    addFile(size) {
        if (this.maxStorage - this.getUsage() >= size) {
            const file = {
                "name": this.generateFileName(),
                "size": size
            };
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
    updateFileDisplay(delay = 0) {
        const parent = $("#disk-view");
        const header = parent.children(".header");
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
        this.displayedFiles++;
    }
    generateFileName() {
        const name = Utils.getAlphanumericString(Utils.random(Disk.minFileNameLength, Disk.maxFileNameLength));
        const extension = Utils.random(DiskManager.getFileExtensions());
        return name + "." + extension;
    }
}
Disk.minFileNameLength = 7;
Disk.maxFileNameLength = 16;
Disk.maxDisplayedFiles = 11;
Disk.displayDelay = 50;
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
        this.parent.delay(1000)
            .fadeOut(400, () => {
            this.parent.remove();
        });
        this.content.addClass(success ? "success" : "fail");
    }
}
class HiddenPasswords extends Hack {
    constructor(level) {
        const data = HiddenPasswords.data.levels[level - 1];
        super(data.time);
        this.passwords = Utils.createUniqueList(HiddenPasswords.data.passwords, data.passwords);
        this.markedPasswords = 0;
        this.lines = data.lines;
        this.lineLength = HiddenPasswords.lineLength;
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
            console.log("lengths: " + this.multipliers.length + " : " + this.numberOfMultipliers);
            let x, y;
            do {
                x = Utils.random(0, this.gridSize);
                y = Utils.random(0, this.gridSize);
            } while (selected.includes([x, y]));
            selected.push([x, y]);
            console.log("selected: " + x + "," + y);
            for (let multiplierIndex = 0; multiplierIndex < multipliers.length; multiplierIndex++) {
                const multiplier = multipliers[Utils.random(0, multipliers.length)];
                console.log("multiplier: " + multiplier);
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
        console.log(this.multiples);
        console.log(this.multipliers);
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
