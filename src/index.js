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
        this.data = this.requestData();
    };

    createURL() {
        let parameterArray = [this.location, this.date1, this.date2];
        let parameterString = parameterArray.filter(Boolean).join("/");
        let url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${parameterString}?key=${api_key}`;
        return url;
    };

    async requestData() {
        let weatherData = await loadJSON(this.url);
        localStorage.clear();

        if (this.dev && !localStorage.apiResponse) {
            saveJSON(weatherData);
        };

        return weatherData;
    }

}

function convertEpochToDate(epochTime) {
    return new Date(epochTime * 1000);
}

function processData(JSONdata) {
    let location = JSONdata.resolvedAddress;
    let locationOut = document.getElementById('location-container');
    locationOut.textContent = location;

    let tempPrintout = document.getElementById('today-temp');
    let temp = JSONdata.currentConditions.temp;
    tempPrintout.textContent = `Temp: ${temp} ${String.fromCharCode(176)}F`;

    let hiPrintOut = document.getElementById('today-hi');
    let hi = JSONdata.days[0].tempmax;
    hiPrintOut.textContent = `Hi: ${hi} ${String.fromCharCode(176)}F`;

    let loPrintOut = document.getElementById('today-lo');
    let lo = JSONdata.days[0].tempmin;
    loPrintOut.textContent = `Lo: ${lo} ${String.fromCharCode(176)}F`;

    let humidity = JSONdata.currentConditions.humidity
    
    let dateTimeOut = document.getElementById('dateTime-container')
    let date = convertEpochToDate(JSONdata.currentConditions.datetimeEpoch);
    dateTimeOut.textContent = date;

}

let devRequestArray = {location: location,
                       date1: '',
                       date2: '',
                       dev: true
                       };

async function main() {
    let request = new weatherRequest(devRequestArray);
    let requestData = await request.data;
    processData(requestData);
}

main();