// Version

console.log("V1");


if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        initWeather(pos);
    }, function () {
        console.log("Er liep iets fout met de geolocatie.")
    });
} else {
    // Browser doesn't support Geolocation
    console.log("Er liep iets fout met de geolocatie.")
}



var dataGlobal;
var darkskyUrl = 'https://api.darksky.net/forecast/bc19b1b471805791801dd3098e6b3b59/';
var darkskyUrl2 = '?exclude=currently,minutely,flags&lang=nl&units=ca&extend=hourly';

function initWeather(loc) {
    var latlong = loc.lat + "," + loc.lng;
    $.ajax({
        url: darkskyUrl + latlong + darkskyUrl2,
        dataType: 'JSONP', // JSONP bij normale weerurl
        jsonpCallback: 'callback',
        async: false,
        type: 'GET',
        error: function (request, error) {
            console.log(arguments);
            console.log("ERROR: " + error);
        },
        success: function (data) {
            dataGlobal = data;
            weatherProcessing(dataGlobal);
            dynamicWeather(dataGlobal);
        }
    });
}


function weatherProcessing(data) {
    console.log(data);
}

function dailyWeather(data) {
    var daily_weather = [];
    for (i = 0; i < data.daily.data.length; i++) {
        var obj = data.daily.data[i];
        daily_weather.push({
            'dayOfWeek': weekDay((new Date(obj.time * 1000)).getDay()),
            'dayDDMM': (new Date(obj.time * 1000)).getDate() + '/' + ((new Date(obj.time * 1000)).getMonth() + 1),
            'icon': obj.icon,
            'summary': obj.summary,
            'temperatureLow': Math.round(obj.temperatureLow),
            'temperatureHigh': Math.round(obj.temperatureHigh),
            'precipProbability': Math.round(obj.precipProbability * 100),
            'windSpeed': Math.round(obj.windSpeed)
        });
    }
    console.log(daily_weather);
    return daily_weather;
}

function hourlyWeather(data) {
    var hourly_weather = [];
    for (i = 0; i < data.hourly.data.length; i++) {
        var obj = data.hourly.data[i];
        var weatherFlag = 0;
        var gCalSport = 0;
        if (Math.round(obj.temperature) <= calcValues.tempMin) {
            weatherFlag = -1;
        } else if (Math.round(obj.windSpeed) >= calcValues.windMaxP || Math.round(obj.precipProbability) >= calcValues.precipMaxP || Math.round(obj.temperature) >= calcValues.tempMaxP) {
            weatherFlag = 2;
        } else if (Math.round(obj.windSpeed) >= calcValues.windMax || Math.round(obj.precipProbability) >= calcValues.precipMax || Math.round(obj.temperature) >= calcValues.tempMax) {
            weatherFlag = 1;
        }
        hourly_weather.push({
            'dayDDMM': (new Date(obj.time * 1000)).getDate() + '/' + ((new Date(obj.time * 1000)).getMonth() + 1),
            'time': (new Date(obj.time * 1000)).getHours() + ':00',
            'temperature': Math.round(obj.temperature),
            'windSpeed': Math.round(obj.windSpeed),
            'precipProbability': Math.round(obj.precipProbability * 100),
            'cloudCover': Math.round(obj.cloudCover * 100),
            'uvIndex': obj.uvIndex,
            'icon': obj.icon,
            'windBearing': obj.windBearing,
            'weatherFlag': weatherFlag,
        });
    }
    console.log(hourly_weather);
    return hourly_weather;
}


// Waarden
var calcValues = {
    'tempMin': 5,
    'tempMax': 25,
    'tempMaxP': 30,
    'precipMax': 25,
    'precipMaxP': 50,
    'windMax': 20,
    'windMaxP': 40
}

// Op basis van local storage
if (localStorage.getItem('weerAppSetting') != 'true') {
    localStorage.setItem('weerAppSetting', 'true');
    localStorage.setItem('weerAppValues', JSON.stringify(calcValues));
    localStorage.setItem('gCal', '');
} else {
    var retrieved = localStorage.getItem('weerAppValues')
    $('#gCal').val(localStorage.getItem('gCal'));
    calcValues = JSON.parse(retrieved);
}
console.log(localStorage.getItem('weerAppValues'));

