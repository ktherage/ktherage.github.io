/* Shared by heading-anchors.js, anchor-url.js and table-of-content.js: they all
   need the same heading id, so the slug rule lives here once. */
(function () {
	"use strict";

	window.slugifyHeading = function (text) {
		return text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
	};

	window.uniqueHeadingId = function (baseId) {
		let id = baseId;
		let counter = 1;
		while (document.getElementById(id)) {
			id = baseId + "-" + counter;
			counter++;
		}
		return id;
	};
})();
