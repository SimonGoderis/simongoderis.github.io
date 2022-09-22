window.addEventListener('DOMContentLoaded', init_api)

console.log("v1.6 - WK2022 update")
    // Scorebord - nog verder te ontwikkelen.
    var scorebord = []
    var poule = "Feest"
    // Haalt speler ID op uit de link (id). 
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var player = urlParams.get('id')
    // Wordt opgehaald uit ServiceWorker of toegevoegd indien nog niet bestaat.
    var ls_player = localStorage.getItem('player_wk2022')
    if (player != null && ls_player == null) {
        // Als er nog niks in de localstorage opgeslaan is.
        localStorage.setItem('player_wk2022', player);
        console.log("New player added.")
    } else if (ls_player != null && player != ls_player && player != null) {
        localStorage.setItem('player_wk2022', player);
        console.log("Player changed.")
    }
    player = localStorage.getItem('player_wk2022');

    // API calls
    const link =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjHuFYV7MC3K9OnGnIkYI4G4E19236B4Ur6GmpqKHFicEwwPS8YzuC2QDYv7jga4LMdUT4SbqZXbp6/pub?gid=2116746882&single=true&output=csv'
    const link_sb =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vSPkPXPi8bYLHFeHIb_FTLl0esowodeGBxC45HdmY5QUqvZ5qw-Ol9hL_oMP15tFD-0FVxoM-jdpVa_/pub?gid=1677703325&single=true&output=csv'
  
    function init_api() {
        Papa.parse(decodeURIComponent(link), {
            download: true,
            header: true,
            complete: function (results) {
                // Stuurt data rechtstreeks door naar volgende call
                init_score(results.data);
            }
        });
    }

    var data_sb_o

    function init_score(data_api) {
        Papa.parse(decodeURIComponent(link_sb), {
            download: true,
            header: true,
            complete: function (results) {
                console.log(results.data);
                data_sb = results.data
                for (i = 0; i < data_sb.length; i++) {
                    if (data_sb[i].Groep === poule) {
                        if (data_sb[i].Speler == player) {
                            var data_score_player = data_sb[i]
                        }
                        data_sb[i].Speler_c = (data_sb[i].Speler).substring(6,99)
                        scorebord.push((({ Speler_c, Score, Groep, Betaald}) => ({ Speler_c, Score, Groep, Betaald}))(data_sb[i]))
                    } 
                }                
                vueApp(data_api, data_score_player);

                scorebord.sort(function(a,b){ return b.Score - a.Score; });
                scorebord.forEach(function(player, i, arr) {
                    player.rank = i === 0 || player.Score != arr[i-1].Score
                                ? i + 1
                                : arr[i-1].rank;
                });
                scoreApp(scorebord);
                data_sb_o = data_sb
            }
        });
    }



    // VUE app init
    function vueApp(data, score) {
        var app = new Vue({
            el: '#app',
            data: {
                data: data,
                player: player,
                score: score,
                now: new Date()
            },
            methods: {
                formatDate(date) {
                    return moment(date).format("DD/MM")
                },
                formatTime(time) {
                    return moment(time).format("HH:mm")
                },
                formatYYYYMMDD(date) {
                    return moment(date).format("YYYYMMDD")
                },
                getScoreValue(ID, after) {
                    return score[ID + after];
                },
                formatTimeCalc(date) {
                    return moment(date).format("YYYYMMDDHHmmss")
                },
                badgeScore(score) {
                    switch(score) {
                        case '1': return 'warning text-dark'
                        case '2': return 'success'
                        default: return 'danger'
                    }
                },
                borderCard(status, date) {
                    switch(status) {
                        case 'IN_PLAY': return 'border-danger'
                        default: if (moment(date).format("YYYYMMDD") == moment(new Date()).format("YYYYMMDD")) { return 'border-dark' } else { return 'bg-light' }
                    }   
                },
                scroll(date) {
                    if (moment(date).format("YYYYMMDDHHmm") > moment(new Date()).subtract(3,'hours').format("YYYYMMDDHHmm")) { return "upcoming" } 
                }, 
                matchTime(date) {
                    var a = moment(new Date());
                    var matchTime = a.diff(moment(date), 'minutes');
                    if (matchTime <= 45) {
                        return matchTime + "'"
                    } else if (matchTime < 48) {
                        return "45 + " + (matchTime - 45) + "'"
                    } else if (matchTime <= 107) {
                        return (matchTime - 17) + "'"
                    } else {
                        return "90 + " + (matchTime - 107) + "'"
                    }
                }
            }
        })
        document.getElementById("app").classList.remove("visually-hidden");
        scrollToTargetAdjusted();
        document.getElementById("spinner").classList.add("visually-hidden");
    }

    function scoreApp(scorebord) {
        var app = new Vue({
            el: '#scoreApp',
            data: {
                scores: scorebord,
                player: player
            },
            methods: {
                tablePlayer(name) {
                    if (name == player.substring(6,99)) {return 'table-warning'}
                }
            }
        })
    }

    function pronoApp(id) {

        document.getElementById('pronoTable').innerHTML = "";
        document.getElementById('pronoOverview').innerHTML = "";
        data_sb_o.sort(function(a,b){ return b[id + '_s'] -  a[id + '_s']});

        var prono_thuis = 0
        var prono_gelijk = 0
        var prono_uit = 0
        var pt_c = ''
        var pg_c = ''
        var pu_c = ''

        for(i=0; i < data_sb_o.length; i++) {
            if(data_sb_o[i].Speler_c != null) {
                if (data_sb_o[i].Speler == player) {
                    document.getElementById('pronoTable').innerHTML += "<tr class='table-warning'><td><strong>" + data_sb_o[i].Speler_c + "</strong></td><td>" + data_sb_o[i][id + '_h'] + "</td><td>" + data_sb_o[i][id + '_a'] + "</td><td><strong>" + data_sb_o[i][id + '_s'] + "</strong></td></tr>"
                    if (data_sb_o[i][id + '_h'] > data_sb_o[i][id + '_a']) {
                        pt_c = 'table-warning'
                    } else if (data_sb_o[i][id + '_h'] == data_sb_o[i][id + '_a']) {
                        pg_c = 'table-warning'
                    } else if (data_sb_o[i][id + '_h'] < data_sb_o[i][id + '_a']) {
                        pu_c = 'table-warning'
                    }
                } else {
                    document.getElementById('pronoTable').innerHTML += "<tr><td><strong>" + data_sb_o[i].Speler_c + "</strong></td><td>" + data_sb_o[i][id + '_h'] + "</td><td>" + data_sb_o[i][id + '_a'] + "</td><td><strong>" + data_sb_o[i][id + '_s'] + "</strong></td></tr>"
                }
                if (data_sb_o[i][id + '_h'] > data_sb_o[i][id + '_a'] && data_sb_o[i][id + '_h'] != '') {
                    prono_thuis += 1
                } else if (data_sb_o[i][id + '_h'] == data_sb_o[i][id + '_a'] && data_sb_o[i][id + '_h'] != '') {
                    prono_gelijk += 1
                } else if (data_sb_o[i][id + '_h'] < data_sb_o[i][id + '_a'] && data_sb_o[i][id + '_h'] != '') {
                    prono_uit += 1 
                }
            }
        }
        var prono_tot = prono_thuis + prono_uit + prono_gelijk

        var prono_string = "<tr><td class='" + pt_c + "'>" + prono_thuis + " <small>(" + (prono_thuis/prono_tot * 100).toFixed(1) + "%)</small></td>"
        prono_string += "<td class='" + pg_c + "'>" + prono_gelijk + " <small>(" + (prono_gelijk/prono_tot * 100).toFixed(1) + "%)</small></td>" 
        prono_string += "<td class='" + pu_c + "'>" + prono_uit + " <small>(" + (prono_uit/prono_tot * 100).toFixed(1) + "%)</small></td></tr>"

        document.getElementById('pronoOverview').innerHTML += prono_string

        pronoModal.show()
    }

    var infoModal = new bootstrap.Modal(document.getElementById('infoModal'))
    var scoreModal = new bootstrap.Modal(document.getElementById('scoreModal'))
    var pronoModal = new bootstrap.Modal(document.getElementById('pronoModal'))


    // Scroll into view
    function scrollToTargetAdjusted(){
        var element = document.getElementById('upcoming');
        var headerOffset = document.getElementById('banner').offsetHeight + 8;
        document.body.style.padding =  headerOffset +  "px 0 0 0 ";
        if (element != null) {
            var elementPosition = element.getBoundingClientRect().top;
            var offsetPosition = elementPosition - headerOffset;
        
            window.scrollTo({
                top: offsetPosition,
                behavior: "instant",
                duration: 0
            });
        }
        
    }