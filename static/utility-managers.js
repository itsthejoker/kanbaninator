/**
 * Utility Managers
 * 
 * This file contains several utility manager classes that handle different aspects
 * of the application functionality:
 * 
 * - CookieManager: Handles storing and retrieving data from browser cookies
 * - UrlManager: Manages URL parameters for sharing and bookmarking boards
 * - UiManager: Controls UI elements like the loading spinner and theme switching
 */

// Cookie Manager
class CookieManager {
    setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    getCookie(cname) {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    setCookies() {
        this.setCookie("configNoteId", window.joplinIntegration.configNoteId, 365);
        this.setCookie("joplinToken", window.joplinIntegration.token, 365);
        this.setCookie("joplinPort", window.joplinIntegration.port_number, 365);
    }
}

// URL Manager
class UrlManager {
    setProjectUrl() {
        const url = new URL(window.location.href);
        url.searchParams.set('configNoteId', window.joplinIntegration.configNoteId);
        url.searchParams.set('rootFolder', window.joplinIntegration.rootFolder);
        window.history.pushState({}, '', url);
    }

    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const configNoteId = params.get("configNoteId");
        const rootFolder = params.get("rootFolder");
        return { configNoteId, rootFolder };
    }
}

// UI Manager
class UiManager {
    constructor() {
        this.darkModeEnabled = false;
        this.prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.spinnerTimeout = null;

        // Add window resize handler to keep board layout responsive
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        // Debounce the resize handler
        if (this.resizeTimer) clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            // Only refresh if kanban board is initialized
            if (window.kanbanBoard && window.kanbanBoard.kanban) {
                window.kanbanBoard.refreshLayout();
            }
        }, 250);
    }

    showSpinner() {
        const spinner = document.getElementById("loadingSpinnerContainer");
        if (spinner) {
            spinner.style.display = 'block';
            // Set a safety timeout to hide the spinner after 30 seconds in case it gets stuck
            if (this.spinnerTimeout) {
                clearTimeout(this.spinnerTimeout);
            }
            this.spinnerTimeout = setTimeout(() => this.hideSpinner(), 30000);
        }
    }

    hideSpinner() {
        const spinner = document.getElementById("loadingSpinnerContainer");
        if (spinner) {
            spinner.style.display = 'none';
        }
        if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            this.spinnerTimeout = null;
        }
    }

    setupConsoleLogging() {
        // https://stackoverflow.com/a/13278323
        console.logCopy = console.log.bind(console);

        console.log = function (data) {
            var timestamp = '[' + new Date().toLocaleString() + '] ';
            this.logCopy(timestamp, data);
        };
    }

    initThemeSupport() {
        // Check for saved preference
        const savedTheme = localStorage.getItem('kanbaninator-theme');
        if (savedTheme === 'dark' || (savedTheme === null && this.prefersDarkMode)) {
            this.enableDarkMode();
        }

        // Add theme toggle button to the UI
        this.addThemeToggle();

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('kanbaninator-theme')) {
                // Only auto-switch if user hasn't set a preference
                if (e.matches) {
                    this.enableDarkMode();
                } else {
                    this.disableDarkMode();
                }
            }
        });
    }

    addThemeToggle() {
        // Create the toggle button directly in the body instead of in the container
        const themeToggle = document.createElement('div');
        themeToggle.classList.add('theme-toggle');

        // Choose the appropriate icon and text based on current theme
        const isDarkMode = this.darkModeEnabled;
        const buttonContent = isDarkMode ? 
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sun" viewBox="0 0 16 16">
                <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
            </svg>
            <span class="theme-toggle-text">Switch to Light</span>` : 
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-moon-stars" viewBox="0 0 16 16">
                <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z"/>
                <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.734 1.734 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.734 1.734 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.734 1.734 0 0 0 1.097-1.097l.387-1.162zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L13.863.1z"/>
            </svg>
            <span class="theme-toggle-text">Switch to Dark</span>`;

        themeToggle.innerHTML = `
            <button id="themeToggleBtn" class="btn btn-sm" aria-label="Toggle dark/light theme">
                ${buttonContent}
            </button>
        `;

        // Append to body instead of container for better fixed positioning
        document.body.appendChild(themeToggle);

        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            if (this.darkModeEnabled) {
                this.disableDarkMode();
            } else {
                this.enableDarkMode();
            }
        });

        // Add scroll detection to enhance theme toggle visibility
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY || window.pageYOffset;
            const themeToggleBtn = document.getElementById('themeToggleBtn');

            if (scrollY > 100) {
                document.body.classList.add('scrolled');
            } else {
                document.body.classList.remove('scrolled');
            }
        });
    }

    enableDarkMode() {
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
            document.body.classList.add('dark-mode');
            this.darkModeEnabled = true;
            localStorage.setItem('kanbaninator-theme', 'dark');
            this.updateThemeColors();
        }, 10);
    }

    disableDarkMode() {
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
            document.body.classList.remove('dark-mode');
            this.darkModeEnabled = false;
            localStorage.setItem('kanbaninator-theme', 'light');
            this.updateThemeColors();
        }, 10);
    }

    updateThemeColors() {
        // This will be called when the theme changes to update any dynamic elements
        // that might need different colors in dark mode
        const iconToggle = document.querySelector('#themeToggleBtn svg');
        if (iconToggle) {
            if (this.darkModeEnabled) {
                iconToggle.classList.remove('bi-moon-stars');
                iconToggle.classList.add('bi-sun');
                iconToggle.innerHTML = '<path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>';
            } else {
                iconToggle.classList.remove('bi-sun');
                iconToggle.classList.add('bi-moon-stars');
                iconToggle.innerHTML = '<path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z"/><path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.734 1.734 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.734 1.734 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.734 1.734 0 0 0 1.097-1.097l.387-1.162zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L13.863.1z"/>';
            }
        }
    }
}

// Initialize all utility managers
window.cookieManager = new CookieManager();
window.urlManager = new UrlManager();
window.uiManager = new UiManager();
