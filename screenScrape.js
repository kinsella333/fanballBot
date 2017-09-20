exports.findPlayer = function(playerName){
  // var fs = require('fs');
  // var obj = JSON.parse(fs.readFileSync('players.json', 'utf8'));
  //
  // console.log(obj[0][0]);
}

exports.grabAllPlayers = function(){
  var request = require('request');
  var cheerio = require('cheerio');
  var Promise = require('promise');
  var jsonfile = require('jsonfile');
  var cheerioTableparser = require('cheerio-tableparser');

  var players = {};
  var teamUrls = {};

  var promise = new Promise(function (resolve, reject) {
    var url = 'http://www.espn.com/nfl/players';

    request(url, function(error, response, html){
       if(!error){
          var $ = cheerio.load(html);
          var i = 0;

          $('a').each(function(){
            var link = $(this).attr('href');

            if(link.includes('/nfl/team/roster')){
              teamUrls[i] = {
                'team':$(this).text(),
                'link':url.replace("/nfl/players",link)
              };
              i++;
            }
          });
        }
        resolve(teamUrls);
    });
  }).then(function(teamUrls){
    var k = 0, j=0;
    while(k < Object.keys(teamUrls).length){
      var url = teamUrls[k].link;
      var teamName = teamUrls[k].team;

      if(!players[teamName]){
        k++;
        var promise2 = new Promise(function (resolve, reject){
          request(url, function(error, response, html){
               if(!error){
                  var $ = cheerio.load(html);
                  var i = 0, l = 0;
                  var rows = {}, temp = {};
                  var team;

                  $('h1.h2').filter(function(){
                    team = $(this).text();
                    rows["Team"] = team;
                  });

                  cheerioTableparser($);
                  data = $('tbody').parsetable(false, false, false);
                  for(i = 0; i < data[0].length; i++){
                    if(!data[2][i].includes('<a') && data[1][i].length > 0){
                      var link = data[1][i].split(/"/)[1];
                      var name = (data[1][i].split(/>([^']+)</)[1]).replace(/&apos;/, "\'")
                      rows[name] = {
                        "Name":name,
                        "Position":data[2][i],
                        "Number":data[0][i],
                        "Link":link,
                        "Team": team.replace(" Roster", "")
                      };
                      l++;
                    }
                  }
               }else{
                 reject("ERROR");
               }
               resolve(rows);
          });
        }).then(function(rows){
            delete rows["Team"];

            players[j] = rows;
            j++;
            if(Object.keys(players).length > 31){
              jsonfile.writeFile("players.json",players,{spaces: 2},function(err) {
                  if(err) {
                      return console.log(err);
                  }
                  console.log("Players written to file.");
                  cleanJSON();
              });
            }
        });
      }
    }
  });
}

function getQbData(week, year,callback){
  var request = require('request');
  var cheerio = require('cheerio');
  var Promise = require('promise');
  var jsonfile = require('jsonfile');
  var cheerioTableparser = require('cheerio-tableparser');
  console.log(week);

  var url = encodeURI("http://thehuddle.com/stats/" + year + "/plays_weekly.php?week=" + week + "&pos=qb");

  var promise = new Promise(function (resolve, reject){
    request(url, function(error, response, html){
      var $ = cheerio.load(html);
      var qbs = [];
      var k = 0;

      cheerioTableparser($);
      data = $('tbody').parsetable(false, false, true);
      for(i = 0; i < data[0].length; i++){
        qbs[k] = {
          "Name":data[0][i],
          "Year":year,
          "Week":week,
          "Plays":data[2][i],
          "RunAttempts":data[4][i],
          "TotalRushingYards": data[5][i],
          "RushingTouchdowns": data[6][i],
          "PassAttempts":data[7][i],
          "PassCompletions":data[8][i],
          "TotalPassingYards":data[9][i],
          "PassingTouchdowns":data[10][i],
          "Fumbles":data[11][i],
          "Interceptions":data[12][i],
          "FantasyPoints":data[3][i]
        };
        k++;
      }
      resolve(qbs);
    });
  }).then(function(qbs){
    callback(qbs);
  });
}

function formatQbList(){
  var json2csv = require('json2csv');
  var fs = require('fs');
  var Promise = require('promise');

  var qbData = [];
  var year = 2006, week;
  var k = 1;

    var promise = new Promise(function (resolve, reject){
      week = 1;
      while(week < 22){
        getQbData(week, year, function(qbs){
          for(var i = 0; i < qbs.length; i++){
            qbData.push(qbs[i]);
          }
          k++;
          if(k > 21){
            resolve(qbData);
          }
          console.log(k);
        });
        week++;
      }
    }).then(function(qbData){
        console.log(qbData);
        var fields = ["Name", "Year", "Week","Plays", "RunAttempts", "TotalRushingYards",
        "RushingTouchdowns", "PassAttempts","PassCompletions","TotalPassingYards",
        "PassingTouchdowns","Fumbles","Interceptions","FantasyPoints"];

        var csv = json2csv({ data: qbData, fields: fields });
        fs.writeFile('qbData.csv', csv, function(err) {
          if (err) throw err;
          console.log('file saved');
        });
    });
}

function cleanJSON(){
  var fs = require('fs');
  var obj = JSON.parse(fs.readFileSync('players.json', 'utf8'));
  var jsonfile = require('jsonfile');

  var players = {}, finalPlayers = {};

  for(var i = 0; i < Object.keys(obj).length; i++){
    Object.keys(obj[i]).forEach(function(key){
      players[key] = obj[i][key];
    });
  }
  
  var playersArr = Object.keys(players);
  playersArr = quickSort(playersArr, 0, playersArr.length -1);

  for(var k = 0; k < playersArr.length; k++){
    finalPlayers[playersArr[k]] = players[playersArr[k]];
  }

  jsonfile.writeFile("players.json",finalPlayers,{spaces: 2},function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("Players Cleaned");
  });

}

function quickSort(arr, left, right){
   var len = arr.length,
   pivot,
   partitionIndex;

  if(left < right){
    pivot = right;
    partitionIndex = partition(arr, pivot, left, right);

   //sort left and right
   quickSort(arr, left, partitionIndex - 1);
   quickSort(arr, partitionIndex + 1, right);
  }
  return arr;
}


function partition(arr, pivot, left, right){
   var pivotValue = arr[pivot],
       partitionIndex = left;

   for(var i = left; i < right; i++){
    if(arr[i] < pivotValue){
      swap(arr, i, partitionIndex);
      partitionIndex++;
    }
  }
  swap(arr, right, partitionIndex);
  return partitionIndex;
}

function swap(arr, i, j){
   var temp = arr[i];
   arr[i] = arr[j];
   arr[j] = temp;
}
