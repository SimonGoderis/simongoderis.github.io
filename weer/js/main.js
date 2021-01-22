// Version

console.log("V4 - Update parameter in URL");



// =======
// SETUP 
// Initiële set-up bij het laden van de pagina. LocalStorage -> API calls
// =======

var dataGlobal = [];
var gDataGlobal = [];
var graphArray = {};

// Parameter uit URL halen. Zo kan je de locatie overschrijven met eigen locatie-gegevens.
const queryURL = (new URLSearchParams(window.location.search)).get('q');

// Locatie-gegevens ophalen. Enkel h‡uidige locatie momenteel. 
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        // Geeft het positie-object door naar de functie initWeather.
        // Bij zelf aangegeven coördinaten (via parameter in URL).
        if (queryURL !== null) {
            var pos = {
                lat: queryURL.substr(0, queryURL.indexOf(',')),
                lng: queryURL.substr(queryURL.indexOf(',')+1, 99)
            };
            initWeather(pos);
        } else {
        // Bij automatisch bepalen van de positie.
            initWeather(pos);
        }
    }, function () {
        console.log("Er liep iets fout met de geolocatie. Deze website moet toegang hebben tot je locatie om te kunnen werken.")
        $("#geoloc").removeClass('hidden');
        $("#loaderimg").addClass('hidden');
    });
} else {
    // Browser doesn't support Geolocation
    console.log("Er liep iets fout met de geolocatie. Deze website moet toegang hebben tot je locatie om te kunnen werken.")
    $("#geoloc").removeClass('hidden');
    $("#loaderimg").addClass('hidden');
}

// LOCALSTORAGE
// Basiswaarden - intiële setup
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
    // Als er nog niks in de localstorage opgeslaan is.
    localStorage.setItem('weerAppSetting', 'true');
    localStorage.setItem('weerAppValues', JSON.stringify(calcValues));
    // Ook gCal al inzetten voor de agenda zodat we geen 'null' weergeven.
    localStorage.setItem('gCal', '');
} else {
    // Als er reeds items in de localstorage zitten, worden deze hier toegewezen.
    var retrieved = localStorage.getItem('weerAppValues');
    calcValues = JSON.parse(retrieved);
    $('#gCal').val(localStorage.getItem('gCal'));
}

// Invullen van de waarden in het formulier (modal)
Object.keys(calcValues).forEach(function (key) {
    $('#' + key).val(calcValues[key])
});


// API'S
// Ophalen van de API-data voor het weer.
function initWeather(loc) {
    var darkskyUrl = 'https://api.darksky.net/forecast/bc19b1b471805791801dd3098e6b3b59/';
    var darkskyUrl2 = '?exclude=currently,minutely,flags&lang=nl&units=ca&extend=hourly';
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
            // Probeert eerst en vooral ook de agenda-data in te laden.
            googleCall()
        }
    });
}

function googleCall() {
    var gKey = "AIzaSyDhrucaqj4oe1F2R3FX3qzaqZCRc5E-8r4",
    gCal = $('#gCal').val(),
    gStart = (new Date()).toISOString(),
    gEnd = (addDays(gStart, 14)).toISOString(),

    // https://www.googleapis.com/calendar/v3/calendars/t40j1bq9h92ao45fnsmoc0s364@group.calendar.google.com/events?key=

    // gLink = encodeURI("https://www.googleapis.com/calendar/v3/calendars/" + gCal + "%40group.calendar.google.com/events?singleEvents=true&orderBy=startTime&key=" + gKey + "&timeMin=" + gStart + "&timeMax=" + gEnd);
    gLink = encodeURI("https://www.googleapis.com/calendar/v3/calendars/" + gCal + "@group.calendar.google.com/events?key=" + gKey);
    
    $.ajax({
        url: gLink,
        dataType: 'JSONP', // JSONP bij normale weerurl
        jsonpCallback: 'callback',
        async: false,
        type: 'GET',
        error: function (request, error) {
            console.log(arguments);
            console.log("ERROR (kalender): " + error);
            // Weer verwerken zonder kalender-data mee te nemen.
            dynamicWeather(dataGlobal);
            graphF();
        },
        success: function (gData) {
            console.log(gLink);
            console.log(gData);
            if ($("#gCal").val() != '') {
                console.log("Kalender " + gData.summary + " is correct geladen.");
                // De data van de kalender API verwerken.
                googleData(gData);

                $('#gCalText').html("De gebruikte kalender is: " + gData.summary);
                $('#gCalText').removeClass("hidden");
            } else {
                $('#gCalText').addClass("hidden");
            }
            // Weer verwerken.
            dynamicWeather(dataGlobal);
            graphF();
        }
    });
}

