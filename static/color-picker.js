// Color Picker Manager
class ColorPickerManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupColorPickers();
        // We need to reinitialize when Bootstrap modals are shown
        document.getElementById('editNoteModal').addEventListener('shown.bs.modal', () => {
            this.setupColorPickers();
        });
        document.getElementById('newNoteModal').addEventListener('shown.bs.modal', () => {
            this.setupColorPickers();
        });
    }

    setupColorPickers() {
        // Setup for edit note modal
        this.setupColorPickerGroup('colorRadio', 'col');
        // Setup for new note modal
        this.setupColorPickerGroup('newColorRadio', 'ncol');
    }

    setupColorPickerGroup(radioGroupName, idPrefix) {
        // Get all radio inputs for this group
        const radioInputs = document.querySelectorAll(`input[name="${radioGroupName}"]`);

        // For each radio input, set up the color option div
        radioInputs.forEach(input => {
            const colorValue = input.value;
            const colorNumber = colorValue.replace('col', '');
            const colorOptionId = `${idPrefix}${colorNumber}option`;
            const colorOption = document.getElementById(colorOptionId);

            if (!colorOption) return;

            // Set selected class if radio is checked
            if (input.checked) {
                colorOption.classList.add('selected');
            } else {
                colorOption.classList.remove('selected');
            }

            // Add click handler to the color option div
            colorOption.addEventListener('click', () => {
                // First remove selected class from all options in this group
                document.querySelectorAll(`.color-option[id^="${idPrefix}"]`).forEach(opt => {
                    opt.classList.remove('selected');
                });

                // Then add selected class to this option and check its radio
                colorOption.classList.add('selected');
                input.checked = true;
            });
        });
    }
}

// Initialize the color picker manager
document.addEventListener('DOMContentLoaded', () => {
    window.colorPickerManager = new ColorPickerManager();
});
