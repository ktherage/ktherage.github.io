(function () {
    'use strict';

    if (!document.querySelector('.blog-content')) {
        return;
    }

    const HEADING_SELECTOR = '.blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6';

    function slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function uniqueId(baseId) {
        let id = baseId;
        let counter = 1;
        while (document.getElementById(id)) {
            id = baseId + '-' + counter;
            counter++;
        }
        return id;
    }

    function showCopyNotification() {
        const existing = document.querySelector('.copy-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.textContent = '🔗 Lien copié !';
        notification.className = 'copy-notification';
        document.body.appendChild(notification);

        setTimeout(function () {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(function () {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }

    function fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            /* eslint-disable-next-line no-console */
            console.warn('Clipboard copy failed', err);
        }
        document.body.removeChild(textArea);
    }

    function init() {
        const headings = document.querySelectorAll(HEADING_SELECTOR);

        headings.forEach(function (heading) {
            let id = heading.id;

            if (!id) {
                id = uniqueId(slugify(heading.textContent));
                heading.id = id;
            }

            if (heading.querySelector('.heading-anchor')) {
                return;
            }

            const anchor = document.createElement('a');
            anchor.href = '#' + id;
            anchor.className = 'heading-anchor';
            anchor.innerHTML = '<i class="fas fa-link"></i>';
            anchor.setAttribute('aria-label', 'Lien vers cette section : ' + heading.textContent);
            anchor.setAttribute('title', 'Cliquer pour copier le lien vers cette section');

            anchor.addEventListener('click', function () {
                const fullUrl = window.location.origin + window.location.pathname + '#' + id;

                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(fullUrl).then(showCopyNotification);
                } else {
                    fallbackCopy(fullUrl);
                    showCopyNotification();
                }
            });

            heading.appendChild(anchor);
        });

        // Smooth scroll for any in-page anchor click (Cecil [toc], TOC, etc.)
        document.addEventListener('click', function (e) {
            const target = e.target.closest('a[href^="#"]');
            if (!target) {
                return;
            }
            const targetId = target.getAttribute('href').substring(1);
            if (!targetId) {
                return;
            }
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                targetElement.scrollIntoView({
                    behavior: reduceMotion ? 'auto' : 'smooth',
                    block: 'start'
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
