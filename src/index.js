import "./styles.css"

import { api_key } from './config.js'
import { format } from 'date-fns';
// import { write } from "fs";

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

function processData(JSONdata, metric = false) {
    let location = JSONdata.resolvedAddress;
    let locationOut = document.getElementById('location-container');
    locationOut.textContent = location;

    let conditionIcon = document.getElementById('today-icon')
    let iconDescription = JSONdata.currentConditions.icon;
    conditionIcon.textContent = iconDescription;

    let tempPrintout = document.getElementById('today-temp');
    let temp = JSONdata.currentConditions.temp;
    tempPrintout.textContent = `Temp: ${tempLabeler(temp, metric)}`;

    let hiPrintOut = document.getElementById('today-hi');
    let hi = JSONdata.days[0].tempmax;
    hiPrintOut.textContent = `Hi: ${tempLabeler(hi, metric)}`;

    let loPrintOut = document.getElementById('today-lo');
    let lo = JSONdata.days[0].tempmin;
    loPrintOut.textContent = `Lo: ${tempLabeler(lo, metric)}`;

    let humidity = JSONdata.currentConditions.humidity
    
    let dateTimeOut = document.getElementById('dateTime-container')
    let date = convertEpochToDate(JSONdata.currentConditions.datetimeEpoch);
    let formattedDate = prettyDay(date);
    dateTimeOut.textContent = formattedDate;

    let twentyFourHourData = compileTodayHourly(JSONdata);
    
    for (let i = 0;i < twentyFourHourData.length;i++) {
        let hourWeather = twentyFourHourData[i];
        processTodayHourly(hourWeather, metric);
    }

    for (let i = 0;i <= 7; i++) {
        processForecast(JSONdata.days[i], i, metric);
    }
    createAdditionalInfoContainers();
    todayAdditionalInfo(JSONdata, metric);    
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

function processTodayHourly(hourData, metric = false) {
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
        tempContainer.textContent = `${tempLabeler(temp, metric)}`;
    }

    else{
        let time = sunriseSunsetFormat(epoch);
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



function processForecast(day, index, metric=false) {
    let forecastContainer = document.getElementById('forecast-container');

    let dailyForecastContainer = document.createElement('div');
    dailyForecastContainer.className = 'daily-forecast-container';
    dailyForecastContainer.id = `forecast-${index}`;

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
    forecastHiOut.textContent = `Hi: ${tempLabeler(forecastHi, metric)}`;

    let forecastLoOut = document.createElement('div');
    let forecastLo = day.tempmin;
    forecastLoOut.textContent = `Lo: ${tempLabeler(forecastLo, metric)}`;

    forecastTempContainer.append(forecastHiOut);
    forecastTempContainer.append(forecastLoOut);

    forecastInfoContainer.append(forecastIconContainer);
    forecastInfoContainer.append(forecastTempContainer);

    dailyForecastContainer.append(forecastDateOut);
    dailyForecastContainer.append(forecastInfoContainer);
    
    forecastContainer.append(dailyForecastContainer);
}

function tempLabeler(temp, metric = false) {
    let labeledTemp = '';
    
    if (metric) {
        let celsius = convertToCelsius(temp).toFixed(1);
        labeledTemp = `${celsius} ${String.fromCharCode(176)}C`
    }
    else {
        labeledTemp = `${temp} ${String.fromCharCode(176)}F`
    }

    return labeledTemp
};

function convertToCelsius(fahrenheit) {
    let celsius = (fahrenheit - 32) * (5/9);
    return celsius
}

function createAndWriteDiv(text) {
    let container = document.createElement('div');
    container.textContent = text;
    return container
}

function sunriseSunsetFormat(epoch) {
    let eventDateTime = convertEpochToDate(epoch);
    let eventPrettyTime = prettyHourLong(eventDateTime);
    return eventPrettyTime
}

function writeTextListToDiv(list, container) {
    for (let i=0; i < list.length; i++) {
        let div = createAndWriteDiv(list[i]);
        container.append(div);
    };
}

function findWindMax(day) {
    let windHourly = [];
    let hours = day.hours;

    for (let i=0;i<hours.length; i++) {
        windHourly.push(hours[i].windspeed);
        
    }
    let windMax = Math.max(...windHourly);
    return windMax;
}

function findWindMin(day) {
    let windHourly = [];
    let hours = day.hours;

    for (let i=0;i<hours.length;i++) {
        windHourly.push(hours[i].windspeed);
    }
    // console.log(windHourly);
    let windMin = Math.min(...windHourly);

    return windMin;
}

function findGustMax(day) {
    let gustHourly = [];
    let hours = day.hours;

    for (let i=0;i<hours.length; i++) {
        gustHourly.push(hours[i].windgust);
        
    }
    let gustMax = Math.max(...gustHourly);
    return gustMax;
}

function createAdditionalInfoContainers() {
    let detailsContainer = document.getElementById('details-container');

    let headerContainer = document.createElement('div');
    headerContainer.id = 'additional-info-header';

    let dateContainer = document.createElement('div');
    dateContainer.id = 'additional-header-date-container';

    let sunriseContainer = document.createElement('div');
    sunriseContainer.id = 'additional-header-sunrise-container';

    let sunsetContainer = document.createElement('div');
    sunsetContainer.id = 'additional-header-sunset-container';

    headerContainer.append(dateContainer);
    headerContainer.append(sunriseContainer);
    headerContainer.append(sunsetContainer);

    
    let dataContainer = document.createElement('div');
    dataContainer.id = 'additional-data-container';

    let tempContainer = document.createElement('div');
    tempContainer.className = 'additional-info';
    tempContainer.id = 'additional-data-temp-container';

    let windContainer = document.createElement('div');
    windContainer.className = 'additional-info';
    windContainer.id = 'additional-data-wind-container';

    let precipContainer = document.createElement('div');
    precipContainer.className = 'additional-info';
    precipContainer.id = 'additional-data-precip-container';

    let otherContainer = document.createElement('div');
    otherContainer.className = 'additional-info';
    otherContainer.id = 'additional-data-other-container';
    
    dataContainer.append(tempContainer);
    dataContainer.append(windContainer);
    dataContainer.append(precipContainer);
    dataContainer.append(otherContainer);

    detailsContainer.append(headerContainer);
    detailsContainer.append(dataContainer);
}

function clearAdditionalDivs() {
    let detailsContainer = document.getElementById('details-container');
    detailsContainer.textContent = '';
}

function todayAdditionalInfo(JSONdata, metric = false) {
    let currentConditions = JSONdata.currentConditions;
    
    // Header
    let dateContainer = document.getElementById('additional-header-date-container');
    let dateText = 'Today';
    dateContainer.textContent = dateText;

    let sunriseContainer = document.getElementById('additional-header-sunrise-container');
    let sunrise = currentConditions.sunriseEpoch;
    let sunriseTimePretty = sunriseSunsetFormat(sunrise);
    let sunriseText = `Sunrise: ${sunriseTimePretty}`;
    sunriseContainer.textContent = sunriseText;

    let sunsetContainer = document.getElementById('additional-header-sunset-container')
    let sunset = currentConditions.sunsetEpoch;
    let sunsetTimePretty = sunriseSunsetFormat(sunset);
    let sunsetText = `Sunset: ${sunsetTimePretty}`;
    sunsetContainer.textContent = sunsetText;

    // Temperature and Humidity Block
    let tempContainer = document.getElementById('additional-data-temp-container');

    let tempList = [];

    let tempText = `Current Temp: ${tempLabeler(currentConditions.temp, metric)}`;
    tempList.push(tempText);

    let feelsLikeTempText = `Feels like: ${tempLabeler(currentConditions.feelslike, metric)}`;
    tempList.push(feelsLikeTempText);

    let humidityText = `Humidity: ${currentConditions.humidity}%`;
    tempList.push(humidityText);

    writeTextListToDiv(tempList, tempContainer);

    // Wind Block
    let windContainer = document.getElementById('additional-data-wind-container');
    
    let windList = [];

    let windSpeedText = `Wind Speed: ${currentConditions.windspeed} mph`;
    windList.push(windSpeedText);

    let windDirText = `Wind Direction: ${currentConditions.winddir}`;
    windList.push(windDirText);

    let windGustText = `Wind Gusts: ${currentConditions.windgust} mph`;
    windList.push(windGustText);

    writeTextListToDiv(windList, windContainer);

    // Precipitation Block
    let precipContainer = document.getElementById('additional-data-precip-container');

    let precipList = [];

    let precipProbabilityText = `Precipitation Probability: ${currentConditions.precipprob}%`
    precipList.push(precipProbabilityText);

    let precipType = '';
    if (currentConditions.preciptype) {
        precipType = currentConditions.preciptype;
    }
    else {
        precipType = 'None';
    }
    let precipTypeText = `Precipitation Type: ${precipType}`;
    precipList.push(precipTypeText);

    writeTextListToDiv(precipList, precipContainer);

    // Other block
    let otherContainer = document.getElementById('additional-data-other-container');

    let otherList = [];

    let UVIndexText = `UV Index: ${currentConditions.uvindex}`;
    otherList.push(UVIndexText);

    let dewPointText = `Dew Point: ${tempLabeler(currentConditions.dew, metric)}`
    otherList.push(dewPointText);
    
    let pressureText = `Pressure: ${currentConditions.pressure} mb`;
    otherList.push(pressureText);

    let visibilityText = `Visibility: ${currentConditions.visibility} mi`;
    otherList.push(visibilityText);

    writeTextListToDiv(otherList, otherContainer);
};

function forecastAdditionalInfo(day, metric = false) {
    // Header
    let dateContainer = document.getElementById('additional-header-date-container');
    let dateTime = convertEpochToDate(day.datetimeEpoch);
    let formattedDateTime = prettyDay(dateTime);
    let dateText = formattedDateTime;
    dateContainer.textContent = dateText;

    let sunriseContainer = document.getElementById('additional-header-sunrise-container');
    let sunriseTime = sunriseSunsetFormat(day.sunriseEpoch);
    let sunriseText = `Sunrise: ${sunriseTime}`;
    sunriseContainer.textContent = sunriseText;

    let sunsetContainer = document.getElementById('additional-header-sunset-container');
    let sunsetTime = sunriseSunsetFormat(day.sunsetEpoch);
    let sunsetText = `Sunset: ${sunsetTime}`;
    sunsetContainer.textContent = sunsetText;
    
    //Temperature and Humidity Block
    let tempContainer = document.getElementById('additional-data-temp-container');

    let tempList = [];

    let tempHiText = `Hi: ${tempLabeler(day.tempmax, metric)}`;
    tempList.push(tempHiText);

    let tempLoText = `Lo: ${tempLabeler(day.tempmin, metric)}`;
    tempList.push(tempLoText);

    let humidityText = `Humidity: ${day.humidity}`;
    tempList.push(humidityText);

    writeTextListToDiv(tempList, tempContainer);

    // Wind Block
    let windContainer = document.getElementById('additional-data-wind-container');
    let windList = [];

    let windMax = findWindMax(day);
    let windMin = findWindMin(day);
    let windText = '';
    if (windMax > 0) {
        windText = `Wind Speed: ${windMin} to ${windMax} mph`
    }
    else {
        windText = `${windMax} mph`
    }
    windList.push(windText);
    
    let gustMaxText = `Wind Gusts: Up to ${findGustMax(day)} mph`;
    windList.push(gustMaxText);

    writeTextListToDiv(windList, windContainer)

    // Precipitation
    let precipContainer = document.getElementById('additional-data-precip-container');
    let precipList = [];

    let precipProbText = `Precipitation Probability: ${day.precipprob}%`
    precipList.push(precipProbText);

    let precipType = '';
    if (day.preciptype) {
        precipType = day.preciptype;
    }
    else {
        precipType = `None`;
    }
    let precipTypeText = `Precipitation Type: ${precipType}`;
    precipList.push(precipTypeText);

    writeTextListToDiv(precipList, precipContainer);
};

function createSearch() {
    let searchContainer = document.getElementById('search-container');
    let formContainer = document.createElement('form');
    let button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Search';

    let searchBoxContainer = document.createElement('div');

    let searchBoxLabel = document.createElement('label');
    searchBoxLabel.for = 'location_request';

    let searchBoxInput = document.createElement('input');
    searchBoxInput.type = 'text';
    searchBoxInput.name = 'location_request';
    searchBoxInput.id = 'location_request';

    searchBoxContainer.append(searchBoxLabel);
    searchBoxContainer.append(searchBoxInput);

    formContainer.append(button);
    formContainer.append(searchBoxContainer);
    searchContainer.append(formContainer);
}

function forecastEventListener(JSONdata, metric = false) {
    let forecastContainer = document.getElementById('forecast-container');
    let days = JSONdata.days;
    forecastContainer.addEventListener("click", (e) => {
        if (e.target.closest(".daily-forecast-container")) {
            let targetDay = e.target.closest(".daily-forecast-container");
            let targetDayIndex = targetDay.id.split("-")[1];
            clearAdditionalDivs();
            createAdditionalInfoContainers();

            if (targetDayIndex > 0) {
                forecastAdditionalInfo(days[targetDayIndex], metric);
            }

            else {
                todayAdditionalInfo(JSONdata, metric)
            }
        }
    })
}
let devRequestArray = {location: location,
                       date1: '',
                       date2: '',
                       dev: true
                       };

async function main() {
    let request = new weatherRequest(devRequestArray);
    let requestData = await request.data;
    createSearch();
    processData(requestData, false);
    forecastEventListener(requestData, false)
}

main();