Object.keys(calcValues).forEach(function (key) {
    $('#' + key).val(calcValues[key])
});

// Knop OPSLAAN in de modal
function changeSettings() {
    calcValues = {
        'tempMin': $("#tempMin").val(),
        'tempMax': $("#tempMax").val(),
        'tempMaxP': $("#tempMaxP").val(),
        'precipMax': $("#precipMax").val(),
        'precipMaxP': $("#precipMaxP").val(),
        'windMax': $("#windMax").val(),
        'windMaxP': $("#windMaxP").val()
    }
    localStorage.setItem('weerAppValues', JSON.stringify(calcValues));
    localStorage.setItem('gCal', $('#gCal').val());
    $("#dynamicWeather").html("");
    dynamicWeather(dataGlobal);
    closeModal();
}


// Google Calendar

// Dagen toevoegen aan datum
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function googlecall() {
    var gDataGlobal = [];
    var gKey = "AIzaSyB8Ciol-IfNKTZWkKg25JdFdrx9Ut_CJYk",
    gCal = $('#gCal').val(),
    gStart = (new Date()).toISOString(),
    gEnd = (addDays(gStart, 14)).toISOString(),
    gLink = "https://www.googleapis.com/calendar/v3/calendars/" + gCal + "/events?singleEvents=true&orderBy=startTime&key=" + gKey + "&timeMin=" + gStart + "&timeMax=" + gEnd
    console.log(gLink);
    $.ajax({
        url: gLink,
        dataType: 'JSONP', // JSONP bij normale weerurl
        jsonpCallback: 'callback',
        async: false,
        type: 'GET',
        error: function (request, error) {
            console.log(arguments);
            console.log("ERROR: " + error);
        },
        success: function (gData) {
            console.log(gData);
            console.log(gData.items)
            for (i = 0; i < gData.items.length; i++ ){
                var tempData = {
                    'startDate': (new Date(gData.items[i].start.dateTime)).getDate() + "/" + ((new Date(gData.items[i].start.dateTime)).getMonth() + 1),
                    'endDate' : (new Date(gData.items[i].end.dateTime)).getDate() + "/" + ((new Date(gData.items[i].start.dateTime)).getMonth() + 1),
                    'startTime' : (new Date(gData.items[i].start.dateTime)).getHours(),
                    'endTime' : (new Date(gData.items[i].end.dateTime)).getHours() + 1
                }
                gDataGlobal.push(tempData);
            }
            console.log(gDataGlobal);
        }
    });
}

