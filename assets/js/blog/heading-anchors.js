(function () {
	"use strict";

	const content = document.querySelector(".blog-content");

	if (!content) {
		return;
	}

	const HEADING_SELECTOR =
		".blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6";

	// Labels are rendered by Twig so they follow the page language.
	const copyLabel =
		content.dataset.anchorCopy || "Copy link to this section: %title%";
	const copyTitle = content.dataset.anchorCopyTitle || "";
	const copiedLabel = content.dataset.anchorCopied || "Link copied!";

	// Live region created empty at load, so updates are announced.
	const status = document.createElement("div");
	status.className = "copy-notification";
	status.setAttribute("role", "status");
	document.body.appendChild(status);

	let hideTimeout = null;

	function showCopyNotification() {
		clearTimeout(hideTimeout);
		status.textContent = copiedLabel;
		status.classList.add("is-visible");
		hideTimeout = setTimeout(function () {
			status.classList.remove("is-visible");
			status.textContent = "";
		}, 3000);
	}

	function fallbackCopy(text) {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		textArea.style.position = "fixed";
		textArea.style.opacity = "0";
		document.body.appendChild(textArea);
		textArea.select();
		try {
			document.execCommand("copy");
		} catch (err) {
			/* eslint-disable-next-line no-console */
			console.warn("Clipboard copy failed", err);
		}
		document.body.removeChild(textArea);
	}

	function init() {
		const headings = document.querySelectorAll(HEADING_SELECTOR);

		headings.forEach(function (heading) {
			let id = heading.id;

			if (!id) {
				id = uniqueHeadingId(slugifyHeading(heading.textContent));
				heading.id = id;
			}

			if (heading.querySelector(".heading-anchor")) {
				return;
			}

			const anchor = document.createElement("a");
			anchor.href = "#" + id;
			anchor.className = "heading-anchor";
			anchor.innerHTML = '<i class="fas fa-link" aria-hidden="true"></i>';
			anchor.setAttribute(
				"aria-label",
				copyLabel.replace("%title%", heading.textContent.trim()),
			);
			if (copyTitle) {
				anchor.setAttribute("title", copyTitle);
			}

			anchor.addEventListener("click", function () {
				const fullUrl =
					window.location.origin + window.location.pathname + "#" + id;

				if (navigator.clipboard && window.isSecureContext) {
					navigator.clipboard.writeText(fullUrl).then(showCopyNotification);
				} else {
					fallbackCopy(fullUrl);
					showCopyNotification();
				}
			});

			heading.appendChild(anchor);
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
