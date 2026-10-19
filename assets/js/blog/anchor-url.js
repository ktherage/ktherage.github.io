(function () {
    'use strict';

    const article = document.querySelector('.blog-content');
    if (!article) {
        return;
    }

    const HEADING_SELECTOR = '.blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6';
    const OFFSET = 100; // sticky header + comfortable margin

    function ensureId(heading) {
        if (heading.id) {
            return heading.id;
        }
        heading.id = uniqueHeadingId(slugifyHeading(heading.textContent));
        return heading.id;
    }

    function init() {
        const headings = Array.prototype.slice.call(article.querySelectorAll(HEADING_SELECTOR));
        const comments = document.getElementById('comments');
        if (comments) {
            headings.push(comments);
        }

        if (headings.length === 0) {
            return;
        }

        headings.forEach(ensureId);

        let currentId = window.location.hash ? window.location.hash.substring(1) : null;
        let ticking = false;

        function getActiveId() {
            let active = null;
            for (let i = 0; i < headings.length; i++) {
                if (headings[i].getBoundingClientRect().top <= OFFSET) {
                    active = headings[i].id;
                } else {
                    break;
                }
            }
            return active;
        }

        function update() {
            const id = getActiveId();
            if (id !== null && id !== currentId) {
                currentId = id;
                const url = id ? window.location.pathname + '#' + id : window.location.pathname;
                history.replaceState(null, '', url);
            }
            ticking = false;
        }

        function onScroll() {
            if (ticking) {
                return;
            }
            ticking = true;
            window.requestAnimationFrame(update);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        update();

        window.addEventListener('popstate', function () {
            currentId = window.location.hash ? window.location.hash.substring(1) : null;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