function googleData(gData) {
    for (i = 0; i < gData.items.length; i++ ){
        var tempData = {
            'startDate': convTwoDig(((new Date(gData.items[i].start.dateTime)).getMonth() + 1)) + convTwoDig((new Date(gData.items[i].start.dateTime)).getDate()),
            'endDate' : convTwoDig(((new Date(gData.items[i].start.dateTime)).getMonth() + 1)) + convTwoDig((new Date(gData.items[i].end.dateTime)).getDate()),
            'startTime' : convTwoDig((new Date(gData.items[i].start.dateTime)).getHours()),
            'endTime' : convTwoDig((new Date(gData.items[i].end.dateTime)).getHours() + 1)
        }
        gDataGlobal.push(tempData);
    }
}


// =======
// CORE PROGRAM 
// De basis van het programma. Verwerking van de API data.
// =======


// =======
// HELPERS 
// Hulpfuncties die hierboven gebruikt worden. 
// =======


function dailyWeather(data) {
    console.log(data);
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
            'windSpeed': Math.round(obj.windSpeed),
            'sunriseTime': (new Date(obj.sunriseTime * 1000)).getHours() + ':' + (new Date(obj.sunriseTime * 1000)).getMinutes(),
            'sunsetTime': (new Date(obj.sunsetTime * 1000)).getHours() + ':' + (new Date(obj.sunsetTime * 1000)).getMinutes()
        });
    }
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
        } else if (Math.round(obj.windSpeed) >= calcValues.windMaxP || Math.round(obj.precipProbability * 100) >= calcValues.precipMaxP || Math.round(obj.temperature) >= calcValues.tempMaxP) {
            weatherFlag = 2;
        } else if (Math.round(obj.windSpeed) >= calcValues.windMax || Math.round(obj.precipProbability * 100) >= calcValues.precipMax || Math.round(obj.temperature) >= calcValues.tempMax) {
            weatherFlag = 1;
        }

        // 1 bij de key gCalSport als er dan ook een activiteit gepland is.
        if ($('#gCal').val() != '') {
            for (y = 0; y < gDataGlobal.length; y++) {
                var dataMMDDTT = parseInt(convTwoDig((new Date(obj.time * 1000)).getMonth() + 1) + convTwoDig(((new Date(obj.time * 1000)).getDate())) + convTwoDig((new Date(obj.time * 1000)).getHours()));
                var startMMDDTT = (gDataGlobal[y].startDate) + (gDataGlobal[y].startTime);
                var endMMDDTT = ((gDataGlobal[y].endDate) + (gDataGlobal[y].endTime));
                if( parseInt(dataMMDDTT) >= parseInt(startMMDDTT) && parseInt(dataMMDDTT) <= parseInt(endMMDDTT)) {
                        var gCalSport = 1;
                }
            }
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
            'gCalSport' : gCalSport
        });
    }
    return hourly_weather;
}




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
    googleCall();
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



