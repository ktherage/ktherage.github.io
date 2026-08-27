(function () {
    'use strict';

    function init() {
        if (typeof hljs === 'undefined') {
            return;
        }
        hljs.highlightAll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
