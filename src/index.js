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
    constructor({location, date1='', date2='', dev = false}) {
        this.location = location;
        this.date1 = date1;
        this.date2 = date2;
        this.dev = dev;
        this.url = this.createURL();
    };

    createURL() {
        let parameterArray = [this.location, this.date1, this.date2];
        let parameterString = parameterArray.filter(Boolean).join("/");
        let url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${parameterString}?key=${api_key}`;
        console.log(url);
        return url;
    };

    requestData() {
        let weatherData = loadJSON(this.url);
        localStorage.clear();

        if (this.dev && !localStorage.apiResponse) {
            saveJSON(weatherData);
        };

        return weatherData;
    }

}
let devRequestArray = {location: location,
                       date1: '',
                       date2: '',
                       dev: true
                       };

let test = new weatherRequest(devRequestArray);
console.log(test.requestData());

// let test2 = apiRequest(url);
// console.log(test2);