import "./styles.css"

import { api_key } from './config.js'
import { format } from 'date-fns';

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
    console.log("[INFO] API fetch request sent.")
    
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
        console.log("[INFO] Data read from storage");
        return JSON.parse(localStorage.getItem("apiResponse"));
    }
    else {
        console.log("[INFO] API query executed");
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

    let conditionIcon = document.getElementById('today-icon')
    let iconDescription = JSONdata.currentConditions.icon;
    conditionIcon.textContent = iconDescription;

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

    let twentyFourHourData = compileTodayHourly(JSONdata);
    
    for (let i = 0;i < twentyFourHourData.length;i++) {
        let hourWeather = twentyFourHourData[i];
        processTodayHourly(hourWeather);
    }

    
    // processTodayHourly(JSONdata.days[0].hours[20]);
}

function prettyHour(dateTime) {
    return format(dateTime, 'h a')
};

function compileTodayHourly(JSONdata) {
    let day0Hours = JSONdata.days[0].hours;
    let day1Hours = JSONdata.days[1].hours;
    let twoDayHourly = day0Hours.concat(day1Hours);
    let currentDateTimeEpoch = JSONdata.currentConditions.datetimeEpoch;
    let twentyFourHoursLater = currentDateTimeEpoch + (24*60*60);

    let filteredTwoDayHourly = twoDayHourly.filter((hour) => (hour.datetimeEpoch < twentyFourHoursLater) && (hour.datetimeEpoch > currentDateTimeEpoch));

    return filteredTwoDayHourly
}

function processTodayHourly(hourData) {
    let epoch = hourData.datetimeEpoch;
    let dateTime = convertEpochToDate(epoch);
    let time = prettyHour(dateTime);

    let temp = hourData.temp;

    let icon = hourData.icon;

    let hourlyContainerBar = document.getElementById('hourly-container');
    let hourContainer = document.createElement('div');
    hourContainer.className = "hour-container"
  

    let dateContainer = document.createElement('div');
    dateContainer.textContent = time;

    let tempContainer = document.createElement('div');
    tempContainer.textContent = temp;

    let iconContainer = document.createElement('div');
    iconContainer.textContent = icon;

    hourContainer.append(dateContainer);
    hourContainer.append(iconContainer);
    hourContainer.append(tempContainer);
    hourlyContainerBar.append(hourContainer);
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