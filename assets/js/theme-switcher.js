class ThemeSwitcher {
    constructor(themeToggleSelector = '[data-theme-toggle]') {
        this.themeToggleSelector = themeToggleSelector;
        this.storageKey = 'user-theme-preference';
        this.timeout = null;

        this.init(themeToggleSelector);
    }

    init() {
        // Détecter le thème initial au chargement
        this.setInitialTheme();

        // Écouter les changements de préférences système
        this.watchSystemPreference();

        // Initialiser le bouton toggle
        this.initToggle();
    }

    /**
     * Détermine et applique le thème initial
     */
    setInitialTheme() {
        const savedTheme = localStorage.getItem(this.storageKey);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.applyTheme(theme);
    }

    /**
     * Surveille les changements de préférences système
     */
    watchSystemPreference() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', (e) => {
            // Ne réagir que si aucune préférence utilisateur n'est sauvegardée
            if (!localStorage.getItem(this.storageKey)) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /**
     * Applique le thème avec transition fluide
     */
    applyTheme(theme) {
        clearTimeout(this.timeout);

        // Sauvegarder la préférence utilisateur
        localStorage.setItem(this.storageKey, theme);

        // Marquer l'état de transition
        document.documentElement.setAttribute('data-theme-switching', 'true');

        this.timeout = setTimeout(() => {
            // Appliquer le thème Bootstrap
            document.documentElement.setAttribute('data-bs-theme', theme);

            // Mettre à jour l'icône du bouton
            this.updateToggleIcon(theme);

            // Retirer l'état de transition
            document.documentElement.removeAttribute('data-theme-switching');
        }, 150);
    }

    /**
     * Bascule entre dark et light
     */
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        this.applyTheme(newTheme);
    }

    /**
     * Initialise le bouton toggle
     */
    initToggle() {
        const toggleButton = document.querySelector(this.themeToggleSelector);
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggle());

            // Initialiser l'icône
            const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
            this.updateToggleIcon(currentTheme);
        }
    }

    /**
     * Met à jour l'icône du bouton toggle
     */
    updateToggleIcon(theme) {
        const selector = document.querySelector(`${this.themeToggleSelector}`);

        const newIcon = document.createElement('i');
        newIcon.classList.add('fas', theme === 'dark' ? 'fa-sun' : 'fa-moon');
        selector.innerHTML = '';
        selector.appendChild(newIcon);
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
});
