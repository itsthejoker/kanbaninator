// Kanban board functionality
class KanbanBoard {
    constructor() {
        this.kanban = null;
        this.colorClassValues = [
            "col1", "col2", "col3", "col4", "col5", "col6",
            "col7", "col8", "col9", "col10", "col11", "col12"
        ];
    }

    init(config) {
        document.getElementById("boardTitle").textContent = config.title;
        this.kanban = new jKanban({
            element: '#kanbanBoard',
            boards: config.data,
            dragBoards: false,
            responsivePercentage: true, // Enable responsive behavior
            click: function (el) {
                window.joplinIntegration.getNoteBodyById(el.dataset.eid);
            },
            dropEl: function (el, target, source, sibling) {
                // Mark as having unsaved changes if in browser-only mode
                if (window.joplinIntegration.browserOnlyMode && window.exportImportManager) {
                    window.exportImportManager.hasUnsavedChanges = true;
                    window.exportImportManager.updateExportImportButton();
                }
                window.kanbanBoard.saveBoardState();
            },
            dragendBoard: function (el) {
                // Mark as having unsaved changes if in browser-only mode
                if (window.joplinIntegration.browserOnlyMode && window.exportImportManager) {
                    window.exportImportManager.hasUnsavedChanges = true;
                    window.exportImportManager.updateExportImportButton();
                }
                window.kanbanBoard.saveBoardState();
            },
            itemAddOptions: {
                enabled: false, // Disable jKanban's built-in add button
                content: '+',
                class: 'hidden-button', // Use a different class to avoid conflicts
                footer: false
            },
        });

        // Refresh the layout after a small delay to ensure everything is properly rendered
        setTimeout(() => this.refreshLayout(), 100);

        try {
            // Fix: Use proper DOM elements with autoScroll
            const container = document.querySelector('.kanban-container');
            if (container) {
                autoScroll([
                    container
                ], {
                    margin: 100,
                    maxSpeed: 50,
                    scrollWhenOutside: true,
                    autoScroll: function() {
                        return this.down && 
                               window.kanbanBoard && 
                               window.kanbanBoard.kanban && 
                               window.kanbanBoard.kanban.drake && 
                               window.kanbanBoard.kanban.drake.dragging;
                    }
                });
            }
        } catch (e) {
            console.warn('AutoScroll initialization error:', e);
        }

        // Set up the add buttons with proper event handlers
        setTimeout(() => {
            // Fix: Make sure buttons are properly initialized after layout is stable
            this.setupAddButtons();
            this.apply_colors();
            this.rowatize();
        }, 200);
            }

