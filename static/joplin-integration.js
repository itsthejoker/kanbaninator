// Joplin API integration
class JoplinIntegration {
    constructor() {
        this.port_number = null;
        this.token = null;
        this.auth_token = null;
        this.configNoteId = null;
        this.rootFolder = null;
        this.folders = null;
        this.config = null;
        this.getKeyInterval = null;
        this.browserOnlyMode = false; // Flag to indicate if we're running in browser-only mode
        this.noteBodies = {}; // Cache for note bodies
    }

    validatePort() {
        let port_number = document.getElementById("joplin_port_number").nextElementSibling.value;
        if (!(window.isNaN(port_number))) {
            this.port_number = port_number;
            this.startLogin();
        } else {
            let errorp = document.getElementById("portNumberError");
            errorp.style.display = 'block';
            errorp.textContent = "That's not a number. Please put in a port number."
            window.modalManager.showStartModal();
        }
    }

    startLogin() {
        window.uiManager.showSpinner();
        axios.post(`http://127.0.0.1:${this.port_number}/auth`)
            .then((response) => {
                // handle success
                console.log(`auth success, received key ${response.data.auth_token}`);
                this.auth_token = response.data.auth_token;
                window.modalManager.hideStartModal();
                this.getKeyInterval = setInterval(() => this.finishSetup(), 500);
            })
            .catch((error) => {
                console.log(error);
                let errorp = document.getElementById("portNumberError");
                errorp.style.display = 'block';
                errorp.textContent = "Something went wrong; is that the right port? Alternatively, is Web Clipper enabled?"
                window.modalManager.showStartModal();
            });
    }

    finishSetup() {
        axios.get(`http://127.0.0.1:${this.port_number}/auth/check?auth_token=${this.auth_token}`)
            .then((response) => {
                if (response.data.status === "waiting") {
                    return;
                } else {
                    this.token = response.data.token;
                    // Hide spinner before showing folder modal
                    window.uiManager.hideSpinner();
                    this.getFolders();

                    // Small delay to ensure UI updates properly
                    setTimeout(() => {
                        window.modalManager.showFolderModal();
                    }, 100);

                    clearInterval(this.getKeyInterval);
                }
            })
            .catch(error => {
                console.error("Error checking auth:", error);
                window.uiManager.hideSpinner();
                clearInterval(this.getKeyInterval);
            });
    }

    getFolders() {
        // we may enter this with an invalid token, so we need to check for that.
        axios.get(`http://127.0.0.1:${this.port_number}/folders?token=${this.token}`)
            .then((response) => {
                this.folders = response.data.items;
                window.modalManager.populateFolderModal();
            })
            .catch((error) => {
                // we got an invalid token, so restart from the auth flow
                window.modalManager.showStartModal();
            });
    }

    selectFolder(folderId) {
        this.rootFolder = folderId;
        // Show loading spinner while processing
        window.uiManager.showSpinner();

        axios.get(
            `http://127.0.0.1:${this.port_number}/folders/${this.rootFolder}/notes?token=${this.token}`
        )
            .then((response) => {
                let foundConfig = false;
                response.data.items.forEach((note) => {
                    if (note.title === ".kanbaninator") {
                        foundConfig = true;
                        this.configNoteId = note.id;
                        // Hide the folder modal immediately when we find a config
                        window.modalManager.hideFolderModal();
                        this.getConfigNote();
                    }
                });

                if (!foundConfig) {
                    // we didn't find a config note in this folder.
                    let postData = {
                        parent_id: this.rootFolder,
                        title: ".kanbaninator",
                        body: ""
                    }

                    // Hide the folder modal before showing the next one
                    window.modalManager.hideFolderModal();

                    axios.post(
                        `http://127.0.0.1:${this.port_number}/notes?token=${this.token}`,
                        postData
                    ).then((response) => {
                        this.configNoteId = response.data.id;
                        window.cookieManager.setCookies();
                        window.urlManager.setProjectUrl();
                        // Hide spinner once we're done
                        window.uiManager.hideSpinner();
                        window.modalManager.showPremadeModal();
                    });
                }
            })
            .catch(error => {
                console.error("Error fetching notes:", error);
                window.uiManager.hideSpinner();
                // Make sure the folder modal is hidden even if there's an error
                window.modalManager.hideFolderModal();
            });
    }

    getConfigNote() {
        axios.get(
            `http://127.0.0.1:${this.port_number}/notes/${this.configNoteId}?token=${this.token}&fields=body`
        )
            .then((response) => {
                try {
                    let config_note = response.data.body;
                    config_note = config_note.split('\n');
                    const firstIndex = config_note.findIndex(element => element === '```json');
                    const lastIndex = config_note.findLastIndex(element => element === '```');
                    let data = config_note.slice(firstIndex + 1, lastIndex).join('');
                    this.config = JSON.parse(data);
                    // Explicitly hide the folder modal before initializing the board
                    window.modalManager.hideFolderModal();
                    // Always make sure to hide the spinner
                    window.uiManager.hideSpinner();
                    window.kanbanBoard.init(this.config);
                    console.log("Found existing config & built board.");
                    window.cookieManager.setCookies();
                    window.urlManager.setProjectUrl();
                } catch (error) {
                    console.log("Found config, but cannot load. Error:");
                    console.log(error);
                    // Also hide the folder modal and spinner in case of error
                    window.modalManager.hideFolderModal();
                    window.uiManager.hideSpinner();
                }
            })
            .catch(error => {
                console.error("Error fetching config note:", error);
                window.modalManager.hideFolderModal();
                window.uiManager.hideSpinner();
            });
    }

