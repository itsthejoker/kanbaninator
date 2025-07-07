// Accessibility enhancements for Kanbaninator
class AccessibilityManager {
    constructor() {
        this.focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    }

    init() {
        this.setupKeyboardNavigation();
        this.enhanceScreenReaderSupport();
        console.log('Accessibility enhancements initialized');
    }

    setupKeyboardNavigation() {
        // Add keyboard navigation for kanban items
        document.addEventListener('keydown', (e) => {
            // If we're in an input or textarea, don't interfere
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const focusedElement = document.activeElement;

            // Handle Escape key for modals
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.show');
                if (openModals.length > 0) {
                    // Let Bootstrap handle this
                    return;
                }
            }

            // Handle kanban item navigation when an item has focus
            if (focusedElement && focusedElement.classList.contains('kanban-item')) {
                const currentBoard = focusedElement.closest('.kanban-board');
                const currentItems = Array.from(currentBoard.querySelectorAll('.kanban-item'));
                const currentIndex = currentItems.indexOf(focusedElement);
                const boardsArray = Array.from(document.querySelectorAll('.kanban-board'));
                const currentBoardIndex = boardsArray.indexOf(currentBoard);

                switch (e.key) {
                    case 'ArrowUp':
                        e.preventDefault();
                        if (currentIndex > 0) {
                            currentItems[currentIndex - 1].focus();
                        }
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        if (currentIndex < currentItems.length - 1) {
                            currentItems[currentIndex + 1].focus();
                        }
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        if (currentBoardIndex > 0) {
                            const prevBoard = boardsArray[currentBoardIndex - 1];
                            const prevItems = prevBoard.querySelectorAll('.kanban-item');
                            if (prevItems.length > 0) {
                                prevItems[0].focus();
                            } else {
                                // Focus the board header if no items
                                prevBoard.querySelector('.kanban-title-board').focus();
                            }
                        }
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        if (currentBoardIndex < boardsArray.length - 1) {
                            const nextBoard = boardsArray[currentBoardIndex + 1];
                            const nextItems = nextBoard.querySelectorAll('.kanban-item');
                            if (nextItems.length > 0) {
                                nextItems[0].focus();
                            } else {
                                // Focus the board header if no items
                                nextBoard.querySelector('.kanban-title-board').focus();
                            }
                        }
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        // Simulate click to open the edit modal
                        focusedElement.click();
                        break;
                }
            }
        });
    }

    enhanceScreenReaderSupport() {
        // Add ARIA attributes to important elements
        this.addAriaAttributes();

        // Watch for DOM changes to apply attributes to new elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    this.addAriaAttributes();
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    addAriaAttributes() {
        // Make kanban items focusable and announce their purpose
        document.querySelectorAll('.kanban-item').forEach(item => {
            if (!item.hasAttribute('tabindex')) {
                item.setAttribute('tabindex', '0');
                item.setAttribute('role', 'button');
                item.setAttribute('aria-label', `Card: ${item.textContent.trim()}`);
            }
        });

        // Make board headers accessible
        document.querySelectorAll('.kanban-title-board').forEach(title => {
            if (!title.hasAttribute('tabindex')) {
                title.setAttribute('tabindex', '0');
                title.setAttribute('role', 'heading');
                title.setAttribute('aria-level', '2');
            }
        });

        // Ensure add buttons are properly labeled
        document.querySelectorAll('.button-add-item').forEach(button => {
            const parentBoard = button.closest('.kanban-board');
            const boardTitle = parentBoard ? parentBoard.querySelector('.kanban-title-board').textContent.trim() : 'column';
            button.setAttribute('aria-label', `Add card to ${boardTitle}`);
        });
    }

    // For future implementation: add keyboard shortcuts to move cards between columns
    setupCardMovementShortcuts() {
        // This would allow moving the focused card with keyboard shortcuts
        // For example: Ctrl+Arrow keys to move cards between columns
    }
}

window.accessibilityManager = new AccessibilityManager();

// Initialize after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after a slight delay to ensure all other components are ready
    setTimeout(() => {
        window.accessibilityManager.init();
    }, 1000);
});
