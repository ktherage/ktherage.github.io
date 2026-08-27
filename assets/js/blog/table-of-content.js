(function () {
    'use strict';

    const tocList = document.getElementById('toc-list');
    const tocAside = document.getElementById('toc');
    const tocToggle = document.getElementById('toc-toggle');

    if (!tocList || !tocAside) {
        return;
    }

    function slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function closeToc() {
        if (!tocAside.classList.contains('toc-open')) {
            return;
        }
        tocAside.classList.remove('toc-open');
        if (tocToggle) {
            tocToggle.setAttribute('aria-expanded', 'false');
        }
        const icon = tocToggle && tocToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-list');
        }
    }

    function init() {
        const article = document.querySelector('.blog-content');
        const headings = article ? article.querySelectorAll('h2, h3') : [];
        const commentsSection = document.getElementById('comments');

        const items = [];
        const hasContent = headings.length > 0 || commentsSection;

        function buildItem(heading, cssClass, labelHtml) {
            const li = document.createElement('li');
            li.className = 'toc-item ' + cssClass;
            const a = document.createElement('a');
            a.href = '#' + heading.id;
            if (labelHtml) {
                a.innerHTML = labelHtml;
            } else {
                a.textContent = heading.textContent;
            }
            a.addEventListener('click', function (e) {
                e.preventDefault();
                const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                heading.scrollIntoView({
                    behavior: reduceMotion ? 'auto' : 'smooth',
                    block: 'start'
                });
                closeToc();
            });
            li.appendChild(a);
            tocList.appendChild(li);
            items.push({ element: heading, link: a });
        }

        headings.forEach(function (heading) {
            if (!heading.id) {
                heading.id = slugify(heading.textContent);
            }
            buildItem(heading, 'toc-' + heading.tagName.toLowerCase(), null);
        });

        if (commentsSection) {
            buildItem(commentsSection, 'toc-comments', '<i class="fas fa-comments me-1" aria-hidden="true"></i>Comments');
        }

        if (!hasContent) {
            tocAside.style.display = 'none';
            if (tocToggle) {
                tocToggle.style.display = 'none';
            }
            return;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }
                items.forEach(function (item) {
                    item.link.classList.remove('active');
                });
                const current = items.find(function (item) {
                    return item.element === entry.target;
                });
                if (current) {
                    current.link.classList.add('active');
                }
            });
        }, { rootMargin: '-80px 0px -75% 0px', threshold: 0 });

        items.forEach(function (item) {
            observer.observe(item.element);
        });

        if (tocToggle) {
            tocToggle.addEventListener('click', function () {
                const isOpen = tocAside.classList.toggle('toc-open');
                tocToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                const icon = tocToggle.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-list', !isOpen);
                    icon.classList.toggle('fa-times', isOpen);
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
