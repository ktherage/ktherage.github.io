banner:
	rsvg-convert static/bannier.svg -o static/bannier.png

build:
	php cecil.phar clear && php cecil.phar build

dev:
	php cecil.phar serve --config=cecil.dev.yml

clear:
	php cecil.phar clear

self-update: 
	php cecil.phar self-update

lint: lint-twig lint-html

lint-twig:
	php twig-cs-fixer.phar lint layouts/

lint-html: build
	@echo "HTML checks: structured data & landmarks..."
	@find _site -name '*.html' | while read f; do \
		n=$$(grep -c 'application/ld+json' "$$f"); \
		m=$$(grep -c '<main' "$$f"); \
		if [ "$$n" -gt 1 ] || [ "$$m" -gt 1 ]; then \
			echo "FAIL: $$f (ld+json=$$n, main=$$m)"; exit 1; \
		fi; \
	done
	@grep -rn '<a href="#"' layouts/ && { echo "FAIL: <a href=\"#\"> found in layouts/"; exit 1; } || echo "HTML checks OK"

