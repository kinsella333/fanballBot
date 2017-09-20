var express = require('express');
var scraper = require('./screenScrape');
var Promise = require('promise');
var CronJob = require('cron').CronJob;

var server = express();
const bodyParser = require('body-parser');
server.use(bodyParser.json());

// POST method route
server.all('/', function (req, res) {
  console.log("Hit!");
  var promise = new Promise(function (resolve, reject) {
    scraper.findPlayer(req.body, resolve);
  }).then(function(response){
    console.log(response);
    res.setHeader('Content-Type', 'application/json');
    var message = {
                        "speech": "Barack Hussein Obama II was the 44th and current President of the United States.",
                        "displayText": "Barack Hussein Obama II was the 44th and current President of the United States, and the first African American to hold the office. Born in Honolulu, Hawaii, Obama is a graduate of Columbia University   and Harvard Law School, where ",
                        "data": [],
                        "contextOut": [],
                        "source": "DuckDuck"
                      };
    res.send(JSON.stringify(message));
  });
});

server.listen(8008, function () {
  console.log('Listening on port 8008.')
  scraper.findPlayer();
  var j = new CronJob('00 00 12 * * 1-7', function(){
    console.log("Running players service call");
    scraper.grabAllPlayers();
 }, true, "America/Chicago");
});