function dynamicWeather(data) {
    var daily_weather = dailyWeather(data);
    var hourly_weather = hourlyWeather(data);
    count_UnavHours = 0;
    console.log(daily_weather);
    for (i = 0; i < daily_weather.length; i++) {
        var icoWeather = iconWeather(daily_weather[i].icon);
        var htmlText = "";
        htmlText += "<div id='card" + i + "' class='card bg-blue' onclick='clicked(" + i + ");'><div class='card-body'><div class='row mb-2'><div class='col-6'><heading>" + daily_weather[i].dayOfWeek + "</heading><subtitle>" + daily_weather[i].dayDDMM + "</subtitle></div><div class='col-6'><i class='wi wi-big wi-" + icoWeather + "'></i></div></div><h4>" + daily_weather[i].summary + "</h4><div class='progress' id='weerprogress" + i + "'>";

        if (i == 0) {
            for (x = 0; x < 24; x++) {
                if (daily_weather[i].dayDDMM == hourly_weather[x].dayDDMM) {
                    count_UnavHours += 1;
                }
            }
            console.log(count_UnavHours);
            for (z = 1; z < 25 - count_UnavHours; z++) {
                htmlText += "<div class='progress-bar' style='width: 4.166666666%'></div>"
            }
        }

        for (x = 0; x < 169; x++) {
            if (daily_weather[i].dayDDMM == hourly_weather[x].dayDDMM) {
                if (hourly_weather[x].weatherFlag == 2) {
                    htmlText += "<div class='progress-bar bg-red' style='width: 4.166666666%'></div>"
                } else if (hourly_weather[x].weatherFlag == 1) {
                    htmlText += "<div class='progress-bar bg-yellow' style='width: 4.166666666%'></div>"
                } else if (hourly_weather[x].weatherFlag == -1) {
                    htmlText += "<div class='progress-bar bg-lblue' style='width: 4.166666666%'></div>"
                } else {
                    htmlText += "<div class='progress-bar bg-green' style='width: 4.166666666%'></div>"
                }
            }
        }

        htmlText += "</div><div class='row extraweer'><div class='col-3'><i class='wi wi-thermometer-exterior'></i> " + daily_weather[i].temperatureLow + "<small>°C</small></div><div class='col-3'><i class='wi wi-thermometer'></i> " + daily_weather[i].temperatureHigh + "<small>°C</small></div><div class='col-3'><i class='wi wi-umbrella'></i> " + daily_weather[i].precipProbability + "<small>%</small></div><div class='col-3'><i class='wi wi-strong-wind'></i> " + daily_weather[i].windSpeed + "<small>km/h</small></div></div>";

        htmlText += "<div class='mt-2 hidden' id='weertable" + i + "'><table><thead><tr><th></th><th><i class='wi wi-time-2'></i></th><th><i class='wi wi-thermometer'></i></th><th><i class='wi wi-strong-wind'></i></th><th><i class='wi wi-umbrella'></i></th><th><i class='wi wi-cloud'></i></th><th><i class='wi wi-day-sunny'></i></th></tr></thead><tbody id='weerdetail'>"

        for (x = 0; x < 169; x++) {
            if (daily_weather[i].dayDDMM == hourly_weather[x].dayDDMM) {
                if (hourly_weather[x].weatherFlag == 2) {
                    htmlText += "<tr><td class='bg-red'></td>"
                } else if (hourly_weather[x].weatherFlag == 1) {
                    htmlText += "<tr><td class='bg-yellow'></td>"
                } else if (hourly_weather[x].weatherFlag == -1) {
                    htmlText += "<tr><td class='bg-lblue'></td>"
                } else {
                    htmlText += "<tr><td class='bg-green'></td>"
                }
                htmlText += "<td>" + hourly_weather[x].time + "</td><td>" + hourly_weather[x].temperature + "<small>°C</small></td><td>" + hourly_weather[x].windSpeed + "<small>km/h</small></td><td>" + hourly_weather[x].precipProbability + "<small>%</small></td><td>" + hourly_weather[x].cloudCover + "<small>%</small></td><td>" + hourly_weather[x].uvIndex + "</td>";
                htmlText += "</tr>";
            }
        }

        htmlText += "</tbody></table></div></div></div>";

        $("#dynamicWeather").append(htmlText);
    }
    $("#loader").hide();
    $("#fixedbutton").removeClass("hidden");
}


function iconWeather(text) {
    weather = ['clear-day', 'clear-night', 'rain', 'snow', 'sleet', 'wind', 'fog', 'cloudy', 'partly-cloudy-day', 'partly-cloudy-night']
    icons = ['day-sunny', 'wi-night-clear', 'rain', 'snow', 'sleet', 'strong-wind', 'fog', 'cloudy', 'day-cloudy', 'night-alt-cloudy']

    for (z = 0; z < weather.length; z++) {
        if (weather[z] == text) {
            return icons[z];
        }
    }

}

// dagnummer (int) -> weekday (tekst)
function weekDay(day) {
    var days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
    return days[day];
}


// Klikken = tonen

function clicked(i) { // define event handler
    id = "#weertable" + i;
    prog = "#weerprogress" + i;
    if (!$(id).hasClass("hidden")) {
        $(id).addClass("hidden");
        $(prog).removeClass("hidden");
    } else {
        $(id).removeClass("hidden");
        $(prog).addClass("hidden");
    }
};

function showModal() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    $("#modal").removeClass("hidden");
    $("#overlay").removeClass("hidden");
}

function closeModal() {
    $("#modal").addClass("hidden");
    $("#overlay").addClass("hidden");
}

function resetSettings() {
    var calcValues = {
        'tempMin': 5,
        'tempMax': 25,
        'tempMaxP': 30,
        'precipMax': 25,
        'precipMaxP': 50,
        'windMax': 15,
        'windMaxP': 30
    }
    localStorage.setItem('weerAppValues', JSON.stringify(calcValues));
    Object.keys(calcValues).forEach(function (key) {
        $('#' + key).val(calcValues[key])
    });
}





