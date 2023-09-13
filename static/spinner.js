const spinnerHTML = `
<template>
    <div id="loadingSpinner" style="display: none">
        <h2 class="text-center mt-5">Please check Joplin to accept the connection.</h2>
        <img id="loadingSpinner"
            class="position-absolute top-50 start-50 translate-middle"
            src="static/Double%20Ring-1s-267px.gif"
        >
    </div>
</template>
`

export default class Spinner {
    constructor() {
        this.template = new DOMParser().parseFromString(spinnerHTML, 'text/html').querySelector('template');
        const clone = this.template.content.cloneNode(true);
        document.body.appendChild(clone);
    }

    show() {
        document.querySelector("#loadingSpinner").style.display = "block";
    }

    hide() {
        document.querySelector("#loadingSpinner").style.display = "none";
    }
}