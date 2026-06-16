document.addEventListener('DOMContentLoaded', function () {
    // --- Floating table of contents ---
    var tocList = document.getElementById('toc-list');
    var tocAside = document.getElementById('toc');
    var tocToggle = document.getElementById('toc-toggle');
    if (tocList && tocAside) {
        var article = document.querySelector('.blog-content');
        var headings = article ? article.querySelectorAll('h2, h3') : [];
        var commentsSection = document.getElementById('comments');

        function slugify(text) {
            return text.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        }

        var items = [];
        var hasContent = headings.length > 0 || commentsSection;

        headings.forEach(function (heading) {
            if (!heading.id) {
                heading.id = slugify(heading.textContent);
            }
            var li = document.createElement('li');
            li.className = 'toc-item toc-' + heading.tagName.toLowerCase();
            var a = document.createElement('a');
            a.href = '#' + heading.id;
            a.textContent = heading.textContent;
            a.addEventListener('click', function (e) {
                e.preventDefault();
                heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (tocAside.classList.contains('toc-open')) {
                    tocAside.classList.remove('toc-open');
                    if (tocToggle) tocToggle.setAttribute('aria-expanded', 'false');
                    var icon = tocToggle.querySelector('i');
                    if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-list'); }
                }
            });
            li.appendChild(a);
            tocList.appendChild(li);
            items.push({ element: heading, link: a });
        });

        if (commentsSection) {
            var li = document.createElement('li');
            li.className = 'toc-item toc-comments';
            var a = document.createElement('a');
            a.href = '#comments';
            a.innerHTML = '<i class="fas fa-comments me-1" aria-hidden="true"></i>' + 'Comments';
            a.addEventListener('click', function (e) {
                e.preventDefault();
                commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (tocAside.classList.contains('toc-open')) {
                    tocAside.classList.remove('toc-open');
                    if (tocToggle) tocToggle.setAttribute('aria-expanded', 'false');
                    var icon = tocToggle.querySelector('i');
                    if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-list'); }
                }
            });
            li.appendChild(a);
            tocList.appendChild(li);
            items.push({ element: commentsSection, link: a });
        }

        if (!hasContent) {
            tocAside.style.display = 'none';
            if (tocToggle) tocToggle.style.display = 'none';
        } else {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        items.forEach(function (item) { item.link.classList.remove('active'); });
                        var current = items.find(function (item) { return item.element === entry.target; });
                        if (current) { current.link.classList.add('active'); }
                    }
                });
            }, { rootMargin: '-80px 0px -75% 0px', threshold: 0 });
            items.forEach(function (item) { observer.observe(item.element); });
        }

        if (tocToggle) {
            tocToggle.addEventListener('click', function () {
                var isOpen = tocAside.classList.toggle('toc-open');
                tocToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                var icon = tocToggle.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-list', !isOpen);
                    icon.classList.toggle('fa-times', isOpen);
                }
            });
        }
    }

    // --- Giscus ---
    var container = document.getElementById('giscus-comments');
    if (container) {
        function getTheme() {
            return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
        }

        function postTheme() {
            var iframe = document.querySelector('iframe.giscus-frame');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ giscus: { setConfig: { theme: getTheme() } } }, 'https://giscus.app');
                return true;
            }
            return false;
        }

        var script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.setAttribute('data-repo', 'ktherage/ktherage.github.io');
        script.setAttribute('data-repo-id', 'MDEwOlJlcG9zaXRvcnkxODQwOTM5ODQ=');
        script.setAttribute('data-category', 'Giscus');
        script.setAttribute('data-category-id', 'DIC_kwDOCvkNIM4C-RBl');
        script.setAttribute('data-mapping', 'pathname');
        script.setAttribute('data-strict', '0');
        script.setAttribute('data-reactions-enabled', '1');
        script.setAttribute('data-emit-metadata', '0');
        script.setAttribute('data-input-position', 'top');
        script.setAttribute('data-theme', getTheme());
        script.setAttribute('data-lang', document.documentElement.lang || 'en');
        script.setAttribute('data-loading', 'lazy');
        script.crossOrigin = 'anonymous';
        script.async = true;
        container.appendChild(script);

        var attempts = 0;
        var maxAttempts = 20;
        var interval = setInterval(function () {
            attempts++;
            if (postTheme() || attempts >= maxAttempts) {
                clearInterval(interval);
            }
        }, 500);

        var themeObserver = new MutationObserver(postTheme);
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-bs-theme']
        });
    }
});
