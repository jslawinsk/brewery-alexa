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

  var responseText = `Welcome to Joes Brewery!`;
  var cardText = "";
  
    const authData  = await brewService.authenticate();
    debug( `Brewery authenticate: ${authData.data.token}` );

    const brewdata  = await brewService.getSummaryData( authData.data.token );
    // debug( `Brewery getSummaryData: ${JSON.stringify( brewdata.data )}` );

    var lastId = -1;
    var lastProcess = "";
    for(var idx in brewdata.data ){
      if( lastId != brewdata.data[ idx ].batch.id ){
        responseText = responseText + "<break strength='x-strong'/>"
        responseText = responseText + " Batch, " + brewdata.data[ idx ].batch.name
          + ", Style, " + brewdata.data[ idx ].batch.style.name;
        cardText = cardText + "\n\nBatch: " + brewdata.data[ idx ].batch.name 
          + "\n  Style:  " + brewdata.data[ idx ].batch.style.name + "\n";
        lastProcess = "";
      }
      if( brewdata.data[ idx ].process.voiceAssist == true ){
        if( lastProcess != brewdata.data[ idx ].process.code ){
          responseText = responseText + ", " + brewdata.data[ idx ].process.name;
          cardText = cardText + "  Process: " + brewdata.data[ idx ].process.name;
        }
      }
      if( brewdata.data[ idx ].process.voiceAssist == true && brewdata.data[ idx ].type.voiceAssist == true ){
        responseText = responseText + ", " + brewdata.data[ idx ].type.name;
        cardText = cardText + "\n    " + brewdata.data[ idx ].type.name + ": ";
        if( brewdata.data[ idx ].type.code == "TMP" ){
          responseText = responseText+ ", " + brewdata.data[ idx ].valueNumber + " degrees.";
          cardText = cardText + brewdata.data[ idx ].valueNumber + " degrees.";
        }
        else if( brewdata.data[ idx ].type.code == "PH" ){
          responseText = responseText+ ", " + brewdata.data[ idx ].valueNumber;
          cardText = cardText + brewdata.data[ idx ].valueNumber;
        }
        else{
          if( brewdata.data[ idx ].valueText == "" ){
            responseText = responseText+ ", " + brewdata.data[ idx ].valueNumber;
            cardText = cardText + brewdata.data[ idx ].valueNumber;
          }
          else{
            responseText = responseText+ ", " + brewdata.data[ idx ].valueText;
            cardText = cardText + brewdata.data[ idx ].valueText;
          }
        }
        responseText = responseText + ", On <say-as interpret-as='date'>????" + brewdata.data[ idx ].measurementTime.substring( 5, 7 ) + brewdata.data[ idx ].measurementTime.substring( 8, 10 ) + "</say-as>";
        responseText = responseText + " at <say-as interpret-as='time'>" + brewdata.data[ idx ].measurementTime.substring( 11, 16 ) + "</say-as>";
        cardText = cardText + " " + brewdata.data[ idx ].measurementTime;
      }
      lastId = brewdata.data[ idx ].batch.id;
      lastProcess = brewdata.data[ idx ].process.code;
    }
    
  debug( responseText );
  debug( "card: " + cardText );
  response.say( responseText );
  response.response.response.card = ( { 
    type: "Simple",
    title: "Joe's Brewery Summary", // this is not required for type Simple or Standard
    content: cardText
  });
  debug( `response: ${JSON.stringify(response)}` );
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

alexaApp.intent("batchIdIntent", {
    "utterances": [
      "batch ids", "tellme batch ids", "for batch ids",
      "batch numbers", "tellme batch numbers", "for batch numbers"
    ]
  },
  async function(request, response) {
    debug( 'alexaApp.batchIdIntent' );
    var responseText = `Active Batch Ids,`;
    var cardText = "";
    
    const authData  = await brewService.authenticate();
    debug( `Brewery authenticate: ${authData.data.token}` );
  
    const brewdata  = await brewService.getSummaryData( authData.data.token );
  
    var lastId = -1;
    for(var idx in brewdata.data ){
      if( lastId != brewdata.data[ idx ].batch.id ){
        responseText = responseText + "<break strength='x-strong'/>"
        responseText = responseText + " Batch, " + brewdata.data[ idx ].batch.name
          + ", <say-as interpret-as='spell-out'>ID</say-as>, " + brewdata.data[ idx ].batch.id;
        cardText = cardText + "\n\nBatch: " + brewdata.data[ idx ].batch.name 
          + "\n  ID:  " + brewdata.data[ idx ].batch.id;
      }
      lastId = brewdata.data[ idx ].batch.id;
    }
      
    debug( responseText );
    debug( "card: " + cardText );
    response.say( responseText );
    response.response.response.card = ( { 
      type: "Simple",
      title: "Joe's Brewery Batch Ids", // this is not required for type Simple or Standard
      content: cardText
    });
    debug( `response: ${JSON.stringify(response)}` );
  
  }
);

app.listen(PORT, () => {
  debug(`listening on port ${PORT}`);
});
