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
class Main {
    static initialize() {
        State.load();
        Messenger.initialize();
        CoreManager.initialize();
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
            .fadeOut(400, () => {
            element.remove();
        });
    }
    getID() {
        return this.id;
    }
    isBusy() {
        return this.handle !== null;
    }
}
