import {colorClassValues} from "./constants.js";

// https://www.w3schools.com/js/js_cookies.asp
export function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

export function setCookies() {
    setCookie("configNoteId", window.configNoteId, 365);
    setCookie("joplinToken", window.token, 365);
    setCookie("joplinPort", window.port_number, 365);
}

// https://stackoverflow.com/a/13278323
console.logCopy = console.log.bind(console);

console.log = function (data) {
    var timestamp = '[' + new Date().toLocaleString() + '] ';
    this.logCopy(timestamp, data);
};

export function moveElementUp(elem) {
    // https://stackoverflow.com/a/68557752
    var parentElem = elem.parentElement;
    var elemIndex = Array.prototype.indexOf.call(parentElem.children, elem);
    parentElem.insertBefore(elem, parentElem.children[elemIndex - 1]);
}

export function createColorFormInputs(elementId) {
    const base = document.createElement("div");
    base.classList.add("text-center");
    colorClassValues.forEach((colorClassValue) => {
        const container = document.createElement("div");
        container.classList.add("form-check", "form-check-inline");

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `${elementId}-color`;
        input.value = colorClassValue;
        input.id = `${colorClassValue}-radio`;
        input.classList.add("form-check-input");
        input.autocomplete = "off";
        const label = document.createElement("label");
        label.classList.add("form-check-label", colorClassValue, "colorbox");
        label.htmlFor = colorClassValue;
        label.appendChild(input);
        container.appendChild(label);
        base.appendChild(container);
    });
    return base;
}
