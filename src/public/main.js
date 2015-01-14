/**
 * Require.js config file.
 *
 * As you add new libraries via Bower (BOWER_JS_LIBS), create path refs for them for easy includes.
 */
require.config({

  baseUrl: "/app/",

  paths: {
    "jquery"    : "../lib/jquery",
    "bootstrap" : "../lib/bootstrap",
    "lodash"    : "../lib/lodash",
    "underscore": "../lib/lodash",
    "d3"        : "../lib/d3"
  },

  shim: {
    bootstrap: {
      deps: ['jquery']
    },
    d3: "d3"
  }
});


requirejs(['index']);
