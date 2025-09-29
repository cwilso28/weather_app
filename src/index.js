import "./styles.css"

import { api_key } from './config.js'

let location = '68521'

fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/?key=${api_key}`)
    .then(function(response) {
        return response.json();
    })
    .then(function(response) {
        console.log(response);
    });