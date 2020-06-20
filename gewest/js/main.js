// Aan te passen -- Wordt gebruikt bij de onderdelen
    // - Onderdelen : kolom-hoofdingen
    // - OnderdeelUitleg : tekstuele uitleg bij de hoofdingen
    // - ExtraUitleg : extra bijkomende uitleg 
    // - Afop : aflopend (hoog - laag) of oplopend (laag - hoog)
    // - Tijdaantal : aantal = in absoluut aantal weergegeven en tijd = in tijd (hh:mm:ss)

    onderdelen = ['K1', 'K2', 'K3']
    onderdeelUitleg = ['Pompen', 'Handstand', 'Water']
    extraUitleg = ['Aantal keren pompen', 'Minuten handstand', 'Zoveel mogelijk water drinken']
    afop = ['af', 'op', 'af']
    tijdaantal = ['aantal', 'tijd', 'tijd']


    function init() {
        Papa.parse(
            'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9N_dOJQfpzkeccu6Wzh-p78jckWkAHPZkUhtadD9w0O5LVFjFkimyq4OgGYwTYngqHM3dccXSo8HR/pub?output=csv', {
                download: true,
                header: true,
                error: function (results) {
                    console.log("Er deed zich een error voor: \n" + results)
                    $("#errorHandling").removeClass("hide").addClass("show");
                    $("#loadingblock").hide();
                    $('html, body').css({
                        overflow: 'hidden',
                        height: '100%'
                    });
                },
                complete: function (results) {
                    fillTable(results.data);
                    fillDetails(results.data);
                }
            })
    }

    function fillTable(data) {

        data = data.sort(function (a, b) {
            return a['Totaal'] - b['Totaal'];
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