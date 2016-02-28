# Partula

Partula is a library for generating character names.

## Getting Started

1. Set up database (see SideCar6/partula-data)
2. Install dependencies
  - `$ npm install`
3. Create `config.json` (see example below)
4. Require and call function (see example below)

### `config.json`

```json
{
  "mysql": {
    "host": "localhost",
    "user": "username",
    "password": "password",
    "database": "partula"
  }
}
```

### Example Program

```javascript
'use strict';

var partula = require('./index');

// All instances of {g} will be replaced with a given name, {s} will be replace
// with a surname, and the config object is optional
generator('{g} {g} {s}', {
  popularity: { // defaults to { min: 97, max: 100 }
    min: 97, // defaults to 0
    max: 100 // defaults to 100
  },
  limit: 1, // defaults to 1
  gender: 'F', // defaults to random
  year: { // defaults to { min: 2014, max: 2014 }
    min: 2010, // defaults to max - 10
    max: 2014 // defaults to 2014
  }
}, function (err, names) {
  console.log(names.join('\n'));
  process.exit(0);
});
```