            setupAddButtons() {
        // First make sure all boards have add buttons
        this.add_title_buttons();

        // Then set up event handlers for all buttons
        const addButtons = document.getElementsByClassName("button-add-item");
        for (let i = 0; i < addButtons.length; i++) {
            const button = addButtons[i];
            // Remove any existing event listeners first
            const newButton = button.cloneNode(true);
            if (button.parentNode) {
                button.parentNode.replaceChild(newButton, button);
            }

            // Get the board ID from the parent structure
            const boardHeader = newButton.closest('.kanban-board-header');
            const board = boardHeader ? boardHeader.closest('.kanban-board') : null;
            const boardId = board ? board.getAttribute('data-id') : null;

            if (boardId) {
                // Set up the click handler with the correct boardId
                newButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.modalManager.spawnTitlePrompt(boardId);
                });

                // Move the button to the left of the title
                this.moveUp(newButton);
            }
        }
    }

    refreshLayout() {
        // Re-apply Bootstrap grid classes and fix any layout issues
        this.rowatize();

        // Ensure column headers are properly styled
        const titles = document.getElementsByClassName("kanban-title-board");
        for (let i = 0; i < titles.length; i++) {
            titles[i].style.width = "calc(100% - 30px)";
        }

        // Make sure colors are applied properly
        this.apply_colors();

        // Fix the add buttons
        this.setupAddButtons();

        // Force a reflow to ensure all styling takes effect
        void document.body.offsetHeight;
    }

    // Method to reinitialize buttons after any board changes
    reinitButtons() {
        setTimeout(() => {
            this.setupAddButtons();
        }, 100);
    }

    add_title_buttons() {
        const titles = document.getElementsByClassName("kanban-title-board");
        if (titles.length === 0) {
            return;
        }

        // First, remove all existing add buttons to avoid duplicates
        document.querySelectorAll('.button-add-item').forEach(button => {
            button.remove();
        });

        for (var column = 0; column < titles.length; column++) {
            var currentColumn = titles[column];

            // Find the board ID safely
            let boardElement = currentColumn.closest('.kanban-board');
            if (!boardElement) {
                boardElement = currentColumn.parentElement;
                if (boardElement) boardElement = boardElement.parentElement;
            }

            if (!boardElement) continue;

            const boardId = boardElement.dataset.id || boardElement.getAttribute('data-id');
            if (!boardId) continue;

            // Create a proper DOM element instead of using innerHTML
            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'button-add-item btn bg-success text-white btn-sm ms-2';
            addButton.textContent = '+';

            // Append the button to the title
            currentColumn.appendChild(addButton);
        }
    }

    moveUp(elem) {
        // https://stackoverflow.com/a/68557752
        var parentElem = elem.parentElement;
        var elemIndex = Array.prototype.indexOf.call(parentElem.children, elem);
        if (elemIndex > 0) { // Make sure we don't try to move the first child up
            parentElem.insertBefore(elem, parentElem.children[elemIndex - 1]);
        }
    }

    apply_colors() {
        Array.from(document.getElementsByClassName("kanban-item")).forEach(el => {
            let colorClass = el.dataset.colorclass;

            // Set default color class if none is specified
            if (!colorClass || !this.colorClassValues.includes(colorClass)) {
                colorClass = 'col12'; // Default neutral color
                el.dataset.colorclass = colorClass; // Update the data attribute
            }

            // Remove any existing color classes
            el.classList.remove(...this.colorClassValues);

            // Add the color class (now guaranteed to have a value)
            el.classList.add(colorClass);
        });
    }

    rowatize() {
        let board = document.getElementsByClassName("kanban-container")[0];
        if (!board) return;

        // Clear any existing inline width styling
        board.style.width = "100%";
        board.style.maxWidth = "100%";

        // Remove any existing row classes before adding them again
        board.classList.remove("row", "row-cols-1", "row-cols-md-2", "row-cols-lg-3", "row-cols-xl-4");
        board.classList.add("row", "row-cols-1", "row-cols-md-2", "row-cols-lg-3", "row-cols-xl-4", "g-2");

        // Apply proper column classes to each board
        Array.from(document.getElementsByClassName("kanban-board")).forEach(el => {
            // Clear any existing inline width styling that might override Bootstrap grid
            el.style.width = "";
            el.style.float = "none";
            el.style.display = "";
            el.style.margin = "0";

            // Remove existing column classes in case this is a re-render
            el.classList.remove("col", "col-12", "col-md-6", "col-lg-4", "col-xl-3");

            // Add column class
            el.classList.add("col", "p-2");

            // Fix inner container widths
            const boardHeader = el.querySelector('.kanban-board-header');
            if (boardHeader) {
                boardHeader.style.width = "100%";
            }

            const boardContainer = el.querySelector('.kanban-drag');
            if (boardContainer) {
                boardContainer.style.width = "100%";
            }
        });

        // Force a reflow to ensure styles apply
        void board.offsetWidth;
    }

    renderJSON() {
        let title = document.getElementById("boardTitle").textContent;
        let boards = []
        document.querySelectorAll('.kanban-board').forEach(el => {
            let item = []
            el.querySelectorAll('.kanban-item').forEach(i => {
                const noteId = i.dataset.eid;
                const noteData = {
                    title: i.childNodes[0].textContent,
                    id: noteId,
                    colorClass: i.dataset.colorclass
                };

                // Include note body if available in the cache
                if (window.joplinIntegration.noteBodies[noteId]) {
                    noteData.body = window.joplinIntegration.noteBodies[noteId].body;
                }

                item.push(noteData);
            })
            boards.push({
                id: el.getAttribute('data-id'),
                title: el.querySelector('.kanban-title-board').innerHTML,
                item,
            })
        })
        return {
            title: title,
            data: boards
        }
    }

    saveBoardState() {
        // If we're in browser-only mode, don't try to save to Joplin
        if (window.joplinIntegration.browserOnlyMode) {
            console.log('Running in browser-only mode, not saving to Joplin');
            return;
        }

        let boardState = JSON.stringify(this.renderJSON(), null, 2);
        boardState = (
            "Quick link: https://itsthejoker.github.io/kanbaninator/?configNoteId=" + 
            window.joplinIntegration.configNoteId + "&rootFolder=" + window.joplinIntegration.rootFolder
            + "\n\n"
            + "```json\n"
            + boardState
            + "\n```\n\n"
            + "This note is automatically maintained by [Kanbaninator](https://itsthejoker.github.io/kanbaninator/)."
        );

        axios.put(
            `http://127.0.0.1:${window.joplinIntegration.port_number}/notes/${window.joplinIntegration.configNoteId}?token=${window.joplinIntegration.token}`, 
            {body: boardState}
        );
    }
}

window.kanbanBoard = new KanbanBoard();
