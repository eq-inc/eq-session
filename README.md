# eq-session

Session module for Eq applications.
Inspired by [ameba/proteus-session](https://github.com/ameba-proteus/proteus-session)

## Example

### Middleware

```js
const express = require('express'),
    session = require('eq-session'),
    app = express();

app.use(session.middleware());
```

### Create ticket

```js
const session = require('eq-session'),
    id = 'USER_ID';

session.createTicket(id, function (error, ticket) {
    if (error) {
        next(error);
    }
    
    console.log(ticket);
    
    next();
});
```


### Get ID by ticket

```js
const session = require('eq-session'),
    ticket = req.get('X-Eq-Session');

session.getId(ticket, function (error, id) {
    if (error) {
        next(error);
    }
    
    console.log(id);
    
    next();
});
```


### Set session data

```js
const session = require('eq-session'),
    ticket = req.get('X-Eq-Session');

session.getId(ticket, function (error, id) {
    if (error) {
        return next(error);
    }
    
    const data = {
        key: 'value'
    };
    session.setSession(id, data, function (error) {
        if (error) {
            next(error);
        }
        
        next();
    });
});
```


### Get session data

#### By ID

```js
const session = require('eq-session'),
    ticket = req.get('X-Eq-Session');

session.getId(ticket, function (error, id) {
    if (error) {
        return next(error);
    }
    
    session.getSession(id, function (error, result) {
        if (error) {
            next(error);
        }
        
        console.log(result);
        
        next();
    });
});
```

#### By ticket

```js
const session = require('eq-session'),
    ticket = req.get('X-Eq-Session');

session.getTicketSession(ticket, function (error, result) {
    if (error) {
        return done(error);
    }
    
    console.log(result);
    
    next();
});
```