    getNoteBodyById(noteId) {
        // If we're in browser-only mode, we should only use cached data
        if (this.browserOnlyMode) {
            try {
                document.getElementById('currentNoteId').textContent = noteId;

                // Get the note element from the DOM
                const noteElement = document.querySelector(`[data-eid="${noteId}"]`);

                // Get the note title from the DOM if possible
                const noteTitle = noteElement ? noteElement.childNodes[0].textContent : '';

                // Get the note color from the DOM if possible
                let currentColor = noteElement ? noteElement.dataset.colorclass : "col12";
                if (currentColor === undefined) {
                    currentColor = "col12";
                }

                // If we have the note in cache, use that data
                if (this.noteBodies[noteId]) {
                    document.getElementById('noteTitleField').value = this.noteBodies[noteId].title;
                    document.getElementById('noteBodyField').value = this.noteBodies[noteId].body;
                } else {
                    // If not in cache, use the title from the DOM and an empty body
                    console.warn(`Note ${noteId} not found in cache, using title from DOM and empty body`);
                    document.getElementById('noteTitleField').value = noteTitle;
                    document.getElementById('noteBodyField').value = '';

                    // Create an entry in the cache for this note
                    this.noteBodies[noteId] = {
                        title: noteTitle,
                        body: ''
                    };
                }

                // Set the color radio buttons
                window.modalManager.uncheckAllRadios();
                document.getElementById(currentColor + "radio").checked = true;
                document.getElementById("n" + currentColor + "radio").checked = true;

                // Show the edit modal
                window.modalManager.showEditModal();
            } catch (error) {
                console.error(`Error loading note ${noteId}:`, error);
                alert("Error: Could not load note. Please try again.");
            }
            return;
        }

        // Only make API calls if we're not in browser-only mode
        axios.get(
            `http://127.0.0.1:${this.port_number}/notes/${noteId}?token=${this.token}&fields=body,title`
        )
            .then((response) => {
                try {
                    // Store the note body in cache
                    this.noteBodies[noteId] = {
                        title: response.data.title,
                        body: response.data.body
                    };

                    document.getElementById('currentNoteId').textContent = noteId;
                    document.getElementById('noteTitleField').value = response.data.title;
                    document.getElementById('noteBodyField').value = response.data.body;
                    let currentColor = document.querySelector(`[data-eid="${noteId}"]`).dataset.colorclass;
                    if (currentColor === undefined) {
                        currentColor = "col12";
                    }
                    window.modalManager.uncheckAllRadios();
                    document.getElementById(currentColor + "radio").checked = true;
                    document.getElementById("n" + currentColor + "radio").checked = true;
                    window.modalManager.showEditModal();
                } catch (error) {
                    console.log(`Found requested note ${noteId}, but cannot load body. Error:`);
                    console.log(error);
                }
            });
    }

    updateNoteBodyById() {
        let noteId = document.getElementById('currentNoteId').textContent;
        let noteTitle = document.getElementById('noteTitleField').value;
        let noteBody = document.getElementById('noteBodyField').value;

        // Find selected color
        let selectedColor = "col12";
        Array.from(document.getElementsByName("colorRadio")).forEach(function (el) {
            if (el.checked) {
                selectedColor = el.value;
            }
        });

        // If we're in browser-only mode, update the cache and UI directly
        if (this.browserOnlyMode) {
            // Update the cache
            this.noteBodies[noteId] = {
                title: noteTitle,
                body: noteBody
            };

            // Update the UI
            let currentNote = document.querySelector(`[data-eid="${noteId}"]`);
            if (currentNote) {
                if (currentNote.textContent !== noteTitle) {
                    currentNote.textContent = noteTitle;
                }

                // Update color
                currentNote.classList.remove(...window.kanbanBoard.colorClassValues);
                currentNote.classList.add(selectedColor);
                currentNote.dataset.colorclass = selectedColor;

                // Make sure all colors are properly applied
                window.kanbanBoard.apply_colors();

                // Mark as having unsaved changes
                if (window.exportImportManager) {
                    window.exportImportManager.hasUnsavedChanges = true;
                    window.exportImportManager.updateExportImportButton();
                }
            }

            // Hide the edit modal
            window.modalManager.hideEditModal();
            console.log(`Edited note ${noteId} in browser-only mode`);
            return;
        }

        // Update the note in Joplin
        axios.put(
            `http://127.0.0.1:${this.port_number}/notes/${noteId}?token=${this.token}`,
            {
                body: noteBody,
                title: noteTitle
            }
        ).then(() => {
            // Update the cache
            this.noteBodies[noteId] = {
                title: noteTitle,
                body: noteBody
            };

            // Update the UI
            let currentNote = document.querySelector(`[data-eid="${noteId}"]`);
            if (currentNote) {
                if (currentNote.textContent !== noteTitle) {
                    currentNote.textContent = noteTitle;
                }

                // Update color
                currentNote.classList.remove(...window.kanbanBoard.colorClassValues);
                currentNote.classList.add(selectedColor);
                currentNote.dataset.colorclass = selectedColor;

                // Make sure all colors are properly applied
                window.kanbanBoard.apply_colors();

                // Save board state
                try {
                    if (typeof window.kanbanBoard.saveBoardState === 'function') {
                        window.kanbanBoard.saveBoardState();
                    } else {
                        console.warn('saveBoardState is not a function - board state not saved');
                    }
                } catch (e) {
                    console.error('Error saving board state:', e);
                }
            }

            // Hide the edit modal
            window.modalManager.hideEditModal();
            console.log(`Edited note ${noteId}`);
        }).catch(error => {
            console.error("Error updating note:", error);
            alert("Error updating note. Please try again.");
        });
    }

