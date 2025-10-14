import "./styles.css"

import { api_key } from './config.js'


let location = '68521'

let url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/?key=${api_key}`

// fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/?key=${api_key}`)
//     .then(function(response) {
//         return response.json();
//     })
//     .then(function(response) {
//         console.log(response);
//     });

async function apiRequest(url) {
    let response = await fetch(url)
    console.log("API fetch request sent.")
    
    if (response.ok) {
        let responseJSON = await response.json();

        return responseJSON;
    };
};

function saveJSON(json) {
    localStorage.apiResponse = JSON.stringify(json);
}

function loadJSON(url) {
    if (localStorage.apiResponse) {
        console.log("Data read from storage");
        return JSON.parse(localStorage.getItem("apiResponse"));
    }
    else {
        console.log("API query executed");
        return apiRequest(url);
    };
};

class weatherRequest {
    constructor(location, date1='', date2='', dev = true) {
        this.location = location;
        this.date1 = date1;
        this.date2 = date2;
        this.dev = dev;
    };

    createURL() {
        let parameterArray = [this.location, this.date1, this.date2];
        let parameterString = parameterArray.filter(Boolean).join("/");
        return `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${parameterString}/?key=${api_key}`
    }

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
test.createURL();