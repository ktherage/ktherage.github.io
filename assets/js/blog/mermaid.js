(function () {
    'use strict';

    // The 3.4 MB bundle is injected rather than declared as a <script> tag: a blocking
    // script delays every script placed after it (the table of contents stayed empty
    // until the whole bundle had downloaded).
    // shortcut: injected means no preload hint, so the charts appear slightly later than
    // with a <script> tag; add <link rel="preload"> if that delay ever matters.
    const bundle = document.createElement('script');
    bundle.src = document.currentScript.dataset.bundle;
    bundle.addEventListener('load', function () {
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
    });
    document.head.appendChild(bundle);
})();
