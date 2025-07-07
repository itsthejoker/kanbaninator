/**
 * Modal Animations Enhancement
 * 
 * This script improves the modal appearance and disappearance animations
 * by adding custom transition effects and fixing any animation glitches.
 */

class ModalAnimationManager {
  constructor() {
    this.init();
  }

  init() {
    // Apply to any modal that gets shown
    document.body.addEventListener('show.bs.modal', this.handleModalShow.bind(this), true);
    document.body.addEventListener('shown.bs.modal', this.handleModalShown.bind(this), true);
    document.body.addEventListener('hide.bs.modal', this.handleModalHide.bind(this), true);
    document.body.addEventListener('hidden.bs.modal', this.handleModalHidden.bind(this), true);

    // Fix any orphaned backdrops on page load
    this.cleanupOrphanedBackdrops();

    // Apply enhanced animations to all modals
    this.applyEnhancedAnimations();
  }

  handleModalShow(event) {
    // You can add specific behaviors when a modal starts to show
    const modal = event.target;

    // Ensure no leftover animations from previous sessions
    this.cleanupOrphanedBackdrops();

    // Apply animations to the specific modal being shown
    const dialog = modal.querySelector('.modal-dialog');
    if (dialog) {
      dialog.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease';
    }
  }

  handleModalShown(event) {
    // When modal is fully visible
    const modal = event.target;

    // Add focus to first input if present
    const firstInput = modal.querySelector('input:not([type="hidden"]), textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }
  }

  handleModalHide(event) {
    // When modal starts to hide
    const modal = event.target;

    // We can add custom hide animations here if needed
  }

  handleModalHidden(event) {
    // When modal is fully hidden
    this.cleanupOrphanedBackdrops();
  }

  cleanupOrphanedBackdrops() {
    // Remove any orphaned backdrops
    const modalBackdrops = document.getElementsByClassName('modal-backdrop');
    const activeModals = document.querySelectorAll('.modal.show');

    // If we have backdrops but no active modals, clean up
    if (modalBackdrops.length > 0 && activeModals.length === 0) {
      for (let i = 0; i < modalBackdrops.length; i++) {
        modalBackdrops[i].classList.remove('show');
        modalBackdrops[i].classList.remove('fade');
        modalBackdrops[i].remove();
      }
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('padding-right');
    }

    // Ensure backdrop count matches modal count
    if (modalBackdrops.length > activeModals.length && activeModals.length > 0) {
      // Remove excess backdrops
      for (let i = activeModals.length; i < modalBackdrops.length; i++) {
        if (i < modalBackdrops.length) {
          modalBackdrops[i].classList.remove('show');
          modalBackdrops[i].classList.remove('fade');
          modalBackdrops[i].remove();
        }
      }
    }
  }

  // Method to enhance modal transitions
  enhanceModalTransitions() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
      // Remove any inline transition styles to use our CSS
      if (modal._backdrop) {
        modal._backdrop.style.transition = '';
      }
    });
  }

  // Apply enhanced animations to all modals
  applyEnhancedAnimations() {
    // Simply rely on CSS animations defined in styles.css
    // This avoids any JavaScript-based animation issues
    console.log('Using CSS-only animations for modals');
  }

  // Force animations to apply by overriding Bootstrap's defaults
  forceEnhancedAnimations() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
      // Ensure modal dialog has proper transitions
      const dialog = modal.querySelector('.modal-dialog');
      if (dialog) {
        dialog.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease';
      }

      // We're skipping backdrop style manipulation as it's causing issues
      // Bootstrap will handle backdrop transitions with its default behavior
    });
  }
}

// Initialize the modal animation manager
document.addEventListener('DOMContentLoaded', () => {
  window.modalAnimationManager = new ModalAnimationManager();
});
