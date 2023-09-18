// import {Modal} from './static/vendored/bootstrap.min.js';
import * as bootstrap from './static/vendored/bootstrap.min.js';
import {createColorFormInputs} from "./utils.js";

const modalHTML = `
<template>
    <div class="modal modal-lg" id="{AAA}Modal" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="{AAA}ModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="{AAA}ModalLabel">Title</h1>
                </div>
                <div class="modal-body">
                </div>
                </div>
                <div class="modal-footer">
            </div>
        </div>
    </div>
</template>
`

export class CustomModal {
    constructor(modalId, options, bootstrapModalOptions) {
        this.modalId = modalId;
        this._bootstrapModalOptions = bootstrapModalOptions;
        this._options = options;
        this.template = new DOMParser().parseFromString(
            modalHTML.replaceAll("{AAA}", this.modalId), 'text/html'
        ).querySelector('template');
        this.modal = this.template.content.cloneNode(true);
        document.body.appendChild(this.modal);
        this.boostrapEl = new bootstrap.Modal(this.modal, this._bootstrapModalOptions)
    }

    // Custom methods
    show() {
        this.boostrapEl.show();
    }

    hide() {
        this.boostrapEl.hide();
    }

    setTitle(title) {
        this.modal.querySelector(".modal-title").innerText = title;
    }

    addColors(elementId) {
        this.colors = createColorFormInputs(elementId);
        this.modal.querySelector(".modal-body").appendChild(document.createElement("hr"));
        this.modal.querySelector(".modal-body").appendChild(this.colors);
    }

    resetColors() {
        if (this.colors !== undefined) {
            this.colors.querySelectorAll("input").forEach((input) => {
            input.checked = false;
        });
        }
    }

    setBody(html) {
        this.modal.querySelector(".modal-body").innerHTML = html;
    }

    setFooter(html) {
        this.modal.querySelector(".modal-footer").innerHTML = html;
    }
}
