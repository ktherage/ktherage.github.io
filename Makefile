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
