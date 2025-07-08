// Export and Import functionality
class ExportImportManager {
    constructor() {
        // Initialize any required properties
        this.initStartModalImport();
        this.addStartWithoutJoplinButton();
        this.hasUnsavedChanges = false; // Track changes since last export
        this.setupBeforeUnloadHandler();
    }

    // Add a button to start without Joplin
    addStartWithoutJoplinButton() {
        // Function to add the button to the start modal footer
        const addButton = () => {
            const startModal = document.getElementById('startModal');
            if (!startModal) {
                // If the modal isn't available yet, try again later
                setTimeout(addButton, 100);
                return;
            }

            const modalFooter = startModal.querySelector('.modal-footer');
            if (!modalFooter) {
                // If the modal footer isn't available yet, try again later
                setTimeout(addButton, 100);
                return;
            }

            // Check if button already exists to avoid duplicates
            if (document.getElementById('startWithoutJoplinBtn')) {
                return;
            }

            // Create the button
            const startWithoutJoplinBtn = document.createElement('button');
            startWithoutJoplinBtn.type = 'button';
            startWithoutJoplinBtn.className = 'btn btn-secondary me-auto';
            startWithoutJoplinBtn.id = 'startWithoutJoplinBtn';
            startWithoutJoplinBtn.textContent = 'Start without Joplin';

            // Add event listener to the button
            startWithoutJoplinBtn.addEventListener('click', () => {
                window.startWithoutJoplin();
            });

            // Insert at the beginning of the footer
            modalFooter.insertBefore(startWithoutJoplinBtn, modalFooter.firstChild);
        };

        // Run immediately if DOM is already loaded, otherwise wait for DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addButton);
        } else {
            addButton();
        }
    }

    // Add import functionality to the start modal
    initStartModalImport() {
        // Function to add import section to the start modal
        const addImportSection = () => {
            const startModal = document.getElementById('startModal');
            if (!startModal) {
                // If the modal isn't available yet, try again later
                setTimeout(addImportSection, 100);
                return;
            }

            const modalBody = startModal.querySelector('.modal-body');
            if (!modalBody) {
                // If the modal body isn't available yet, try again later
                setTimeout(addImportSection, 100);
                return;
            }

            // Check if import section already exists to avoid duplicates
            if (document.getElementById('importBoardFileBtn')) {
                return;
            }

            // Create the import section
            const importSection = document.createElement('div');
            importSection.id = 'importSection';
            importSection.innerHTML = `
                <hr class="my-4">
                <h5>Or Import a Board File</h5>
                <p>
                    If you have a previously exported board file, you can import it directly without connecting to Joplin.
                </p>
                <div class="d-grid gap-2">
                    <button type="button" class="btn btn-outline-secondary" id="importBoardFileBtn">Import Board File</button>
                </div>
            `;

            // Append to modal body
            modalBody.appendChild(importSection);

            // Add event listener to the import button
            document.getElementById('importBoardFileBtn').addEventListener('click', () => {
                this.importBoardFromStartModal();
            });

            // Update the authenticate button text
            const authenticateBtn = startModal.querySelector('.modal-footer button');
            if (authenticateBtn) {
                authenticateBtn.textContent = 'Authenticate with Joplin';
            }
        };

        // Run immediately if DOM is already loaded, otherwise wait for DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addImportSection);
        } else {
            addImportSection();
        }
    }

    // Import a board from the start modal
    importBoardFromStartModal() {
        this.showImportDialog()
            .then(boardState => {
                // Hide the start modal
                const startModal = document.getElementById('startModal');
                const bsModal = bootstrap.Modal.getInstance(startModal);
                if (bsModal) bsModal.hide();

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

                // Store note bodies in the cache if present
                this._cacheNoteBodiesFromImport(boardState);

                // Initialize the board with the imported state
                window.kanbanBoard.init(boardState);

                // Set a flag to indicate we're in browser-only mode
                window.joplinIntegration.browserOnlyMode = true;

                // Reset the unsaved changes flag since we just imported a fresh state
                this.hasUnsavedChanges = false;
                this.updateExportImportButton();

                console.log('Board imported successfully in browser-only mode');
            })
            .catch(error => {
                alert(`Error importing board: ${error.message}`);
            });
    }

    // Export the current board state to a JSON file
    exportBoard() {
        // Always try to ensure all note bodies are in the cache before export
        this._ensureNoteBodiesCached()
            .then(() => {
                this._exportBoardState();
            })
            .catch(error => {
                console.error('Error ensuring note bodies are cached:', error);
                // Export anyway with whatever bodies we have
                this._exportBoardState();
            });
    }

    // Ensure all note bodies are cached before export
    _ensureNoteBodiesCached() {
        return new Promise((resolve) => {
            // If we're in browser-only mode, we can't fetch from Joplin
            if (window.joplinIntegration.browserOnlyMode) {
                // Instead, make sure all notes at least have an empty body in the cache
                const boardState = window.kanbanBoard.renderJSON();

                boardState.data.forEach(board => {
                    if (!board.item) return;

                    board.item.forEach(item => {
                        if (item.id && !window.joplinIntegration.noteBodies[item.id]) {
                            // If note is not in cache, add it with title from DOM and empty body
                            window.joplinIntegration.noteBodies[item.id] = {
                                title: item.title || '',
                                body: ''
                            };
                            console.log(`Added missing note ${item.id} to cache with empty body`);
                        }
                    });
                });

                resolve();
                return;
            }

            // If Joplin integration is available, fetch missing bodies
            this._fetchMissingNoteBodies()
                .then(resolve)
                .catch(error => {
                    console.warn('Error fetching note bodies from Joplin:', error);
                    resolve(); // Resolve anyway to continue with export
                });
        });
    }

    // Helper method to export the board state
    _exportBoardState() {
        // Get the current board state
        const boardState = window.kanbanBoard.renderJSON();

        // Convert to a JSON string with pretty formatting
        const boardStateJSON = JSON.stringify(boardState, null, 2);

        // Create a blob with the JSON data
        const blob = new Blob([boardStateJSON], { type: 'application/json' });

        // Create a download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);

        // Set the filename to the board title with a timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const boardTitle = boardState.title.replace(/[^a-zA-Z0-9]/g, '_');
        downloadLink.download = `${boardTitle}_${timestamp}.json`;

        // Trigger the download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Reset the unsaved changes flag
        this.hasUnsavedChanges = false;

        // Update the export/import button if in browser-only mode
        if (window.joplinIntegration.browserOnlyMode) {
            this.updateExportImportButton();
        }

        console.log('Board exported successfully');
    }

    // Fetch missing note bodies from Joplin
    _fetchMissingNoteBodies() {
        return new Promise((resolve, reject) => {
            const boardState = window.kanbanBoard.renderJSON();
            const missingNoteIds = [];

            // Collect all note IDs that don't have bodies in the cache
            boardState.data.forEach(board => {
                board.item.forEach(item => {
                    if (!window.joplinIntegration.noteBodies[item.id]) {
                        missingNoteIds.push(item.id);
                    }
                });
            });

            if (missingNoteIds.length === 0) {
                // No missing bodies, resolve immediately
                resolve();
                return;
            }

            console.log(`Fetching ${missingNoteIds.length} missing note bodies...`);

            // Fetch each missing note body
            const fetchPromises = missingNoteIds.map(noteId => {
                return axios.get(
                    `http://127.0.0.1:${window.joplinIntegration.port_number}/notes/${noteId}?token=${window.joplinIntegration.token}&fields=body,title`
                )
                .then(response => {
                    // Store the note body in cache
                    window.joplinIntegration.noteBodies[noteId] = {
                        title: response.data.title,
                        body: response.data.body
                    };
                })
                .catch(error => {
                    console.warn(`Failed to fetch body for note ${noteId}:`, error);
                });
            });

            // Wait for all fetches to complete
            Promise.all(fetchPromises)
                .then(() => {
                    console.log('All note bodies fetched successfully');
                    resolve();
                })
                .catch(error => {
                    console.error('Error fetching note bodies:', error);
                    reject(error);
                });
        });
    }

    // Import a board from a JSON file
    importBoard(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    // Parse the JSON data
                    const boardState = JSON.parse(event.target.result);

                    // Validate the board state
                    if (!this.isValidBoardState(boardState)) {
                        reject(new Error('Invalid board file format'));
                        return;
                    }

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

                    // Store note bodies in the cache if present
                    this._cacheNoteBodiesFromImport(boardState);

                    // Initialize the board with the imported state
                    window.kanbanBoard.init(boardState);

                    // Check if Joplin integration is available
                    if (!window.joplinIntegration.port_number || !window.joplinIntegration.token) {
                        // If Joplin integration is not available, set browser-only mode
                        window.joplinIntegration.browserOnlyMode = true;

                        // Reset the unsaved changes flag since we just imported a fresh state
                        this.hasUnsavedChanges = false;
                        this.updateExportImportButton();

                        console.log('Joplin integration not available, setting browser-only mode');
                    }

                    // Save the board state to Joplin if not in browser-only mode
                    if (!window.joplinIntegration.browserOnlyMode) {
                        window.kanbanBoard.saveBoardState();
                    }

                    console.log('Board imported successfully');
                    resolve(boardState);
                } catch (error) {
                    console.error('Error importing board:', error);
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                reject(error);
            };

            reader.readAsText(file);
        });
    }

    // Cache note bodies from imported board state
    _cacheNoteBodiesFromImport(boardState) {
        if (!boardState || !boardState.data) return;

        boardState.data.forEach(board => {
            if (!board.item) return;

            board.item.forEach(item => {
                if (item.id) {
                    // Store the note body in cache, even if body is undefined
                    window.joplinIntegration.noteBodies[item.id] = {
                        title: item.title || '',
                        body: item.body || '' // Use empty string if body is undefined
                    };
                    console.log(`Cached note ${item.id}`);
                }
            });
        });
    }

    // Validate the board state structure
    isValidBoardState(boardState) {
        // Check if the board state has the required properties
        if (!boardState || typeof boardState !== 'object') return false;
        if (typeof boardState.title !== 'string') return false;
        if (!Array.isArray(boardState.data)) return false;

        // Check each board in the data array
        for (const board of boardState.data) {
            if (typeof board !== 'object') return false;
            if (typeof board.id !== 'string') return false;
            if (typeof board.title !== 'string') return false;
            if (!Array.isArray(board.item)) return false;

            // Check each item in the board
            for (const item of board.item) {
                if (typeof item !== 'object') return false;
                if (typeof item.title !== 'string') return false;
                if (typeof item.id !== 'string') return false;

                // Optional properties
                // colorClass is optional, but if present, it should be a string
                if (item.colorClass !== undefined && typeof item.colorClass !== 'string') return false;
                // body is optional, but if present, it should be a string
                if (item.body !== undefined && typeof item.body !== 'string') return false;
            }
        }

        return true;
    }

    // Show a file picker dialog for importing
    showImportDialog() {
        return new Promise((resolve, reject) => {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';

            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    this.importBoard(file)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(new Error('No file selected'));
                }
            };

            // Trigger the file picker
            fileInput.click();
        });
    }

    // Create and show a modal for import/export options
    showExportImportModal() {
        // Create modal HTML
        const modalHTML = `
        <div class="modal modal-lg custom-animation" id="exportImportModal" tabindex="-1"
             aria-labelledby="exportImportModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="exportImportModalLabel">Export / Import Board</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-grid gap-3">
                            <button id="exportBoardBtn" class="btn btn-primary">Export Board</button>
                            <p>
                                Export your current board to a JSON file that you can save and share.
                            </p>
                            <button id="importBoardBtn" class="btn btn-warning">Import Board</button>
                            <p>
                                Import a board from a JSON file. This will replace your current board.
                                Make sure to export your current board first if you want to keep it.
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        // Add the modal to the document if it doesn't exist
        if (!document.getElementById('exportImportModal')) {
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer.firstElementChild);

            // Add event listeners to the buttons
            document.getElementById('exportBoardBtn').addEventListener('click', () => {
                this.exportBoard();
                this.hideExportImportModal();
            });

            document.getElementById('importBoardBtn').addEventListener('click', () => {
                this.showImportDialog()
                    .then(() => {
                        this.hideExportImportModal();
                    })
                    .catch(error => {
                        alert(`Error importing board: ${error.message}`);
                    });
            });
        }

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('exportImportModal'));
        modal.show();
    }

    // Hide the export/import modal
    hideExportImportModal() {
        const modalElement = document.getElementById('exportImportModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
    }

    // Update the export/import button and page title to show unsaved changes indicator
    updateExportImportButton() {
        // Only show the indicator in browser-only mode
        if (!window.joplinIntegration.browserOnlyMode) {
            return;
        }

        // Find the export/import button
        const exportImportBtn = document.querySelector('#exportImportButtonContainer button');
        if (!exportImportBtn) {
            return;
        }

        // Update the button text based on whether there are unsaved changes
        if (this.hasUnsavedChanges) {
            exportImportBtn.innerHTML = 'Export/Import*';
            exportImportBtn.title = 'Export or import board (unsaved changes)';

            // Update the page title to show unsaved changes
            if (!document.title.endsWith('*')) {
                document.title = 'Joplin Kanbaninator*';
            }
        } else {
            exportImportBtn.innerHTML = 'Export/Import';
            exportImportBtn.title = 'Export or import board';

            // Update the page title to remove unsaved changes indicator
            if (document.title.endsWith('*')) {
                document.title = 'Joplin Kanbaninator';
            }
        }
    }

    // Set up the beforeunload event handler to show a confirmation dialog when closing the tab with unsaved changes
    setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', (event) => {
            // Only show the confirmation dialog if there are unsaved changes in browser-only mode
            if (window.joplinIntegration.browserOnlyMode && this.hasUnsavedChanges) {
                // Standard way to show a confirmation dialog when closing the tab
                // The message is typically ignored by modern browsers, which show a generic message instead
                const message = 'You have unsaved changes. Are you sure you want to leave?';
                event.returnValue = message; // Standard for most browsers
                return message; // For older browsers
            }
        });
    }
}

// Initialize the export/import manager
window.exportImportManager = new ExportImportManager();

// Add a button to the UI for export/import
// Make the function globally accessible
window.addExportImportButton = function() {
    // Create a button for export/import
    const exportImportBtn = document.createElement('button');
    exportImportBtn.className = 'btn btn-outline-light';
    exportImportBtn.innerHTML = 'Export/Import';
    exportImportBtn.title = 'Export or import board';
    exportImportBtn.onclick = function() {
        window.exportImportManager.showExportImportModal();
    };

    // Add the button to the navbar
    const navbarContainer = document.getElementById('exportImportButtonContainer');
    if (navbarContainer) {
        navbarContainer.appendChild(exportImportBtn);

        // Update the button to show unsaved changes indicator if needed
        window.exportImportManager.updateExportImportButton();
    } else {
        // If the navbar container isn't available, add it next to the board title as fallback
        const boardTitleContainer = document.getElementById('boardTitle');
        if (boardTitleContainer) {
            // Create a container for the title and button
            const container = document.createElement('div');
            container.className = 'd-flex justify-content-center align-items-center';

            // Replace the board title with the container
            const parent = boardTitleContainer.parentElement;
            parent.replaceChild(container, boardTitleContainer);

            // Add the title and button to the container
            container.appendChild(boardTitleContainer);
            container.appendChild(exportImportBtn);

            // Update the button to show unsaved changes indicator if needed
            window.exportImportManager.updateExportImportButton();
        } else {
            // If the DOM isn't ready yet, try again later
            setTimeout(addExportImportButton, 500);
        }
    }
}

// The button will be added by app.js when the script is loaded
