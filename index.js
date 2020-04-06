// Allows you to precompile ES6 syntax
require('@babel/register')({
  plugins: ['dynamic-import-node'],
});

// Get environment variables.
require('dotenv').config();
// Run server
require('./server');
