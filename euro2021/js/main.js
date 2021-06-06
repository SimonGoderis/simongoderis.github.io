window.addEventListener('DOMContentLoaded', init_api)
    // Scorebord - nog verder te ontwikkelen.
    var scorebord = []

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

    var scorebord_arr

    function init_score(data_api) {
        Papa.parse(decodeURIComponent(link_sb), {
            download: true,
            header: true,
            complete: function (results) {
                var data_sb = results.data
                for (i = 0; i < data_sb.length; i++) {
                    if (data_sb[i].Speler == player) {
                        var data_score_player = data_sb[i]
                    }
                    data_sb[i].Speler_c = (data_sb[i].Speler).substr(6,99)
                    scorebord.push((({ Speler_c, Score, Groep, Betaald}) => ({ Speler_c, Score, Groep, Betaald}))(data_sb[i]))
                }                
                vueApp(data_api, data_score_player);

                scorebord.sort(function(a,b){ return b.Score - a.Score; });
                scorebord.forEach(function(player, i, arr) {
                    player.rank = i === 0 || player.Score != arr[i-1].Score
                                ? i + 1
                                : arr[i-1].rank;
                });
                scoreApp(scorebord);
                console.log(scorebord[0].Score);
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
                }
            }
        })
        document.getElementById("spinner").classList.add("visually-hidden")
        document.getElementById("app").classList.remove("visually-hidden")
    }

    function scoreApp(scorebord) {
        var app = new Vue({
            el: '#scoreApp',
            data: {
                scores: scorebord
            }
        })
    }

    var infoModal = new bootstrap.Modal(document.getElementById('infoModal'))
    var scoreModal = new bootstrap.Modal(document.getElementById('scoreModal'))