function dynamicWeather(data) {
    $("#dynamicWeather").html("");
    $("#dailyOverview").html("");
    var daily_weather = dailyWeather(data);
    var hourly_weather = hourlyWeather(data);
    console.log(daily_weather);

    // Creates list for weather data - can be used in graphs.
    var listTempHigh = [], listTempLow = [], listWindSpeed = [], listPrecipProbability = [], listDayDDMM = [];
    for (i = 0; i < daily_weather.length; i++) {
        listTempHigh.push(daily_weather[i].temperatureHigh);
        listTempLow.push(daily_weather[i].temperatureLow);
        listWindSpeed.push(daily_weather[i].windSpeed);
        listPrecipProbability.push(daily_weather[i].precipProbability);
        listDayDDMM.push(daily_weather[i].dayDDMM);
    }  
    graphArray = {
        "temperatureHigh": listTempHigh,
        "temperatureLow": listTempLow,
        "windSpeed": listWindSpeed,
        "precipProbability": listPrecipProbability,
        "dayDDMM": listDayDDMM
    }
    console.log(graphArray);
    count_UnavHours = 0;
    var htmlDailyOverView = "";
    for (i = 0; i < daily_weather.length; i++) {
        var icoWeather = iconWeather(daily_weather[i].icon);
        var htmlText = "";
        htmlText += "<div id='card" + i + "' class='card bg-blue' onclick='clicked(" + i + ");'><div class='card-body'><div class='row mb-2'><div class='col-6'><heading>" + daily_weather[i].dayOfWeek + "</heading><subtitle>" + daily_weather[i].dayDDMM + "</subtitle><br><small><i class='wi wi-sunrise'></i> " + daily_weather[i].sunriseTime + "  →  <i class='wi wi-sunset'></i> " + daily_weather[i].sunsetTime + "</small></div><div class='col-6'><i class='wi wi-big wi-" + icoWeather + "'></i></div></div><h4>" + daily_weather[i].summary + "</h4><div class='progress' id='weerprogress" + i + "'>";

        if (i == 0) {
            for (x = 0; x < 24; x++) {
                if (daily_weather[i].dayDDMM == hourly_weather[x].dayDDMM) {
                    count_UnavHours += 1;
                }
            }
            for (z = 1; z < 25 - count_UnavHours; z++) {
                htmlText += "<div class='progress-bar' style='width: 4.17%'></div>"
            }
        }

        for (x = 0; x < 169; x++) {
            if (daily_weather[i].dayDDMM == hourly_weather[x].dayDDMM) {
                if (hourly_weather[x].weatherFlag == 2) {
                    htmlText += "<div class='progress-bar bg-red' style='width: 4.17%'></div>"
                } else if (hourly_weather[x].weatherFlag == 1) {
                    htmlText += "<div class='progress-bar bg-yellow' style='width: 4.17%'></div>"
                } else if (hourly_weather[x].weatherFlag == -1) {
                    htmlText += "<div class='progress-bar bg-lblue' style='width: 4.17%'></div>"
                } else {
                    htmlText += "<div class='progress-bar bg-green' style='width: 4.17%'></div>"
                }
            }
        }

        htmlText += "</div><div class='cal-progress' id='calprogress" + i + "'>";

        if (i == 0) {
            for (z = 1; z < 25 - count_UnavHours; z++) {
                htmlText += "<div class='progress-bar' style='width: 4.17%'></div>"
            }
        }

        for (x = 0; x < 169; x++) {
            if (daily_weather[i].dayDDMM == hourly_weather[x].dayDDMM) {
                if (hourly_weather[x].gCalSport == 1) {
                    htmlText += "<div class='progress-bar bg-dark' style='width: 4.17%'></div>"
                } else {
                    htmlText += "<div class='progress-bar' style='width: 4.17%'></div>"
                }
            }
        }

        htmlText += "</div><div class='row extraweer'><div class='col-3'><i class='wi wi-thermometer-exterior'></i> " + daily_weather[i].temperatureLow + "<small>°C</small></div><div class='col-3'><i class='wi wi-thermometer'></i> " + daily_weather[i].temperatureHigh + "<small>°C</small></div><div class='col-3'><i class='wi wi-umbrella'></i> " + daily_weather[i].precipProbability + "<small>%</small></div><div class='col-3'><i class='wi wi-strong-wind'></i> " + daily_weather[i].windSpeed + "<small>km/h</small></div></div>";

        htmlText += "<div class='mt-2 hidden' id='weertable" + i + "'><table><thead><tr><th></th><th></th><th><i class='wi wi-time-2'></i></th><th><i class='wi wi-thermometer'></i></th><th><i class='wi wi-strong-wind'></i></th><th><i class='wi wi-umbrella'></i></th><th><i class='wi wi-cloud'></i></th><th><i class='wi wi-day-sunny'></i></th></tr></thead><tbody id='weerdetail'>"

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

                if (hourly_weather[x].gCalSport == 1) {
                    htmlText += "<td class='bg-dark'></td>"
                } else {
                    htmlText += "<td></td>"
                }
                htmlText += "<td>" + hourly_weather[x].time + "</td><td>" + hourly_weather[x].temperature + "<small>°C</small></td><td>" + hourly_weather[x].windSpeed + "<small>km/h</small></td><td>" + hourly_weather[x].precipProbability + "<small>%</small></td><td>" + hourly_weather[x].cloudCover + "<small>%</small></td><td>" + hourly_weather[x].uvIndex + "</td>";
                htmlText += "</tr>";
            }
        }

        htmlText += "</tbody></table></div></div></div>";
        $("#dynamicWeather").append(htmlText);

        htmlDailyWidth = 100/daily_weather.length;
        htmlDailyOverView += "<div class='card bg-dark' style='position:relative; width:" + htmlDailyWidth + "%; max-width:" + htmlDailyWidth + ";flex-basis:" + htmlDailyWidth + "'>";
        htmlDailyOverView += daily_weather[i].dayOfWeek.slice(0,2).toUpperCase() + "<br>" + daily_weather[i].dayDDMM + "<i class='wi wi-ico wi-" + icoWeather + "'></i><small><hr><span><i class='wi wi-thermometer-exterior'></i> " + daily_weather[i].temperatureLow + "</span><br><span><i class='wi wi-thermometer'></i> " + daily_weather[i].temperatureHigh+ "</span><br><span><i class='wi wi-umbrella'></i> " + daily_weather[i].precipProbability+ "</span><br><span><i class='wi wi-strong-wind'></i> " + daily_weather[i].windSpeed + "</span><hr class='dailySun'><span class='dailySun'><i class='wi wi-sunrise'></i> " + daily_weather[i].sunriseTime + "</span><br><span class='dailySun'><i class='wi wi-sunset'></i> " + daily_weather[i].sunsetTime ;
        htmlDailyOverView += "</span></small></div>";
    }
    $("#dailyOverview").append(htmlDailyOverView);
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
    calprog = "#calprogress" + i;
    if (!$(id).hasClass("hidden")) {
        $(id).addClass("hidden");
        $(prog).removeClass("hidden");
        $(calprog).removeClass("hidden");
    } else {
        $(id).removeClass("hidden");
        $(prog).addClass("hidden");
        $(calprog).addClass("hidden");
    }
};

