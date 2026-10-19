(function () {
    'use strict';

    if (typeof mermaid === 'undefined') {
        return;
    }

    // Markdown renders a fence as <pre><code class="language-mermaid">, but mermaid
    // only scans .mermaid elements. Promote them before the first render.
    document.querySelectorAll('pre > code.language-mermaid').forEach(function (code) {
        const diagram = document.createElement('div');
        diagram.className = code.className;
        diagram.classList.add('mermaid');
        diagram.textContent = code.textContent;
        code.parentElement.replaceWith(diagram);
    });

    mermaid.initialize({ theme: 'neutral' });
    mermaid.run();
})();
