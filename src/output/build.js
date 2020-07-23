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
class Main {
    static initialize() {
        State.load();
    }
}
(() => Main.initialize())();
