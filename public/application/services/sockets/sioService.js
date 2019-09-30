var sioService = module.exports = {};
var settings = require('./../../config/sioConfig');
var dbService = require('./../../services/db/dbService');
var ws = require("nodejs-websocket");
var server;

sioService.start = function () {

    server = ws.createServer(function (conn) {
        console.log("New connection")
        server.connections.forEach(function (conn) {
            var socketStream = conn.beginBinary().end("New connection");
        })
        conn.on("text", function (str) {
            console.log("Received " + str)
            conn.sendText(str.toUpperCase() + "!!!")
        })
        conn.on("close", function (code, reason) {
            console.log("Connection closed")
        })
    }).listen(process.env.YIC_WS_PORT || '5040')
};

sioService.sendHouse = function (data) {
    data.token = "house";
    if(server!=null)
    server.connections.forEach(function (conn) {
        console.log('sendHouse data: ' + JSON.stringify(data));
        var socketStream = conn.beginBinary().end(JSON.stringify(data));
    })

}

sioService.sendWindmill = function (data) {
    data.token = "windwill";
    if(server!=null)
    server.connections.forEach(function (conn) {
        console.log('sendWindmill data: ' + JSON.stringify(data));
        var socketStream = conn.beginBinary().end(JSON.stringify(data));
    })
}

sioService.sendCar = function (data) {
    data.token = "car";
     if(server!=null)
    server.connections.forEach(function (conn) {
        console.log('sendCar data: ' + JSON.stringify(data));
        var socketStream = conn.beginBinary().end(JSON.stringify(data));
    })
}