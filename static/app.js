// Main application initialization
document.addEventListener("DOMContentLoaded", function () {
    // Safety check for managers
    if (!window.uiManager) {
        console.error('UI Manager not initialized! Check script loading order.');
        return;
    }

    // Setup console logging with timestamps
    window.uiManager.setupConsoleLogging();

    // Safety check for modal manager
    if (!window.modalManager) {
        console.error('Modal Manager not initialized! Check script loading order.');
        return;
    }

    // Initialize animation manager with minimal functionality to avoid errors
    if (!window.modalAnimationManager) {
        console.log('Setting up simplified animation manager');
        window.modalAnimationManager = {
            applyEnhancedAnimations: function() { /* No-op function */ },
            cleanupOrphanedBackdrops: function() {
                // Basic cleanup function that only removes extra backdrops
                const backdrops = document.getElementsByClassName('modal-backdrop');
                if (backdrops.length > 0 && document.querySelectorAll('.modal.show').length === 0) {
                    Array.from(backdrops).forEach(backdrop => backdrop.remove());
                    document.body.classList.remove('modal-open');
                }
            }
        };
    }

    // Initialize all modals
    window.modalManager.initModals();

    // Try to restore session from cookies or URL parameters
    const joplinToken = window.cookieManager.getCookie("joplinToken");
    const joplinPort = window.cookieManager.getCookie("joplinPort");
    const urlParams = window.urlManager.parseUrlParams();

    console.log("Session info:", joplinToken, joplinPort, urlParams.configNoteId);

    // Initialize colorClassValues globally for compatibility
    window.colorClassValues = [
        "col1", "col2", "col3", "col4", "col5", "col6",
        "col7", "col8", "col9", "col10", "col11", "col12"
    ];

            // Initialize theme support
            window.uiManager.initThemeSupport();

    // Make sure spinner is hidden at startup
    window.uiManager.hideSpinner();

    if (joplinToken && joplinPort) {
        window.joplinIntegration.token = joplinToken;
        window.joplinIntegration.port_number = joplinPort;

        if (urlParams.configNoteId) {
            // If we have a direct link with configNoteId, load it immediately
            window.joplinIntegration.rootFolder = urlParams.rootFolder;
            window.joplinIntegration.configNoteId = urlParams.configNoteId;

            // Show spinner while loading
            window.uiManager.showSpinner();

            // Get config note first then folders
            window.joplinIntegration.getConfigNote();
            window.joplinIntegration.getFolders();
            return;
        }

        // Otherwise show folder selection
        // Hide spinner first just in case
        window.uiManager.hideSpinner();

        // Get folders then show folder modal
        window.joplinIntegration.getFolders();

        // Ensure UI has time to update
        setTimeout(() => {
            window.modalManager.showFolderModal();
        }, 100);
    } else {
        // First time user - show start modal
        window.modalManager.showStartModal();
    }
});

// Global event handlers
function validatePort() {
    window.joplinIntegration.validatePort();
}

function updateBoardTitle() {
    window.modalManager.updateBoardTitle();
}

function showTitleModal() {
    document.getElementById("boardTitleField").value = document.getElementById("boardTitle").textContent;
    window.modalManager.showTitleModal();
}

function updateNoteBodyById() {
    window.joplinIntegration.updateNoteBodyById();
}

function deleteNote() {
    window.joplinIntegration.deleteNote();
}

function add_item() {
    window.joplinIntegration.add_item();
}

// Template event handlers
function templateHerosJourney() {
    window.templateManager.templateHerosJourney();
}

function templateHeroinesJourney() {
    window.templateManager.templateHeroinesJourney();
}

function templateThreeActStructure() {
    window.templateManager.templateThreeActStructure();
}

function templateSaveTheCat() {
    window.templateManager.templateSaveTheCat();
}

function templateRomancingTheBeat() {
    window.templateManager.templateRomancingTheBeat();
}

function templateJamiGoldRomanceBeats() {
    window.templateManager.templateJamiGoldRomanceBeats();
}

function templateShortStoryRomance() {
    window.templateManager.templateShortStoryRomance();
}
