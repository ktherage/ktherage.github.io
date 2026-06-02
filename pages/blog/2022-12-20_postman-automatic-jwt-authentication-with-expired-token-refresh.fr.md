---
title: "Postman : Authentification JWT automatique avec renouvellement de token expiré"
description: "Une façon rapide et simple de tester les performances de vos appels HTTP."
cover:
  image: "img/padlock-fence.jpg"
  alt: "Cadenas argentés sur une clôture en acier vert"
  caption: "Photo par <a href=\"https://www.pexels.com/@frank-mcintyre/\">Frank McIntyre</a> sur <a href=\"https://www.pexels.com\">Pexels</a>"
published: true
tags: [Postman, Authentication, API, JavaScript]
excerpt: >-
  Vous vous êtes toujours demandé comment vous authentifier automatiquement auprès de votre API JWT. Je vais vous dire comment j'ai fait dans cet article.
---

Vous vous êtes toujours demandé comment vous authentifier automatiquement auprès de votre API JWT. Je vais vous dire comment j'ai fait dans cet article.

---

## Petite introduction

Vous ne savez peut-être pas ce qu'est Postman, alors je vais vous le décrire.
Vous utilisez probablement un IDE (comme PHPStorm, VSCode,…) pour vous aider pendant la phase de développement de votre projet avec des choses comme l'autocomplétion, l'exécution de tests, le débogage, etc.

Postman est assez similaire à un IDE mais spécialement conçu pour créer des appels API. C'est bien plus agréable à utiliser que la simple commande curl. Apprenez-en plus sur Postman en visitant leur site web https://www.postman.com/.

Qu'en est-il des JSON Web Tokens (abrégés en JWT dans le reste de cet article) ? JWT est une norme industrielle open source qui définit un moyen autonome (c'est-à-dire que les informations sont contenues dans le token) de transmettre des informations de manière sécurisée entre les parties sous forme d'objet JSON.
Dans notre cas, ils seront utilisés pour nous donner accès à une API. Apprenez-en plus sur les JSON Web Tokens en visitant leur site web https://jwt.io/.

---

## Le voyage vers ce monde magique

### Au début, était la requête manuelle
En tant que développeur web, j'ai l'habitude d'appeler des API (les miennes ou celles de tiers) qui nécessitent un JWT, et je les teste généralement avec Postman.
Pendant de nombreux mois, ou peut-être des années, appeler un point de terminaison sur ces types d'API m'a amené à appliquer manuellement le workflow suivant :

