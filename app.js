var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var app = express();
var api = require('./public/application/config/api');
var sioServise = require('./public/application/services/sockets/sioService');
var dbService = require('./public/application/services/db/dbService');
var cors = require('cors')

const port = process.env.YIC_PORT || 8080;

sioServise.start();
dbService.start();
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));


app.post(api.REGISTRATION, function (req, res) {
    console.log('send request : ' + JSON.stringify(req.body));
    dbService.user(req.body, function (err, msg) {
        res.send(msg);
    })
});
app.post(api.HOUSE, function (req, res) {
    console.log('send HOUSE request : ' + JSON.stringify(req.body));
    var response = new Object();
    response.success = true;
    if (dbService.tokenIsValid(req.body)) {
        sioServise.sendHouse(req.body);
        res.send(response);
    }
    else {
        response.success = false;
        response.description = "Token is invalid";
        res.send(response);
    }
});
app.post(api.WINDMILL, function (req, res) {
    console.log('send WINDMILL request : ' + JSON.stringify(req.body));
    var response = new Object();
    response.success = true;
    if (dbService.tokenIsValid(req.body)) {
        sioServise.sendWindmill(req.body);
        res.send(response);
    }
    else {
        response.success = false;
        response.description = "Token is invalid";
        res.send(response);
    }
});
app.post(api.TRAFFIC, function (req, res) {
    console.log('send TRAFFIC request : ' + JSON.stringify(req.body));
    var response = new Object();
    response.success = true;
    sioServise.sendCar(req.body);
    res.send(response);
});

app.get(api.STATUS, function (req, res) {
    console.log('Status OK');
    res.status(200).send({
        success: 'true',
        message: 'Service OK',
          })
});

app.get(api.VERIFY, function (req, res) {
    console.log('send request : ' + JSON.stringify(req.query));
    dbService.verification(req.query, function (err, msg) {
        res.send(msg);
    })
});

app.listen(port, function () {
    console.log(`Express server listening on port ${port}`);
});


JSON.stringifyOnce = function (obj, replacer, indent) {
    var printedObjects = [];
    var printedObjectKeys = [];

    function printOnceReplacer(key, value) {
        if (printedObjects.length > 2000) { 
            return 'object too long';
        }
        var printedObjIndex = false;
        printedObjects.forEach(function (obj, index) {
            if (obj === value) {
                printedObjIndex = index;
            }
        });

        if (key == '') { //root element
            printedObjects.push(obj);
            printedObjectKeys.push("root");
            return value;
        }

        else if (printedObjIndex + "" != "false" && typeof(value) == "object") {
            if (printedObjectKeys[printedObjIndex] == "root") {
                return "(pointer to root)";
            } else {
                return "(see " + ((!!value && !!value.constructor) ? value.constructor.name.toLowerCase() : typeof(value)) + " with key " + printedObjectKeys[printedObjIndex] + ")";
            }
        } else {

            var qualifiedKey = key || "(empty key)";
            printedObjects.push(value);
            printedObjectKeys.push(qualifiedKey);
            if (replacer) {
                return replacer(key, value);
            } else {
                return value;
            }
        }
    }

    return JSON.stringify(obj, printOnceReplacer, indent);
};
module.exports = app;
