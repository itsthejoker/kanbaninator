import { Modal } from 'bootstrap';

const modalHTML = `
<template>
    <div class="modal modal-lg" id="exampleModal" data-bs-keyboard="false" tabindex="-1"
        aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="newPremadeModalLabel">Starting Template</h1>
                </div>
                <div class="modal-body">
                </div>
            </div>
        </div>
    </div>
</template>
`

class CustomModal {
  constructor(elementId, options, bootstrapModalOptions) {
    this._elementId = elementId;
    this._bootstrapModalOptions = bootstrapModalOptions;
    this._options = options;
    this.template = new DOMParser().parseFromString(modalHTML, 'text/html').querySelector('template');
    const clone = this.template.content.cloneNode(true);
    document.body.appendChild(clone);
  }

  // Custom methods
  buildModal() {
    return new Modal(this._element, this._options);
  }
}