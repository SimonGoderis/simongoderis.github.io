// Aan te passen -- Wordt gebruikt bij de onderdelen
// - Onderdelen : kolom-hoofdingen
// - OnderdeelUitleg : tekstuele uitleg bij de hoofdingen
// - ExtraUitleg : extra bijkomende uitleg 
// - Afop : aflopend (hoog - laag) of oplopend (laag - hoog)
// - Tijdaantal : aantal = in absoluut aantal weergegeven en tijd = in tijd (hh:mm:ss)

onderdelen = ['MP', 'FC', 'CP', 'IZ', 'ST', 'NN', 'NS', 'HS']
onderdeelUitleg = ['Menselijke piramide', 'Flipcup', 'Choco proeven', 'In de zak', 'Springtouwen', 'Nedroow Neiaardmo', 'Naschilderen schilderij', 'Handstand']
extraUitleg = ['', '', '', '', '', '', '', '']
afop = ['af', 'af', 'af', 'af', 'af', 'af', 'af', 'af']
tijdaantal = ['tijd', 'tijd', 'tijd', 'tijd', 'tijd', 'tijd', 'tijd', 'tijd']


let SHEET_ID = '1uogwPvc5BZi0Uw4j-6-v3q5_4E1C3NP3whWl8U__Tc4'; // Get this from the main sheet URL (not the copied Publish URL with '2PACX' in it).
let API_KEY = 'AIzaSyBe5mbZS2t9aTmdiDSjPPJKg-LqlUNu96Q';

function fetchSheet({
    spreadsheetId,
    sheetName,
    apiKey
}) {
    let url = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId + "/values/" + sheetName + "?key=" + apiKey;
    return fetch(url).then(response =>
        response.json().then(result => {
            let data = Papa.parse(Papa.unparse(result.values), {
                header: true
            });
            fillTable(data.data);
            fillDetails(data.data);
        }).catch( err => {
            console.log("Er deed zich een error voor: \n" + err)
                $("#errorHandling").removeClass("hide").addClass("show");
                $("#loadingblock").hide();
                $('html, body').css({
                    overflow: 'hidden',
                    height: '100%'
                });
        })
    );
}

function init() {
    fetchSheet({
        spreadsheetId: SHEET_ID,
        sheetName: 'Overzicht',
        apiKey: API_KEY
    });
}

function fillTable(data) {

    data = data.sort(function (a, b) {
        return b['Totaal'] - a['Totaal'];
    });

    $("#loadingblock").hide();

    for (i = 0; i < data.length; i++) {
        if (i % 2 === 0) {
            $("#standbody").append("<tr><td>" + (i + 1) +
                ".</td><td class='bg-white text-red'><div class='row'><div class='col-8'>" + data[
                    i].Team + "</div><div class='col-4 text-right'>" + sectohhmmss(data[i].Totaal) +
                "</div></div></td></tr>")
        } else {
            $("#standbody").append("<tr><td>" + (i + 1) +
                ".</td><td class='bg-red text-white'><div class='row'><div class='col-8'>" + data[
                    i].Team + "</div><div class='col-4 text-right'>" + sectohhmmss(data[i].Totaal) +
                "</div></div></td></tr>")
        }
    }
}

function fillDetails(data) {

    // Code - maakt automatisch de rijen aan.
    for (var i = 0; i < onderdelen.length; i++) {
        onderdeel = onderdelen[i]

        // Sorteert de data op basis van de score bij het onderdeel
        if (afop[i] === "af") {
            data = data.sort(function (a, b) {
                return b[onderdeel] - a[onderdeel];
            });
        } else if (afop[i] === "op") {
            data = data.sort(function (a, b) {
                return a[onderdeel] - b[onderdeel];
            });
        }
        html = "";
        html += "<div class='col-12 col-md-6 col-lg-4 mt-5'><h2 class='text-center'>" + onderdeelUitleg[i] +
            "</h2><h6 class='text-center'><small>" + extraUitleg[i] +
            "</small></h6><table class='onderdeel w-100'><tbody>"
        for (var y = 0; y < data.length; y++) {
            if (tijdaantal[i] === 'aantal') {
                if (y % 2 === 0) {
                    html += "<tr><td>" + (y + 1) +
                        "</td><td class='bg-black text-white'><div class='row'><div class='col-8'>" + data[y][
                            'Team'
                        ] + "</div><div class='col-4 text-right'>" + data[y][onderdeel] +
                        "</div></div></td></tr>"
                } else {
                    html += "<tr><td>" + (y + 1) +
                        "</td><td class='bg-red text-white'><div class='row'><div class='col-8'>" + data[y][
                            'Team'
                        ] + "</div><div class='col-4 text-right'>" + data[y][onderdeel] +
                        "</div></div></td></tr>"
                }
            } else if (tijdaantal[i] === 'tijd') {
                if (y % 2 === 0) {
                    html += "<tr><td>" + (y + 1) +
                        "</td><td class='bg-black text-white'><div class='row'><div class='col-8'>" + data[y][
                            'Team'
                        ] + "</div><div class='col-4 text-right'>" + sectohhmmss(data[y][onderdeel]) +
                        "</div></div></td></tr>"
                } else {
                    html += "<tr><td>" + (y + 1) +
                        "</td><td class='bg-red text-white'><div class='row'><div class='col-8'>" + data[y][
                            'Team'
                        ] + "</div><div class='col-4 text-right'>" + sectohhmmss(data[y][onderdeel]) +
                        "</div></div></td></tr>"
                }
            }
        }
        html += "</tbody></table></div>"
        $("#onderdelenbody").append(html)
    }
    console.log("COMPLETED.")
}


function sectohhmmss(secs) {
    if (secs) {
        if (secs >= 3600) {
            return moment.utc(secs * 1000).format('H:mm:ss')
        } else {
            return moment.utc(secs * 1000).format('m:ss')
        }
    } else {
        return ""
    }
}

function toonInfo() {
    $('#uitlegModal').modal('show')
}

$(document).ready(function () {
    init();
    console.log("Start met dynamisch laden van data");
});