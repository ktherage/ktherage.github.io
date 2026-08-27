(function () {
    'use strict';

    const container = document.getElementById('giscus-comments');
    if (!container) {
        return;
    }

    function getTheme() {
        return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
    }

    function postTheme() {
        const iframe = document.querySelector('iframe.giscus-frame');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ giscus: { setConfig: { theme: getTheme() } } }, 'https://giscus.app');
            return true;
        }
        return false;
    }

    function init() {
        const script = document.createElement('script');
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

        let attempts = 0;
        const maxAttempts = 20;
        const interval = setInterval(function () {
            attempts++;
            if (postTheme() || attempts >= maxAttempts) {
                clearInterval(interval);
            }
        }, 500);

        const themeObserver = new MutationObserver(postTheme);
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-bs-theme']
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
