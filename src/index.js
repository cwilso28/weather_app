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
    let formattedDate = prettyDay(date);
    dateTimeOut.textContent = formattedDate;

    let twentyFourHourData = compileTodayHourly(JSONdata);
    
    for (let i = 0;i < twentyFourHourData.length;i++) {
        let hourWeather = twentyFourHourData[i];
        processTodayHourly(hourWeather);
    }

    for (let i = 0;i <= 7; i++) {
        processForecast(JSONdata.days[i]);
    }
    
}

function prettyHour(dateTime) {
    return format(dateTime, 'h a')
};

function prettyHourLong(dateTime) {
    return format(dateTime, 'h:mm a')
}

function prettyDay(dateTime) {
    return format(dateTime, "EEEE',' MMMM d',' yyyy")
}

function prettyDateAndTime(dateTime) {
    return format(dateTime, "EEEE',' MMMM d',' yyyy h':'m a")
}

function makeEventIntoHourFormat(event, epoch, icon){
    return {status: event, datetimeEpoch: epoch, icon:icon}
}

function compare(a, b) {
    if (a.datetimeEpoch < b.datetimeEpoch) {
        return -1;
    }
    if (a.datetimeEpoch > b.datetimeEpoch) {
        return 1;
    }
    return 0;
}

function compileTodayHourly(JSONdata) {
    let day0Hours = JSONdata.days[0].hours;
    let day1Hours = JSONdata.days[1].hours;
    let twoDayHourly = day0Hours.concat(day1Hours);

    let day0SunriseDesc = 'Sunrise';
    let day0SunriseIcon = 'sunrise';
    let day0SunriseEpoch = JSONdata.days[0].sunriseEpoch;
    let day0SunriseHour = makeEventIntoHourFormat(day0SunriseDesc, day0SunriseEpoch, day0SunriseIcon);

    let day0SunsetDesc = 'Sunset';
    let day0SunsetIcon = 'sunset';
    let day0SunsetEpoch = JSONdata.days[0].sunsetEpoch;
    let day0SunsetHour = makeEventIntoHourFormat(day0SunsetDesc, day0SunsetEpoch, day0SunsetIcon);

    let day1SunriseDesc = 'Sunrise';
    let day1SunriseIcon = 'sunrise';
    let day1SunriseEpoch = JSONdata.days[1].sunriseEpoch;
    let day1SunriseHour = makeEventIntoHourFormat(day1SunriseDesc, day1SunriseEpoch, day1SunriseIcon);

    let day1SunsetDesc = 'Sunset';
    let day1SunsetIcon = 'sunset';
    let day1SunsetEpoch = JSONdata.days[1].sunsetEpoch;
    let day1SunsetHour = makeEventIntoHourFormat(day1SunsetDesc, day1SunsetEpoch, day1SunsetIcon);
    let twoDayHourlySunriseSunset = twoDayHourly.concat(day0SunriseHour, day0SunsetHour, day1SunriseHour, day1SunsetHour);

    let currentDateTimeEpoch = JSONdata.currentConditions.datetimeEpoch;
    let twentyFourHoursLater = currentDateTimeEpoch + (24*60*60);

    let filteredTwoDayHourly = twoDayHourlySunriseSunset.filter((hour) => (hour.datetimeEpoch < twentyFourHoursLater) && (hour.datetimeEpoch > currentDateTimeEpoch));
    filteredTwoDayHourly.sort( compare );

    return filteredTwoDayHourly
}

function processTodayHourly(hourData) {
    let epoch = hourData.datetimeEpoch;
    let dateTime = convertEpochToDate(epoch);
    let time = prettyHour(dateTime);

    let icon = hourData.icon;

    let hourlyContainerBar = document.getElementById('hourly-container');
    let hourContainer = document.createElement('div');
    hourContainer.className = "hour-container"
  

    let dateContainer = document.createElement('div');
    dateContainer.textContent = time;

    let tempContainer = document.createElement('div');
    if (hourData.temp) {
        let temp = hourData.temp;
        tempContainer.textContent = `${temp} ${String.fromCharCode(176)}F`;
    }

    else{
        let time = prettyHourLong(dateTime);
        dateContainer.textContent = time;

        let temp = hourData.status;
        tempContainer.textContent = temp;
    }
    
    

    let iconContainer = document.createElement('div');
    iconContainer.textContent = icon;

    hourContainer.append(dateContainer);
    hourContainer.append(iconContainer);
    hourContainer.append(tempContainer);
    hourlyContainerBar.append(hourContainer);
}



function processForecast(day) {
    let forecastContainer = document.getElementById('forecast-container');

    let dailyForecastContainer = document.createElement('div');
    dailyForecastContainer.className = 'daily-forecast-container';

    let forecastDateOut = document.createElement('div');
    let dateTime = convertEpochToDate(day.datetimeEpoch);
    let formattedDateTime = prettyDay(dateTime);
    forecastDateOut.textContent = formattedDateTime;

    let forecastInfoContainer = document.createElement('div');
    forecastInfoContainer.className = 'forecast-info';

    let forecastIconContainer = document.createElement('div');
    forecastIconContainer.className = 'forecast-icon';
    let forecastIcon = day.icon;
    forecastIconContainer.textContent = forecastIcon;
    
    let forecastTempContainer = document.createElement('div');
    forecastTempContainer.className = 'forecast-temps';

    let forecastHiOut = document.createElement('div');
    let forecastHi = day.tempmax;
    forecastHiOut.textContent = `Hi: ${forecastHi} ${String.fromCharCode(176)}F`;

    let forecastLoOut = document.createElement('div');
    let forecastLo = day.tempmin;
    forecastLoOut.textContent = `Lo: ${forecastLo} ${String.fromCharCode(176)}F`;

    forecastTempContainer.append(forecastHiOut);
    forecastTempContainer.append(forecastLoOut);

    forecastInfoContainer.append(forecastIconContainer);
    forecastInfoContainer.append(forecastTempContainer);

    dailyForecastContainer.append(forecastDateOut);
    dailyForecastContainer.append(forecastInfoContainer);
    
    forecastContainer.append(dailyForecastContainer);
}

function processAdditionalInfo(JSONdata) {
    pass
};

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