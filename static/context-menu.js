// Context Menu Manager
class ContextMenuManager {
    constructor() {
        this.activeMenu = null;
        this.init();
    }

    init() {
        // Listen for clicks anywhere to close the context menu
        document.addEventListener('click', this.handleDocumentClick.bind(this));
        // Listen for right-clicks on kanban items to show the context menu
        document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        // Also need to listen for the escape key to close the menu
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown(event) {
        if (event.key === 'Escape' && this.activeMenu) {
            this.closeMenu();
        }
    }

    handleDocumentClick() {
        this.closeMenu();
    }

    handleContextMenu(event) {
        // Check if right-click is on a kanban item
        const kanbanItem = event.target.closest('.kanban-item');
        if (kanbanItem) {
            // Prevent the default context menu
            event.preventDefault();

            // Store original click coordinates in both page and viewport coordinates
            this.clickClientX = event.clientX;
            this.clickClientY = event.clientY;

            // Create and show our custom context menu
            this.showMenu(event.pageX, event.pageY, kanbanItem);
        }
    }

    showMenu(x, y, kanbanItem) {
        // Close any existing menu first
        this.closeMenu();

        // Store device type for responsive handling
        this.isMobile = window.innerWidth <= 768;

        // Store original click coordinates for better positioning
        this.originalClickX = x;
        this.originalClickY = y;

        // Create the menu element
        const menu = document.createElement('div');
        menu.className = 'card-context-menu';
        const noteId = kanbanItem.dataset.eid;

        // Create menu items
        const editItem = document.createElement('button');
        editItem.className = 'card-context-menu-item';
        editItem.textContent = 'Edit Note';
        editItem.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeMenu();
            window.joplinIntegration.getNoteBodyById(noteId);
        });

        const copyIdItem = document.createElement('button');
        copyIdItem.className = 'card-context-menu-item';
        copyIdItem.textContent = 'Copy Note ID';
        copyIdItem.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeMenu();
            navigator.clipboard.writeText(noteId)
                .then(() => {
                    // Show a toast or some feedback
                    this.showToast('Note ID copied to clipboard');
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
        });

        // Add color picker menu item
        const colorPickerItem = document.createElement('button');
        colorPickerItem.className = 'card-context-menu-item color-picker-item';

        // Change arrow direction for mobile or edge cases
        const isMobile = window.innerWidth <= 768;
        let arrowSymbol = isMobile ? '▼' : '▶';

        // Function to update arrow direction based on position
        const updateArrow = () => {
            let newArrowSymbol;

            // Desktop mode
            if (!isMobile) {
                // If near right edge, point left
                if (colorPickerItem.classList.contains('near-right')) {
                    newArrowSymbol = '◀';
                }
                // Default desktop - point right
                else {
                    newArrowSymbol = '▶';
                }
            }
            // Mobile mode
            else {
                // If near bottom on mobile, point up
                if (colorPickerItem.classList.contains('near-bottom')) {
                    newArrowSymbol = '▲';
                }
                // Default mobile - point down
                else {
                    newArrowSymbol = '▼';
                }
            }

            // Only update if the arrow has changed
            if (newArrowSymbol !== arrowSymbol) {
                arrowSymbol = newArrowSymbol;
                // Update the arrow in the DOM
                const arrowSpan = colorPickerItem.querySelector('.color-menu-arrow');
                if (arrowSpan) arrowSpan.textContent = arrowSymbol;
            }
        };

        colorPickerItem.innerHTML = `Card Color <span class="color-menu-arrow">${arrowSymbol}</span>`;

        // Watch for class changes on the color picker item
        const observer = new MutationObserver(updateArrow);
        observer.observe(colorPickerItem, { attributes: true, attributeFilter: ['class'] });

        colorPickerItem.style.position = 'relative';
        colorPickerItem.style.display = 'flex';
        colorPickerItem.style.justifyContent = 'space-between';
        colorPickerItem.style.alignItems = 'center';

        // Create submenu for color options
        const colorSubmenu = document.createElement('div');
        colorSubmenu.className = 'card-color-submenu';
        colorSubmenu.style.display = 'none';

        // Add a header to the submenu
        const submenuHeader = document.createElement('div');
        submenuHeader.className = 'submenu-header';
        submenuHeader.textContent = 'Select Color';
        submenuHeader.style.width = '100%';
        submenuHeader.style.textAlign = 'center';
        submenuHeader.style.marginBottom = '8px';
        submenuHeader.style.fontSize = '14px';
        submenuHeader.style.fontWeight = 'bold';
        colorSubmenu.appendChild(submenuHeader);

