
const axios = require('axios');
const debug = require('debug')('app:breweryService');

const apiurl = process.env.apiurl || "http://localhost:8080/api/";
const apiuser = process.env.apiuser || "API";
const apipassword = process.env.apipassword || "api";


function breweryService() {

  
  function authenticate( ) {
    return new Promise((resolve, reject) => {
      // axios.post('https://formcarry.com/s/YourFormID', {name: 'Alex', surname: 'Moran', email: 'alexmoran@bms.edu'}, {headers: {'Accept': 'application/json'}})
      axios.post(`${apiurl}authorize?user=${apiuser}&password=${apipassword}` )
        .then((response) => {
              debug( `authenticate response: ${response.data.token}`);
              resolve(response);
        })
        .catch((error) => {
          debug( `authenticate error: ${error}`);
          reject(error);
        });
    });
  }

  function getSummaryData( token ) {
    return new Promise((resolve, reject) => {
      axios.get(`${apiurl}summary`, {headers: {'Authorization': token }})
        .then((response) => {
              debug( `getSummaryData response: ${response.data}`);
              resolve(response);
        })
        .catch((error) => {
          debug( `getSummaryData error: ${error}`);
          reject(error);
        });
    });
  }


  return { authenticate, getSummaryData };
}

module.exports = breweryService();
