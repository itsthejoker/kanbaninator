// Modal manager
class ModalManager {
    constructor() {
        this.startModal = null;
        this.folderModal = null;
        this.editModal = null;
        this.newNoteModal = null;
        this.premadeModal = null;
        this.titleModal = null;
    }

    initModals() {
        // Initialize bootstrap modals
        this.startModal = new bootstrap.Modal(document.getElementById('startModal'));
        this.folderModal = new bootstrap.Modal(document.getElementById('folderModal'));
        this.editModal = new bootstrap.Modal(document.getElementById('editNoteModal'));
        this.newNoteModal = new bootstrap.Modal(document.getElementById('newNoteModal'));
        this.premadeModal = new bootstrap.Modal(document.getElementById('newPremadeModal'));
        this.titleModal = new bootstrap.Modal(document.getElementById('titleModal'));

        // Let the animation manager know modals are ready, but in a safe way
        if (window.modalAnimationManager) {
            try {
                // Using a very basic approach to avoid errors
                window.modalAnimationManager.applyEnhancedAnimations();
            } catch (e) {
                console.log('Note: Using default modal animations');
            }
        }
    }

    // Show/hide modals
    showStartModal() { this.startModal.show(); }
    hideStartModal() { this.startModal.hide(); }
    showFolderModal() { this.folderModal.show(); }
    hideFolderModal() { 
        // Use smooth animation to hide the modal
        this.folderModal.hide();

        // Allow the animation to complete before cleaning up
        setTimeout(() => {
            // Let the animation manager handle cleanup
            if (window.modalAnimationManager) {
                window.modalAnimationManager.cleanupOrphanedBackdrops();
            }
        }, 350); // Slightly longer than the CSS transition
    }
    showEditModal() { this.editModal.show(); }
    hideEditModal() { this.editModal.hide(); }
    showNewNoteModal() { this.newNoteModal.show(); }
    hideNewNoteModal() { this.newNoteModal.hide(); }
    showPremadeModal() { this.premadeModal.show(); }
    hidePremadeModal() { this.premadeModal.hide(); }
    showTitleModal() { this.titleModal.show(); }
    hideTitleModal() { this.titleModal.hide(); }

    populateFolderModal() {
        const bigList = document.getElementById("folderList");
        let folderArray = [...window.joplinIntegration.folders];

        while (folderArray.length) {
            folderArray.forEach((folder) => {
                if (folder.parent_id === '') {
                    bigList.appendChild(this.createListElement(folder))
                    folderArray = folderArray.filter(temp => temp.id !== folder.id);
                } else {
                    try {
                        let target = document.querySelector(`[data-joplin-id="${folder.parent_id}"]`);
                        let newUL = document.createElement('ul');
                        newUL.appendChild(this.createListElement(folder));
                        target.appendChild(newUL);
                        folderArray = folderArray.filter(temp => temp.id !== folder.id);
                    } catch (error) {
                        // continue, we'll pass it on the next iteration
                    }
                }
            })
        }
    }

    createListElement(obj) {
        let newListItem = document.createElement("li");
        let newListItemButton = document.createElement('span');
        let itemTitle = document.createElement('span');
        newListItemButton.classList.add('badge', 'bg-primary', 'me-2', 'text-white');
        newListItemButton.onclick = () => window.joplinIntegration.selectFolder(obj.id);
        newListItemButton.innerText = 'Select';
        newListItemButton.style.cursor = 'pointer'
        newListItem.setAttribute('data-joplin-id', obj.id);
        newListItem.setAttribute('data-joplin-parent-id', obj.parent_id);
        itemTitle.textContent = obj.title;
        newListItem.appendChild(newListItemButton);
        newListItem.appendChild(itemTitle);
        return newListItem;
    }

    spawnTitlePrompt(boardId) {
        document.getElementById("newNoteTitleField").value = "";
        document.getElementById("newNoteBodyField").value = "";
        document.getElementById("newNoteBoardId").textContent = boardId;
        this.showNewNoteModal();
    }

    uncheckAllRadios() {
        Array.from(document.getElementsByName("colorRadio")).forEach(function (el) {
            el.checked = false;
        });
        Array.from(document.getElementsByName("newColorRadio")).forEach(function (el) {
            el.checked = false;
        });
    }

    updateBoardTitle() {
        let newTitle = document.getElementById("boardTitleField").value;
        document.getElementById("boardTitle").textContent = newTitle;
        window.joplinIntegration.config.title = newTitle;
        window.boardManager.saveBoardState();
        this.hideTitleModal();
    }
}

window.modalManager = new ModalManager();
