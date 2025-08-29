class ThemeSwitcher {
    constructor(themeToggleSelector = '[data-theme-toggle]') {
        this.themeToggleSelector = themeToggleSelector;
        this.storageKey = 'user-theme-preference';
        this.timeout = null;

        this.init();
    }

    init() {
        // Déterminer et appliquer le thème initial
        this.setInitialTheme();

        // Surveiller le changement du thème système
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

        // Si l’utilisateur a déjà choisi un thème, on le garde
        // Sinon, on suit le système
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.applyTheme(theme, false);
    }

    /**
     * Surveille les changements de préférences système
     */
    watchSystemPreference() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Ne réagir que si aucune préférence utilisateur n’est sauvegardée
            if (!localStorage.getItem(this.storageKey)) {
                this.applyTheme(e.matches ? 'dark' : 'light', false);
            }
        });
    }

    /**
     * Applique le thème avec option pour sauvegarder ou non
     */
    applyTheme(theme, save = true) {
        clearTimeout(this.timeout);

        // Sauvegarder uniquement si c’est un choix utilisateur
        if (save) {
            localStorage.setItem(this.storageKey, theme);
        }

        // Appliquer immédiatement le thème Bootstrap
        document.documentElement.setAttribute('data-bs-theme', theme);

        // Transition fluide
        document.documentElement.setAttribute('data-theme-switching', 'true');

        // Mettre à jour l’icône
        this.updateToggleIcon(theme);

        this.timeout = setTimeout(() => {
            document.documentElement.removeAttribute('data-theme-switching');
        }, 150);
    }

    /**
     * Bascule entre dark et light (choix utilisateur → sauvegardé)
     */
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme, true);
    }

    /**
     * Initialise le bouton toggle
     */
    initToggle() {
        const toggleButton = document.querySelector(this.themeToggleSelector);
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggle());

            // Icône initiale
            const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
            this.updateToggleIcon(currentTheme);
        }
    }

    /**
     * Met à jour l’icône du bouton toggle
     */
    updateToggleIcon(theme) {
        const selector = document.querySelector(this.themeToggleSelector);
        if (!selector) return;

        const newIcon = document.createElement('i');
        newIcon.classList.add('fas', theme === 'dark' ? 'fa-sun' : 'fa-moon');
        selector.innerHTML = '';
        selector.appendChild(newIcon);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
});