        // Create color options
        for (let i = 1; i <= 12; i++) {
            const colorClass = `col${i}`;
            const colorOption = document.createElement('div');
            colorOption.className = `color-option ${colorClass}`;
            colorOption.style.width = '32px';
            colorOption.style.height = '32px';
            colorOption.style.cursor = 'pointer';
            colorOption.setAttribute('data-color', colorClass);

            // Highlight current color
            const currentColorClass = kanbanItem.dataset.colorclass;
            if (currentColorClass === colorClass) {
                colorOption.classList.add('selected');
                colorOption.style.border = '2px solid #007bff';
                colorOption.style.transform = 'scale(1.1)';
            }

            // Add event listener to change color
            colorOption.addEventListener('click', (e) => {
                e.stopPropagation();
                this.changeCardColor(noteId, colorClass);
                this.closeMenu();
            });

            // Add tooltip/title for accessibility
            colorOption.title = `Color ${i}`;

            colorSubmenu.appendChild(colorOption);
        }

        colorPickerItem.appendChild(colorSubmenu);

        // Handle submenu differently for mobile vs desktop
        if (this.isMobile) {
            // Toggle submenu on click for mobile
            colorPickerItem.addEventListener('click', (e) => {
                e.stopPropagation();
                if (colorSubmenu.style.display === 'flex') {
                    colorSubmenu.style.display = 'none';
                } else {
                    colorSubmenu.style.display = 'flex';
                }
            });

            // Add tap-outside detection to close the submenu
            document.addEventListener('click', (e) => {
                if (colorSubmenu.style.display === 'flex' && 
                    !colorSubmenu.contains(e.target) && 
                    !colorPickerItem.contains(e.target)) {
                    colorSubmenu.style.display = 'none';
                }
            }, { once: true });
        } else {
            // Desktop behavior - toggle submenu on hover
            colorPickerItem.addEventListener('mouseenter', () => {
                colorSubmenu.style.display = 'flex';
                // Force arrow rotation on desktop based on position
                const arrowSpan = colorPickerItem.querySelector('.color-menu-arrow');
                if (arrowSpan) {
                    if (colorPickerItem.classList.contains('near-right')) {
                        // If near right, rotate to point up (270deg)
                        arrowSpan.style.transform = 'rotate(270deg)';
                    } else {
                        // Default right arrow rotates to point down (90deg)
                        arrowSpan.style.transform = 'rotate(90deg)';
                    }
                }
            });

            // Make submenu sticky when hovered
            colorSubmenu.addEventListener('mouseenter', () => {
                colorSubmenu.classList.add('active');
            });

            // Hide submenu only when both the picker and submenu are not hovered
            colorPickerItem.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    if (!colorSubmenu.matches(':hover')) {
                        colorSubmenu.style.display = 'none';
                        colorSubmenu.classList.remove('active');

                        // Reset arrow rotation
                        const arrowSpan = colorPickerItem.querySelector('.color-menu-arrow');
                        if (arrowSpan) {
                            // Reset to initial state based on position
                            if (colorPickerItem.classList.contains('near-right')) {
                                arrowSpan.style.transform = 'rotate(180deg)';
                            } else {
                                arrowSpan.style.transform = '';
                            }
                        }
                    }
                }, 100);
            });

            colorSubmenu.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    if (!colorPickerItem.matches(':hover') && !colorSubmenu.classList.contains('active')) {
                        colorSubmenu.style.display = 'none';

                        // Reset arrow rotation when submenu is closed
                        const arrowSpan = colorPickerItem.querySelector('.color-menu-arrow');
                        if (arrowSpan) {
                            // Reset to initial state based on position
                            if (colorPickerItem.classList.contains('near-right')) {
                                arrowSpan.style.transform = 'rotate(180deg)';
                            } else {
                                arrowSpan.style.transform = '';
                            }
                        }
                    }
                    colorSubmenu.classList.remove('active');
                }, 100);
            });
        }

        const divider = document.createElement('div');
        divider.className = 'card-context-menu-divider';

        const deleteItem = document.createElement('button');
        deleteItem.className = 'card-context-menu-item danger';
        deleteItem.textContent = 'Delete Note';
        deleteItem.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeMenu();
            // Store the current note ID in the form and call delete
            document.getElementById('currentNoteId').textContent = noteId;
            window.joplinIntegration.deleteNote();
        });

        // Add menu items to the menu
        menu.appendChild(editItem);
        menu.appendChild(colorPickerItem);
        menu.appendChild(copyIdItem);
        menu.appendChild(divider);
        menu.appendChild(deleteItem);

        // Position the menu
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        // Add to document
        document.body.appendChild(menu);
        this.activeMenu = menu;

        // Make sure the menu stays within the viewport
        this.adjustMenuPosition(menu);
    }

    adjustMenuPosition(menu) {
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        // Store original position before adjustments
        const originalLeft = parseInt(menu.style.left, 10);
        const originalTop = parseInt(menu.style.top, 10);

        // Check if menu is outside the viewport horizontally
        if (rect.right > viewportWidth) {
            menu.style.left = `${viewportWidth - rect.width - 5}px`;
        }

        // Check if menu is outside the viewport vertically
        if (rect.bottom > viewportHeight) {
            // Position menu intelligently based on available space

            // Available space above the click point (in client coordinates)
            const spaceAbove = this.clickClientY || originalTop;
            // Space needed for the menu
            const spaceNeeded = rect.height + 10; // Add some margin

            // If there's enough space above the click point, position above
            if (spaceAbove > spaceNeeded) {
                // Position menu above the click point
                const newTop = this.clickClientY ? (originalTop - (rect.height + 10)) : (originalTop - spaceNeeded);
                menu.style.top = `${newTop}px`;
                menu.classList.add('position-above');
            } else {
                // Not enough space above, try to center menu around the click point
                // while ensuring it's fully visible
                const maxVisibleY = viewportHeight - rect.height - 5;
                const clickRelativePos = Math.min(0.8, Math.max(0.2, spaceAbove / viewportHeight));

                // Calculate position that keeps menu as close as possible to click point
                // but still fully visible - center menu around click point if possible
                const centeredPos = Math.max(5, this.clickClientY - (rect.height * clickRelativePos));
                const optimalPosition = Math.min(maxVisibleY, centeredPos);

                menu.style.top = `${optimalPosition}px`;
                menu.classList.add('position-adjusted');
            }
        }

        // Find color picker items and check if they would go offscreen
        const colorPicker = menu.querySelector('.color-picker-item');
        if (colorPicker) {
            // Calculate where the submenu would be positioned
            const pickerRect = colorPicker.getBoundingClientRect();
            const submenuWidth = this.isMobile ? 180 : 120; // Match the CSS width based on device

            // Check right edge - if submenu would go offscreen
            const wasNearRight = colorPicker.classList.contains('near-right');
            if (pickerRect.right + submenuWidth > viewportWidth) {
                colorPicker.classList.add('near-right');
                // Find and update arrow if near-right status changed
                if (!wasNearRight) {
                    const arrowSpan = colorPicker.querySelector('.color-menu-arrow');
                    if (arrowSpan) arrowSpan.textContent = '◀';
                }
            } else {
                if (wasNearRight) {
                    colorPicker.classList.remove('near-right');
                    // Reset arrow if we're no longer near right
                    const arrowSpan = colorPicker.querySelector('.color-menu-arrow');
                    if (arrowSpan) arrowSpan.textContent = this.isMobile ? '▼' : '▶';
                }
            }

            // Check bottom edge - if submenu would go offscreen
            // Calculate approximate submenu height based on number of colors and device
            const submenuHeight = this.isMobile ? 250 : 200; // Taller on mobile

            // Check if there's room below
            const spaceBelow = viewportHeight - pickerRect.bottom;
            // Check if there's room above
            const spaceAbove = pickerRect.top;

            // Determine if we're near bottom
            const isNearBottom = spaceBelow < submenuHeight;

            // If we're near bottom but have more space below than above,
            // still show below if possible
            if (isNearBottom && spaceBelow > spaceAbove && spaceBelow > 100) {
                colorPicker.classList.remove('near-bottom');
            } else if (isNearBottom) {
                colorPicker.classList.add('near-bottom');
            } else {
                colorPicker.classList.remove('near-bottom');
            }
        }
    }

    closeMenu() {
        if (this.activeMenu) {
            document.body.removeChild(this.activeMenu);
            this.activeMenu = null;
        }
    }

    showToast(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed bottom-0 end-0 m-3';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        document.body.appendChild(toast);

        // Initialize the Bootstrap toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        bsToast.show();

        // Remove the toast from DOM after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toast);
        });
    }

    // Method to change card color directly from context menu
    changeCardColor(noteId, colorClass) {
        const card = document.querySelector(`[data-eid="${noteId}"]`);
        if (!card) return;

        // Ensure we have a valid color class
        if (!colorClass || !window.kanbanBoard.colorClassValues.includes(colorClass)) {
            colorClass = 'col12'; // Default color if invalid or missing
        }

        // Remove any existing color classes
        card.classList.remove(...window.kanbanBoard.colorClassValues);

        // Add the new color class
        card.classList.add(colorClass);
        card.dataset.colorclass = colorClass;

        // Update the note in Joplin
        this.updateNoteColor(noteId, colorClass);

        // Show confirmation toast
        this.showToast(`Card color updated`);
    }

    // Save the color change to Joplin
    updateNoteColor(noteId, colorClass) {
        // First get the current note content
        axios.get(
            `http://127.0.0.1:${window.joplinIntegration.port_number}/notes/${noteId}?token=${window.joplinIntegration.token}&fields=body,title`
        ).then(response => {
            // Then update it with the new color
            axios.put(
                `http://127.0.0.1:${window.joplinIntegration.port_number}/notes/${noteId}?token=${window.joplinIntegration.token}`,
                {
                    body: response.data.body,
                    title: response.data.title
                }
            ).then(() => {
                // Save the board state to include this color change
                if (typeof window.kanbanBoard.saveBoardState === 'function') {
                    window.kanbanBoard.saveBoardState();
                }
            });
        });
    }
}

// Initialize the context menu manager after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.contextMenuManager = new ContextMenuManager();
});
