(function () {
    'use strict';

    const filterBadges = document.querySelectorAll('.filter-badge');
    const blogPosts = document.querySelectorAll('.blog-post-item');

    if (filterBadges.length === 0 || blogPosts.length === 0) {
        return;
    }

    function init() {
        filterBadges.forEach(function (badge) {
            badge.addEventListener('click', function () {
                const filter = this.getAttribute('data-filter');

                filterBadges.forEach(function (b) {
                    b.classList.remove('active', 'bg-primary');
                    b.classList.add('bg-secondary');
                    b.setAttribute('aria-pressed', 'false');
                });
                this.classList.remove('bg-secondary');
                this.classList.add('active', 'bg-primary');
                this.setAttribute('aria-pressed', 'true');

                blogPosts.forEach(function (post) {
                    const tags = (post.getAttribute('data-tags') || '').split(',').filter(Boolean);
                    const show = filter === 'all' || tags.indexOf(filter) !== -1;
                    post.style.display = show ? '' : 'none';
                });
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