1. Obtenir un token via une requête enregistrée attachée à ma collection Postman (essentiellement m'authentifier auprès de mon API)
2. Copier la chaîne du token
3. Créer un en-tête « Authorization »
4. Coller la chaîne du token comme token « Bearer » comme valeur de mon en-tête « Authorization » (exemple d'en-tête : « Authorization:Bearer tokenCopié »)
5. Enfin, appeler mon point de terminaison

Ce workflow m'obligeait également à mettre à jour manuellement le token JWT lorsqu'il avait expiré. Avec le temps, je suis devenu un peu plus malin en utilisant les variables d'environnement de Postman pour stocker la bonne chaîne de token dans l'environnement approprié (comme avoir un JWT pour l'environnement de staging et un pour la production).

Mais il y a quelques mois, je me demandais si, aussi paresseux que je suis, il n'y avait pas une meilleure façon de faire ? J'ai aussi entendu des légendes sur certains développeurs qui appellent leurs API sans se soucier de l'authentification. Alors pourquoi pas moi ?

### Puis est venue la requête automatique

Donc, comme tout bon développeur (ou pas 😛), mon voyage a commencé sur… (vous l'avez deviné 😉 ?) Stack Overflow !

J'ai trouvé cet article là-bas, et même si ce n'était pas la bonne solution, il m'a donné une idée plus claire de l'endroit où chercher. En fait, pour être honnête, je cherchais un morceau de code que je pourrais rapidement copier-coller les yeux fermés 😅.

J'ai donc poursuivi ma quête, et j'ai trouvé l'article medium d'Utkarsha Baksh « Using Postman Pre-request Script to Automatically Set Token » qui propose un tutoriel parfait (et pas trop long) étape par étape. Il détaille comment faire une simple requête de connexion automatique avant d'appeler le point de terminaison API souhaité en utilisant un petit script de pré-requête Postman. Si vous êtes nouveau sur ce concept de « script de pré-requête », vous devriez vraiment lire cet article ou jeter un œil à la documentation de Postman.

Super plus, il y a un morceau de code ! Je l'ai donc copié/collé, suivi les étapes, adapté à mes cas d'utilisation, et ça a marché 🎊 🎉 🪩 !

Je n'y suis jamais revenu jusqu'à… ce que je perde ce script de pré-requête à cause d'une réinstallation de Postman et de l'absence de version payante 🫣 😩.

Cela nous amène à ce jour (12/12/2022 😉) où je refaisais la même routine manuelle et me souvenais de ce bon vieux temps où c'était automatique.

### Enfin, la consécration

Donc, une fois de plus, j'ai fait mon sac et je suis reparti en voyage vers ce merveilleux pays. Le voyage a été beaucoup plus rapide cette fois 😅 et j'ai trouvé un nouveau morceau de code qui semblait plus détaillé et plus respectueux du mécanisme de rafraîchissement de JWT en ne s'authentifiant pas toujours auprès de l'API quand le token est encore valide (c'est-à-dire pas expiré).

Ce code peut être trouvé ici : https://gist.github.com/Glideh/0f24b8973bb7d79ae8124fa160966df1

Le seul inconvénient que j'ai trouvé en l'utilisant directement est qu'il ne profitait pas du refresh token JWT. Je l'ai donc copié/collé et j'ai fait quelques modifications pour permettre un rafraîchissement automatique du token.

---

## Le code
Pour obtenir un tutoriel complet sur la façon de définir le code suivant comme script de pré-requête Postman, lisez l'article medium d'Utkarsha Baksh : « Using Postman Pre-request Script to Automatically Set Token »

```javascript
/**
 * fill in the blanks
 */
const TOKEN_ENV_VAR_NAME = 'token_client'
const LOGIN_URL = pm.environment.get("host") + "/api/v2/authenticate"
const LOGIN_BODY={
    "app_id": pm.environment.get("app_id"),
    "app_secret": pm.environment.get("app_secret")
}

const REFRESH_TOKEN_ENV_VAR_NAME = 'refresh_token_client'
const REFRESH_URL = pm.environment.get("host") + "/api/v2/authenticate/refresh"
const REFRESH_BODY={
    "refreshToken": pm.environment.get(REFRESH_TOKEN_ENV_VAR_NAME)
}

function isExpiredToken() {
    const jwt = pm.environment.get(TOKEN_ENV_VAR_NAME)
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    // Expiration timestamp (in seconds) is located in the `exp` key
    const millisecBeforeExpiration = (payload.exp * 1000) - (new Date()).getTime();
    if (millisecBeforeExpiration <= 0) {
        console.log("Token is expired");
        return true;
    }

    console.log(`Token is still valid ! Expiring in ${millisecBeforeExpiration / 1000} seconds`);
    return false;
}

function tokensExists() {
    const token = pm.environment.get(TOKEN_ENV_VAR_NAME)
    const refreshToken = pm.environment.get(REFRESH_TOKEN_ENV_VAR_NAME)
    if (!token) {
        console.log("Token not found");
        return false;
    }

    if (!refreshToken) {
        console.log("Refresh token not found");
        return false;
    }

    return true;
}

function login() {
    console.log("Authenticating")
    const body = JSON.stringify(LOGIN_BODY);
    const request = {
        url: LOGIN_URL,
        method: "POST",
        header: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body,
    };

    pm.sendRequest(request, (err, res) => {
        if (err || res.code !== 200) {
            console.log("Login failed:");
            console.log(err);
            console.log(res);

            throw new Error('Login failed, check postman\'s console for details')
        }
        pm.environment.set(TOKEN_ENV_VAR_NAME, res.json().token);
        console.log("Token saved");
        pm.environment.set(REFRESH_TOKEN_ENV_VAR_NAME, res.json().refreshToken);
        console.log("Refresh Token saved");
    });
}

function refresh() {
    console.log("Refreshing token")
    const body = JSON.stringify(REFRESH_BODY);
    const request = {
        url: REFRESH_URL,
        method: "POST",
        header: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body,
    };

    pm.sendRequest(request, (err, res) => {
        if (res.code === 498) {
            console.log('Refresh token has expired or is invalid')
            login()
            return
        }
        if (err || res.code !== 200) {
            console.log("Refreshing token failed:");
            console.log(err);
            console.log(res);

            throw new Error('Refreshing token failed, check postman\'s console for details')
        }
        console.log("Token refreshed");
        pm.environment.set(TOKEN_ENV_VAR_NAME, res.json().token);
    });
}

if (tokensExists()) {
    if (!isExpiredToken()) {
        return
    }

    refresh()
} else {
    login()
}
```

---

## Remerciements

Postman pour avoir produit des outils qui facilitent la vie des développeurs d'API

Stack overflow et sa communauté pour être la bouée de sauvetage des développeurs

Pierre de LESPINAY pour le Gist qui m'a inspiré ce morceau de code et l'article actuel

L'équipe SensioLabs pour leur aide et leurs relectures sur cet article
