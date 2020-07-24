const express = require("express");
const debug = require('debug')('app');
const alexa = require("alexa-app");
const brewService = require('./src/services/breweryService');


const PORT = process.env.PORT || 8090;
const app = express();

const alexaApp = new alexa.app("status");

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
// now POST calls to /status in express will be handled by the app.request() function

app.use((req, res, next) => {
  debug('my middleware');
  next();
});

app.set('views', './src/views');
app.set("view engine", "ejs");


alexaApp.launch( async function(request, response) {
  debug( 'alexaApp.launch' );

  var responseText = "Welcome to Joes Brewery!";
  
    const authData  = await brewService.authenticate();
    debug( `Brewery authenticate: ${authData.data.token}` );

    const brewdata  = await brewService.getSummaryData( authData.data.token );
    debug( `Brewery getSummaryData: ${JSON.stringify( brewdata.data )}` );

    var lastId = -1;
    var lastProcess = "";
    for(var idx in brewdata.data ){
      debug( "Last ID: " + lastId + " ID: " + brewdata.data[ idx ].batch.id );
      if( lastId != brewdata.data[ idx ].batch.id ){
        responseText = responseText + " Batch, " + brewdata.data[ idx ].batch.name
          + " Style " + brewdata.data[ idx ].batch.style.name;
      }
      if( lastProcess != brewdata.data[ idx ].process.code ){
        responseText = responseText + ", " + brewdata.data[ idx ].process.name;
      }
      responseText = responseText + " " + brewdata.data[ idx ].type.name;
      if( brewdata.data[ idx ].type.code == "TMP" ){
        responseText = responseText+ " " + brewdata.data[ idx ].valueNumber + " degrees.";
      }
      else{
        if( brewdata.data[ idx ].valueText == "" ){
          responseText = responseText+ " " + brewdata.data[ idx ].valueNumber;
        }
        else{
          responseText = responseText+ " " + brewdata.data[ idx ].valueText;
        }
      }
      responseText = responseText + " Measurement Time " + brewdata.data[ idx ].measurementTime;
      lastId = brewdata.data[ idx ].batch.id;
      lastProcess = brewdata.data[ idx ].process.code;
    }
  debug( responseText );
  response.say( responseText );
});

alexaApp.dictionary = { "names": ["matt", "joe", "bob", "bill", "mary", "jane", "dawn"] };

alexaApp.intent("nameIntent", {
    "slots": { "NAME": "LITERAL" },
    "utterances": [
      "my {name is|name's} {names|NAME}", "set my name to {names|NAME}"
    ]
  },
  function(request, response) {
    debug( 'alexaApp.intent' );
    response.say("Brewery Success for name intent!");
  }
);

app.listen(PORT, () => {
  debug(`listening on port ${PORT}`);
});
