window.addEventListener('DOMContentLoaded', init_api)

console.log("v1.2")
    // Scorebord - nog verder te ontwikkelen.
    var scorebord = []
    var poule = "Feest"
    // Haalt speler ID op uit de link (id). 
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var player = urlParams.get('id')
    // Wordt opgehaald uit ServiceWorker of toegevoegd indien nog niet bestaat.
    var ls_player = localStorage.getItem('player_id')
    if (player != null && ls_player == null) {
        // Als er nog niks in de localstorage opgeslaan is.
        localStorage.setItem('player_id', player);
        console.log("New player added.")
    } else if (ls_player != null && player != ls_player && player != null) {
        localStorage.setItem('player_id', player);
        console.log("Player changed.")
    }
    player = localStorage.getItem('player_id');

    // API calls
    const link =
        'https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2Fe%2F2PACX-1vTowErCeF3spB93eqdgPniVPsxHLaUn4VQdvEKQTLt9_RP6DIWuE9AkS2sBam7Diqdg5cjlpKuiIPmj%2Fpub%3Fgid%3D2116746882%26single%3Dtrue%26output%3Dcsv'
    const link_sb =
        'https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2Fe%2F2PACX-1vTlMbo20xUnE0S1BYBV-TbMusJqx_vNJiTTPKsMsbUJUxj7wVzVCXDj-mojSd4-gKcrcJIBLRXIVCgA%2Fpub%3Fgid%3D1677703325%26single%3Dtrue%26output%3Dcsv'
  
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
                data_sb = results.data
                for (i = 0; i < data_sb.length; i++) {
                    if (data_sb[i].Groep === poule) {
                        if (data_sb[i].Speler == player) {
                            var data_score_player = data_sb[i]
                        }
                        data_sb[i].Speler_c = (data_sb[i].Speler).substr(6,99)
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
                    if (moment(date).format("YYYYMMDD") > moment(new Date()).subtract(1,'days').format("YYYYMMDD")) { return "upcoming" } 
                }, 
                matchTime(date) {
                    var matchTime = moment(new Date()).format("HHmm") - moment(date).format("HHmm")
                    if (matchTime <= 45) {
                        return matchTime + "'"
                    } else if (matchTime < 48) {
                        return "45 + " + (matchTime - 45) + "'"
                    } else if (matchTime <= 107) {
                        return (matchTime - 17) + "'"
                    } else {
                        return "90 + " + (matchTime - 90) + "'"
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
                    if (name == player.substr(6,99)) {return 'table-warning'}
                }
            }
        })
    }

    function pronoApp(id) {

        document.getElementById('pronoTable').innerHTML = "";
        data_sb_o.sort(function(a,b){ return b[id + '_s'] -  a[id + '_s']});

        for(i=0; i < data_sb_o.length; i++) {
            if(data_sb_o[i].Speler_c != null) {
                document.getElementById('pronoTable').innerHTML += "<tr><td><strong>" + data_sb_o[i].Speler_c + "</strong></td><td>" + data_sb_o[i][id + '_h'] + "</td><td>" + data_sb_o[i][id + '_a'] + "</td><td><strong>" + data_sb_o[i][id + '_s'] + "</strong></td></tr>"
            }
        }

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
        var elementPosition = element.getBoundingClientRect().top;
        var offsetPosition = elementPosition - headerOffset;
    
        window.scrollTo({
             top: offsetPosition,
             behavior: "instant",
             duration: 0
        });
        
    }