function showModal() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    $("#modal").removeClass("hidden");
    $("#overlay").removeClass("hidden");
    $("#dynamicWeather").addClass("hidden");
    $("#fixedbutton").addClass("hidden");
    $("#dailyOverview").addClass("hidden");
    $("#graph").addClass("hidden");
    
}

function closeModal() {
    $("#modal").addClass("hidden");
    $("#overlay").addClass("hidden");
    $("#dynamicWeather").removeClass("hidden");
    $("#fixedbutton").removeClass("hidden");
    $("#dailyOverview").removeClass("hidden");
    $("#graph").removeClass("hidden");
}

function resetSettings() {
    var calcValues = {
        'tempMin': 5,
        'tempMax': 25,
        'tempMaxP': 30,
        'precipMax': 25,
        'precipMaxP': 50,
        'windMax': 20,
        'windMaxP': 40
    }
    localStorage.setItem('weerAppValues', JSON.stringify(calcValues));
    Object.keys(calcValues).forEach(function (key) {
        $('#' + key).val(calcValues[key])
    });
}

function convTwoDig(i) {
    return ("0" + String(i)).slice(-2);
}

function graphF() {
    // Creates chart
		var lineChartData = {
			labels: graphArray.dayDDMM,
			datasets: [{
				label: 'Maximum Temperatuur (°C)',
				borderColor: 'rgba(34, 139, 34, 1)',
                backgroundColor: 'rgba(34, 139, 34, 0.2)',
                borderWidth: 2,
                fill: '-1',
                pointRadius: 0, // Zorgt dat de punten niet zichtbaar zijn
				data: graphArray.temperatureHigh,
				yAxisID: 'y-axis-1',
			}, {
				label: 'Minimum Temperatuur (°C)',
				borderColor: 'rgba(0, 0, 0, 1)',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 2,
                fill: '-1',
                pointRadius: 0, // Zorgt dat de punten niet zichtbaar zijn
				data: graphArray.temperatureLow,
				yAxisID: 'y-axis-1',
            }, {
                type: 'bar',
				label: 'Kans op regen (%)',
                borderColor: 'rgba(0, 179, 255, 1)',
                borderWidth: 1,
				backgroundColor: 'rgba(0, 179, 255, 0.2)',
				fill: false,
				data: graphArray.precipProbability,
				yAxisID: 'y-axis-2'
			}]
		};

		var ctx = document.getElementById('canvas').getContext('2d');
			window.myLine = Chart.Line(ctx, {
				data: lineChartData,
				options: {
                    legend: {
                        position: 'bottom',
                        onClick: ''
                    },
					responsive: true,
					hoverMode: 'index',
					stacked: false,
					title: {
						display: false,
						text: 'Chart.js Line Chart - Multi Axis'
					},
					scales: {
						yAxes: [{
							type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
							display: true,
							position: 'left',
                            id: 'y-axis-1',
                            ticks: {
                                // Include a dollar sign in the ticks
                                callback: function(value, index, values) {
                                    return value + ' °C';
                                },
                                fontSize: 12,
                                max: Math.max.apply( Math, graphArray.temperatureHigh ) + 2,
                                min: Math.min.apply( Math, graphArray.temperatureLow ) - 2
                            }
						}, {
							type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
							display: true,
							position: 'right',
							id: 'y-axis-2',
                            ticks: {
                                // Include a dollar sign in the ticks
                                callback: function(value, index, values) {
                                    return value + '%';
                                },
                                fontSize: 12,
                                min: 0,
                                max: 100
                            },
							// grid line settings
							gridLines: {
								drawOnChartArea: false, // only want the grid lines for one axis to show up
							},
						}],
					}
				}
			});
    
        
        // 
        // 
        // 

        $("#graph").removeClass("hidden");
}

