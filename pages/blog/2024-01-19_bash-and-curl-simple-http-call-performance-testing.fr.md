---
title: "Bash & Curl : Test de performance simple d'appels HTTP"
description: "Une façon rapide et simple de tester les performances de vos appels HTTP."
cover:
  image: "img/terminal-code.jpg"
  alt: "Texte de langage de programmation informatique"
  caption: "Photo par <a href=\"https://www.pexels.com/@nathan Dumlao/\">Nathan Dumlao</a> sur <a href=\"https://www.pexels.com\">Pexels</a>"
published: true
tags: [Bash, Curl, Performance, Tests, HTTP, Shell, Développement Web, Ligne de commande, DevOps]
excerpt: >-
  Les appels HTTP sont essentiels au fonctionnement du Web et sont critiques pour tout projet de développement web. Vous vous êtes peut-être demandé comment visualiser rapidement les performances de vos appels HTTP. Je vais vous montrer comment j'ai fait simplement avec Curl.
---

Les appels HTTP sont essentiels au fonctionnement du Web et sont critiques pour tout projet de développement web. Vous vous êtes peut-être demandé comment visualiser rapidement les performances de vos appels HTTP. Je vais vous montrer comment j'ai fait simplement avec Curl.

**TL;DR :** Vous voulez juste le code (je comprends parfaitement 😉) ? Faites défiler jusqu'à l'extrait de code.

# Quel était mon besoin concernant les appels HTTP ?

J'avais besoin d'avoir une idée rapide des performances du système de cache que j'avais mis en place sur un point de terminaison HTTP, et je voulais que ce soit rapide et simple.

Avec mes notions de Shell et ma connaissance de base de Curl (un petit cadeau d'un collègue : vous trouverez une antisèche Curl ici), je savais que je pouvais facilement exécuter cent fois le même appel HTTP et obtenir le temps total en résultat.

Cette solution est une solution courte et simple qui correspond à mes besoins, à savoir tester localement mon point de terminaison HTTP.
Si vous prévoyez de faire de véritables tests de performance/charge sur des serveurs réels comme la staging ou la production, alors jetez un œil à des outils comme [Apache JMeter](https://jmeter.apache.org/), [Gatling](https://gatling.io/), ou d'autres outils similaires.

# Comment Curl m'a aidé à tester mon appel HTTP ?

J'ai donc ouvert mon terminal et exécuté :

```bash
for i in {1..100}; do curl 'https://some-domain/some-uri/some-path?cache=false' \
-H 'cache-control: no-cache' \
-H 'pragma: no-cache' \
--compressed \
--insecure -s -o /dev/null -w "%{time_total}s\n";
done

# Which printed :
0.057703s
0.067895s
0.063033s
0.062455s
0.074864s
...
```

Pour quelques explications, j'ai copié la requête envoyée par mon navigateur sous forme de requête Curl (cela se fait facilement sur la plupart des navigateurs, voir [ici](https://quickref.me/curl)) et je l'ai encapsulée dans une boucle `for` qui exécute cet appel HTTP cent fois.

**Le seul changement que j'ai apporté à la requête Curl** a été d'ajouter les options `-s` pour une sortie silencieuse, `-o /dev/null` pour éviter d'afficher le corps de la réponse et, le plus important, `-w "%{time_total}s\n"` qui permet de formater la sortie de Curl pour retourner le temps total. Vous pouvez trouver la liste complète des « Write out variables » disponibles [ici](https://everything.curl.dev/usingcurl/verbose/writeout.html#available-write-out-variables).

Et voilà 🎉 ! **Vous pouvez avoir une idée rapide des performances uniquement avec les outils que vous utilisez peut-être déjà.**

J'espère que cela vous sera utile !

N'hésitez pas à laisser vos commentaires ou questions ci-dessous.
