// Function to add navbar
function addNavbar() {
    // Create navbar element
    const navbar = document.createElement('nav');
    navbar.className = 'navbar navbar-expand-lg navbar-dark bg-dark';
    navbar.innerHTML = `
    <div class="container-fluid">
        <a class="navbar-brand" href="#">Joplin Kanbaninator</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarContent">
            <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                <!-- New Project button will be added here -->
                <li class="nav-item d-flex align-items-center me-2" id="newProjectButtonContainer"></li>
                <!-- Export/Import button will be added here -->
                <li class="nav-item d-flex align-items-center me-2" id="exportImportButtonContainer"></li>
                <!-- Dark mode toggle will be added here -->
                <li class="nav-item d-flex align-items-center ms-2" id="darkModeToggleContainer"></li>
            </ul>
        </div>
    </div>
    `;

    // Insert navbar at the beginning of the body
    const firstChild = document.body.firstChild;
    document.body.insertBefore(navbar, firstChild);
}

// Function to add the New Project button to the navbar
function addNewProjectButton() {
    // Create a button for starting a new project
    const newProjectBtn = document.createElement('button');
    newProjectBtn.className = 'btn btn-outline-light';
    newProjectBtn.innerHTML = 'New Project';
    newProjectBtn.title = 'Start a new project';
    newProjectBtn.onclick = function() {
        // Confirm before starting a new project if there are unsaved changes
        if (window.joplinIntegration.browserOnlyMode && 
            window.exportImportManager && 
            window.exportImportManager.hasUnsavedChanges) {
            window.modalManager.showUnsavedChangesModal();
        } else {
            window.startWithoutJoplin();
        }
    };

    // Add the button to the navbar
    const navbarContainer = document.getElementById('newProjectButtonContainer');
    if (navbarContainer) {
        navbarContainer.appendChild(newProjectBtn);
    } else {
        // If the navbar container isn't available, try again later
        setTimeout(addNewProjectButton, 500);
    }
}

// Main application initialization
document.addEventListener("DOMContentLoaded", function () {
    // Add navbar to the page
    addNavbar();
    
    // Add the New Project button to the navbar
    addNewProjectButton();
    // Function to load export-import.js and show the start modal
    function loadExportImportAndShowStartModal() {
        if (!window.exportImportManager) {
            const script = document.createElement('script');
            script.src = 'static/export-import.js';
            script.onload = function() {
                console.log('Export/Import manager loaded successfully');
                // If the manager is loaded but the button isn't visible yet, try to add it
                if (window.exportImportManager && typeof window.addExportImportButton === 'function') {
                    window.addExportImportButton();
                }
                // Show the start modal after the script is loaded
                if (!window.joplinIntegration.token || !window.joplinIntegration.port_number) {
                    window.modalManager.showStartModal();
                }
            };
            script.onerror = function() {
                console.error('Failed to load export-import.js');
                // Show the start modal even if the script fails to load
                if (!window.joplinIntegration.token || !window.joplinIntegration.port_number) {
                    window.modalManager.showStartModal();
                }
            };
            document.head.appendChild(script);
        } else {
            // If the script is already loaded, just show the start modal
            if (!window.joplinIntegration.token || !window.joplinIntegration.port_number) {
                window.modalManager.showStartModal();
            }
        }
    }

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
        // First time user - load export-import.js and show start modal
        loadExportImportAndShowStartModal();
    }
});

// Global event handlers
function validatePort() {
    window.joplinIntegration.validatePort();
}

function startWithoutJoplin() {
    // Set browser-only mode flag
    window.joplinIntegration.browserOnlyMode = true;
    console.log('Starting in browser-only mode');

    // Clear existing note bodies cache
    window.joplinIntegration.noteBodies = {};

    // Clear existing kanban board if it exists
    if (window.kanbanBoard.kanban) {
        // Remove the entire kanban container to prevent duplicates
        const kanbanContainer = document.querySelector('.kanban-container');
        if (kanbanContainer && kanbanContainer.parentNode) {
            kanbanContainer.parentNode.removeChild(kanbanContainer);
        }

        // Also clear the kanbanBoard element to ensure a clean slate
        const kanbanBoard = document.getElementById('kanbanBoard');
        if (kanbanBoard) {
            kanbanBoard.innerHTML = '';
        }
    }

    // Create a default empty board configuration
    const defaultBoardConfig = {
        title: "My Story Outline",
        data: [
            {
                id: "board1",
                title: "Act 1",
                item: []
            },
            {
                id: "board2",
                title: "Act 2",
                item: []
            },
            {
                id: "board3",
                title: "Act 3",
                item: []
            }
        ]
    };

    // Initialize the board with the default configuration
    window.kanbanBoard.init(defaultBoardConfig);

    // Reset the unsaved changes flag since we're starting with a fresh state
    if (window.exportImportManager) {
        window.exportImportManager.hasUnsavedChanges = false;
        window.exportImportManager.updateExportImportButton();
    }

    // Hide the start modal
    window.modalManager.hideStartModal();

    // Show the premade templates modal
    window.modalManager.showPremadeModal();
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
