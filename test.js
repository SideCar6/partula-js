'use strict';

var generator = require('./index');

var start = new Date();
generator('{g} {g} {s}', {
  popularity: {
    min: 97,
    max: 100
  },
  limit: 5,
  gender: 'F',
  year: {
    min: 2014,
    max: 2014
  }
}, function (err, names) {
  console.log('Duration: ' + (new Date() - start) + 'ms');
  console.log(names.join('\n'));
  process.exit(0);
});
