document.addEventListener('DOMContentLoaded', function() {
    // Sélectionner tous les titres dans le contenu des articles de blog
    const headings = document.querySelectorAll('.blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6');

    headings.forEach(function(heading) {
        // Vérifier si le titre a déjà un ID (généré par Cecil [toc] par exemple)
        let id = heading.id;

        // Si pas d'ID existant, en créer un
        if (!id) {
            id = heading.textContent
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '') // Supprimer les caractères spéciaux
                .replace(/\s+/g, '-')     // Remplacer les espaces par des tirets
                .replace(/-+/g, '-')      // Éviter les tirets multiples
                .replace(/^-|-$/g, '');   // Supprimer les tirets en début/fin

            // S'assurer que l'ID est unique
            let originalId = id;
            let counter = 1;
            while (document.getElementById(id)) {
                id = originalId + '-' + counter;
                counter++;
            }

            // Assigner l'ID au titre
            heading.id = id;
        }

        // Vérifier si le titre a déjà une ancre (pour éviter les doublons)
        if (heading.querySelector('.heading-anchor')) {
            return; // Passer au titre suivant
        }

        // Créer l'icône d'ancre
        const anchor = document.createElement('a');
        anchor.href = '#' + id;
        anchor.className = 'heading-anchor';
        anchor.innerHTML = '<i class="fas fa-link"></i>';
        anchor.setAttribute('aria-label', 'Lien vers cette section : ' + heading.textContent);
        anchor.setAttribute('title', 'Cliquer pour copier le lien vers cette section');

        // Ajouter un gestionnaire d'événement pour copier le lien
        anchor.addEventListener('click', function(e) {
            // Copier l'URL complète dans le presse-papiers
            const fullUrl = window.location.origin + window.location.pathname + '#' + id;

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(fullUrl).then(function() {
                    showCopyNotification();
                });
            } else {
                // Fallback pour les navigateurs plus anciens
                const textArea = document.createElement('textarea');
                textArea.value = fullUrl;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showCopyNotification();
            }

            // NE PAS empêcher le comportement par défaut
            // Laisser le navigateur faire le scroll automatique
        });

        // Ajouter l'ancre au titre
        heading.appendChild(anchor);
    });

    // Fonction pour afficher une notification de copie
    function showCopyNotification() {
        // Supprimer toute notification existante
        const existingNotification = document.querySelector('.copy-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Créer une nouvelle notification
        const notification = document.createElement('div');
        notification.textContent = '🔗 Lien copié !';
        notification.className = 'copy-notification';

        document.body.appendChild(notification);

        // Supprimer la notification après 3 secondes
        setTimeout(function() {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }

    // Améliorer le scroll pour les ancres existantes (Cecil [toc])
    document.addEventListener('click', function(e) {
        // Vérifier si c'est un lien vers une ancre interne
        if (e.target.tagName === 'A' && e.target.getAttribute('href') && e.target.getAttribute('href').startsWith('#')) {
            const targetId = e.target.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Scroll fluide vers l'élément
                setTimeout(() => {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 10);
            }
        }
    });
});
