(function () {
    'use strict';

    function init() {
        if (typeof mermaid === 'undefined') {
            return;
        }
        mermaid.initialize({ theme: 'neutral' });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
