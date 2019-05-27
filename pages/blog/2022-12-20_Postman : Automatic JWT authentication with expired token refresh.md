---
tags: [Postman, JWT, Authentication, API, JavaScript]
---
You’ve always wondered how to get automatically authenticated toward your JWT API. I’ll tell you how I achieved this in this article.
<!-- break -->

---

## Short Introduction

You may not know what is Postman, so I'll describe it to you.
You may use any IDE (like PHPStorm, VSCode,…) to help you during the development phase of your project with things like autocompletion, test runs, debugging, and so on.

Postman is quite the same as an IDE but designed especially to create APIs calls. It's a lot more pleasant to use than the plain old curl command. Learn more about Postman by visiting their website https://www.postman.com/.

What about JSON Web Tokens (shortened to JWT in the rest of this article)? JWT is an open-source industry standard that defines a self-contained (i.e. information are held by the token) way for securely transmitting information between parties as a JSON object.
In our case, they'll be used to give us access to an API. Learn more about JSON Web Tokens by visiting their website https://jwt.io/.

---

## The journey to this magical world

### In the begining, was the manual request
As a Web Developer, I'm used to call APIs (mine or third party APIs) that requires a JWT, and I usually test them using Postman.
For many months, or maybe years, calling an endpoint on those kinds of APIs led me to manually apply the following workflow:

1. Get a token through a saved request attached to my Postman collection (basically authenticating toward my API)
2. Copy the token string
3. Create an "Authorization" header
4. Paste the token string as a "Bearer" token as value for my "Authorization" header (header example: "Authorization:Bearer pastedTokenString")
5. Finally, request my endpoint

This workflow also had me to update manually the JWT token when it has expired. By the time, I got a bit smarter by using Postman's environment variables in order to have the right token string stored in the proper environment (like having a JWT for the staging environment and one for the production).

But some months ago I was wondering if, as lazy as I am, there was a better way to make it? I also heard legends about some dev who calls his API calls without worrying about Authentication. So why not me?

### Then was the automatic request

So like any good (or not 😛) developer, my journey has started on… (already guessed it 😉?) Stack Overflow!

I found this article there, and even if it was not the right solution, it gave me a clearer idea of where to search. In fact, and to be honest, I was searching for a piece of code that I could quickly copy and paste eyes closed 😅.

So I continued my quest, and I found Utkarsha Baksh's medium article "Using Postman Pre-request Script to Automatically Set Token" which has a perfect (and not too long) step by step tutorial. It details how to make a simple automatic login request before calling the desired API endpoint using small Postman's pre-request script. If you are new to that "pre-request script" concept, really shall read this article or take a look at Postman's documentation.

Amazing plus, there's a piece of code! So I copy/pasted it, followed the steps, adapted it to my use cases, and it worked 🎊 🎉 🪩!

I never got back on it until… I lost this pre-request script because of a Postman reinstallation and not having a paid version 🫣 😩.

This leads us to this day (2022/12/12 😉) where I was again doing the same manual routine and remembered that good old time when it was automatic.

### Finally was the consecration

So another time, I packed my bag and got again on that journey to that wonderful land. The trip was a lot faster that time 😅 and I found a new piece of code that looked more detailed and more respectful of JWT's refresh mechanism by not always authenticating toward the API when the token is still valid (I mean not expired).

This code could be found there: https://gist.github.com/Glideh/0f24b8973bb7d79ae8124fa160966df1

The only cons I've found using it directly is that it was not taking advantage of the JWT's refresh token. So I copy/pasted it and made some changes to allow an automatic refresh of the token.

---

## The code
To get a full tutorial on how to define a the following code as a Postman's pre-request script read Utkarsha Baksh's medium article: "Using Postman Pre-request Script to Automatically Set Token"

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

## Thanks

Postman for producing tools that ease API developer's life

Stack overflow and his community for being the developer's life-buoy

Pierre de LESPINAY for the Gist that inspired me this piece of code and the current article

SensioLabs' Team for their help and their reviews on this article
