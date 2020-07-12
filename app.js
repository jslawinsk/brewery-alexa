const express = require("express");
const debug = require('debug')('app');
const alexa = require("alexa-app");

const PORT = process.env.PORT || 8080;
const app = express();

const alexaApp = new alexa.app("test");

alexaApp.express({
  expressApp: app,
  //router: express.Router(),

  // verifies requests come from amazon alexa. Must be enabled for production.
  // You can disable this if you're running a dev environment and want to POST
  // things to test behavior. enabled by default.
  checkCert: false,

  // sets up a GET route when set to true. This is handy for testing in
  // development, but not recommended for production. disabled by default
  debug: true
});
// now POST calls to /test in express will be handled by the app.request() function

app.use((req, res, next) => {
  debug('my middleware');
  next();
});

app.set('views', './src/views');
app.set("view engine", "ejs");

alexaApp.launch(function(request, response) {
  response.say("Welcome to Joes Brewery! Curennt process Joe's Irish stout Fermentation tem[pratiure 69.5 degress");
});

alexaApp.dictionary = { "names": ["matt", "joe", "bob", "bill", "mary", "jane", "dawn"] };

alexaApp.intent("nameIntent", {
    "slots": { "NAME": "LITERAL" },
    "utterances": [
      "my {name is|name's} {names|NAME}", "set my name to {names|NAME}"
    ]
  },
  function(request, response) {
    response.say("Brewery Success for name intent!");
  }
);

app.listen(PORT, () => console.log("Listening on port " + PORT + "."));