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


function apiRequest(url) {
    fetch(url)
        .then(function(response) {
            return response.json();
        });
}

class weatherRequest {
    constructor(location, date1='', date2='') {
        this.location = location;
        this.date1 = date1;
        this.date2 = date2;
    };

    emptyVariableCheck() {
        if (this.date1) {
            console.log("Date1 exists");
        }

        else {
            console.log("Date1 does not exist");
        }
    
};
}

let test = new weatherRequest(location);
test.emptyVariableCheck();