(function () {
    'use strict';

    const THEME_TOGGLE_SELECTOR = '[data-theme-toggle]';
    const STORAGE_KEY = 'user-theme-preference';
    const TRANSITION_DELAY = 150;

    let timeout = null;

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme, save) {
        clearTimeout(timeout);

        if (save) {
            localStorage.setItem(STORAGE_KEY, theme);
        }

        const root = document.documentElement;
        root.setAttribute('data-bs-theme', theme);
        root.setAttribute('data-theme-switching', 'true');

        updateToggleIcon(theme);

        timeout = setTimeout(() => {
            root.removeAttribute('data-theme-switching');
        }, TRANSITION_DELAY);
    }

    function updateToggleIcon(theme) {
        const selector = document.querySelector(THEME_TOGGLE_SELECTOR);
        if (!selector) {
            return;
        }
        const newIcon = document.createElement('i');
        newIcon.classList.add('fas', theme === 'dark' ? 'fa-sun' : 'fa-moon');
        selector.innerHTML = '';
        selector.appendChild(newIcon);
    }

    function toggle() {
        const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark', true);
    }

    function initToggle() {
        const toggleButton = document.querySelector(THEME_TOGGLE_SELECTOR);
        if (!toggleButton) {
            return;
        }
        toggleButton.addEventListener('click', toggle);
        const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
        updateToggleIcon(current);
    }

    function init() {
        const saved = localStorage.getItem(STORAGE_KEY);
        applyTheme(saved || getSystemTheme(), false);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light', false);
            }
        });

        initToggle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