    deleteNote() {
        let noteId = document.getElementById('currentNoteId').textContent;
        if (confirm("Delete this note?") === true) {
            // If we're in browser-only mode, just remove the element from the UI
            if (this.browserOnlyMode) {
                // Remove from cache
                if (this.noteBodies[noteId]) {
                    delete this.noteBodies[noteId];
                }

                // Remove from UI
                window.kanbanBoard.kanban.removeElement(noteId);

                // Mark as having unsaved changes
                if (window.exportImportManager) {
                    window.exportImportManager.hasUnsavedChanges = true;
                    window.exportImportManager.updateExportImportButton();
                }

                console.log(`Deleted note ${noteId} in browser-only mode`);
                window.modalManager.hideEditModal();
                return;
            }

            // Otherwise, delete from Joplin
            axios.delete(
                `http://127.0.0.1:${this.port_number}/notes/${noteId}?token=${this.token}`
            ).then(response => {
                // Remove from cache
                if (this.noteBodies[noteId]) {
                    delete this.noteBodies[noteId];
                }

                // Remove from UI
                window.kanbanBoard.kanban.removeElement(noteId);
                console.log(`Deleted note ${noteId}`);
                window.modalManager.hideEditModal();
            }).catch(error => {
                console.error(`Error deleting note ${noteId}:`, error);
                alert("Error deleting note. Please try again.");
            });
        }
    }

    add_item() {
        window.modalManager.hideNewNoteModal();
        let title = document.getElementById("newNoteTitleField").value;
        let body = document.getElementById("newNoteBodyField").value;
        let boardId = document.getElementById("newNoteBoardId").textContent;

        // Validate inputs
        if (!title.trim()) {
            alert("Please enter a title for your note");
            window.modalManager.showNewNoteModal();
            return;
        }

        let colorClass = "col12"; // Default color

        Array.from(document.getElementsByName("newColorRadio")).forEach(function (el) {
            if (el.checked) {
                colorClass = el.value;
            }
        });

        // If we're in browser-only mode, create a note locally
        if (this.browserOnlyMode) {
            // Generate a unique ID for the note
            const noteId = 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

            // Store the note body in cache
            this.noteBodies[noteId] = {
                title: title,
                body: body
            };

            // Add the note to the board
            window.kanbanBoard.kanban.addElement(boardId, {
                title: title,
                id: noteId,
                colorclass: colorClass
            });

            window.kanbanBoard.apply_colors();
            // Reinitialize buttons after adding a new element
            window.kanbanBoard.reinitButtons();

            // Mark as having unsaved changes
            if (window.exportImportManager) {
                window.exportImportManager.hasUnsavedChanges = true;
                window.exportImportManager.updateExportImportButton();
            }

            console.log(`Created local note ${noteId} in browser-only mode`);
            return;
        }

        let postData = {
            parent_id: this.rootFolder,
            title: title,
            body: body
        }

        const self = this; // Store reference to this for use in the callback

        axios.post(
            `http://127.0.0.1:${this.port_number}/notes?token=${this.token}`,
            postData
        ).then(function (response) {
            const noteId = response.data.id;

            // Store the note body in cache
            self.noteBodies[noteId] = {
                title: title,
                body: body
            };

            window.kanbanBoard.kanban.addElement(boardId, {
                title: title,
                id: noteId,
                colorclass: colorClass
            });

            window.kanbanBoard.apply_colors();
            // Reinitialize buttons after adding a new element
            window.kanbanBoard.reinitButtons();

            if (typeof window.kanbanBoard.saveBoardState === 'function') {
                window.kanbanBoard.saveBoardState();
            }

            console.log(`Created note ${noteId}`);
        });
    }
}

window.joplinIntegration = new JoplinIntegration();
