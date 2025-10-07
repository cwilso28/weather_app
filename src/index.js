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

async function apiRequest(url, save = true) {
    let response = await fetch(url)
    console.log("API fetch request sent.")
    
    if (response.ok) {
        let responseJSON = await response.json();

        if (save) {
            localStorage.apiResponse = JSON.stringify(responseJSON);
        };

        return responseJSON;
    };
};

function loadJSON() {
    if (localStorage.apiResponse) {
        console.log("Data read from storage");
        return JSON.parse(localStorage.getItem("apiResponse"));
    }
    else {
        console.log("API query executed");
        return apiRequest(url);
    };
};

let response = loadJSON();
console.log(response);

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

// let test = new weatherRequest(location);
// test.emptyVariableCheck();