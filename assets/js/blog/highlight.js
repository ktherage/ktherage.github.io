(function () {
	"use strict";

	// A <pre> that overflows horizontally cannot be scrolled with the keyboard
	// unless it is focusable. Only the ones that actually overflow are made
	// focusable, to avoid adding a tab stop per short code block.
	function enhanceCodeBlocks() {
		const content = document.querySelector(".blog-content");
		if (!content) {
			return;
		}
		const label = content.dataset.codeLabel || "Code block";

		content.querySelectorAll("pre").forEach(function (pre) {
			if (pre.classList.contains("mermaid")) {
				return;
			}
			// highlight.js makes the inner <code> its own block scroller, so the
			// overflowing element is not always the <pre>.
			const scroller = [pre, pre.firstElementChild].find(function (element) {
				return element && element.scrollWidth > element.clientWidth;
			});
			if (!scroller) {
				return;
			}
			scroller.setAttribute("tabindex", "0");
			scroller.setAttribute("role", "group");
			scroller.setAttribute("aria-label", label);
		});
	}

	function init() {
		if (typeof hljs !== "undefined") {
			hljs.highlightAll();
		}
		enhanceCodeBlocks();
		// Widths are final once the web fonts are loaded; the `load` event is
		// not reliable here (third-party embeds can delay it indefinitely).
		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(enhanceCodeBlocks);
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
