var dbService = module.exports = {};
var mongoose = require('mongoose');
var async = require('async');
var req = require('./requiredData');
const mailjet = require ('node-mailjet')
.connect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE);
var randtoken = require('rand-token');
var mailsettings = require('./../../config/mailSettings');
var api = require('./../../config/api');
require('array.prototype.find');


const {
    MONGODB_ADDON_USER,
    MONGODB_ADDON_PASSWORD,
    MONGODB_ADDON_HOST,
    MONGODB_ADDON_PORT,
    MONGODB_ADDON_DB
  } = process.env;

const smtp_host = process.env.SMTP_HOST || "localhost";
const smtp_port = process.env.SMTP_PORT || 25;
const smtp_user = process.env.SMTP_USER;
const smtp_password = process.env.SMTP_PORT;

dbService.tokenIsValid = function (rq) {
    /*
     req.users.findOne({token: rq.token}, function (err, user) {
     if (err) {
     return false;
     }
     else {
     if (user != null)
     return true;
     else return false;
     }
     });*/
    return true;
}
const url = `mongodb://${MONGODB_ADDON_USER}:${MONGODB_ADDON_PASSWORD}@${MONGODB_ADDON_HOST}:${MONGODB_ADDON_PORT}/${MONGODB_ADDON_DB}`;

dbService.start = function () {
    mongoose.Promise = global.Promise;
    mongoose.connect(url);
    var db = mongoose.connection;
    db.on('error', function (err) {
        console.log('connection error:', err.message);
    });
    db.once('open', function callback() {
        console.log("A successful connection to the database!");
    });
};

dbService.user = function (rq, cb) {
    var self = this;
    if (rq.action == 'registration')
        self.createTempUser(JSON.parse(rq.data), cb);
    else if (rq.action == 'login')
        self.loginUser(JSON.parse(rq.data), cb);

};

dbService.createTempUser = function (data, cb) {
    var response = new Object();
    response.success = false;
    if (data.userName != null && data.fullName != null && data.email != null) {
        async.waterfall([
            function (cb) {
                req.users.findOne({email: data.email}, function (err, user) {
                    if (err) {
                        cb("error", null);
                    }
                    else {
                        cb(null, user);
                    }
                });
            },
            function (user, cb) {
                if (user != null) {
                    response.description = "Email already in use";
                    cb('break', response);
                } else {
                    req.users.count({}, function (err, count) {
                        if (err) {
                            cb("error", null);
                        }
                        else {
                            cb(null, count);
                        }
                    });
                }
            },
            function (count, cb) {
                var token = randtoken.generate(40);
                var date = new Date();
                var user = new req.users({
                    userid: count + 1,
                    userName: data.userName,
                    fullName: data.fullName,
                    email: data.email,
                    timestamp: date.getTime(),
                    token: token
                });
                user.save(function (err) {
                    if (err) {
                        cb("error", null);
                    }
                    else {
                        var url = mailsettings.ADDRESS + api.VERIFY + '/?' + 'token=' + token;
                        const request = mailjet
                        .post("send", {'version': 'v3.1'})
                        .request({
                          "Messages":[
                            {
                              "From": {
                                "Email": "fralix@youritcity.io",
                                "Name": "Frédéric"
                              },
                              "To": [
                                {
                                  "Email": user.email,
                                  "Name": user.fullName
                                }
                              ],
                              "Subject": "New registration",
                              "TextPart": "",
                              "HTMLPart": '<b>' + data.fullName + ' ,thanks for you registration. For verification open this url : </b><a href="' + url + '">Open</a>',
                                                          }
                          ]
                        })
                        request
                          .then((result) => {
                            console.log(result.body)
                          })
                          .catch((err) => {
                            console.log(err.statusCode)
                          })
                        response.success = true;
                        response.success = true;
                        cb(null, response);
                    }
                });
            }
        ], function (err, data) {
            if (err && err != 'break') {
                response.description = "Something went wrong";
                cb(null, response);
                return;
            }
            if (data != null && data != undefined)
                response = data;
            cb(null, response);
        });
    }
    else {
        response.description = "Some field is empty";
        cb(null, response);
    }
};

dbService.getUserOnLogin = function (login, cb) {
    req.users.findOne({userName: login}, function (err, user) {
        if (err) {
            cb("error", null);
        }
        else {
            cb(null, user);
        }
    });
};

dbService.tokenSave = function (user, cb) {
    req.users.findOne({login: user.login}, function (err, _user) {
        if (err) {
            cb("error", null);
        }
        else {
            _user.token = user.token;
            _user.save(function (err) {
                if (err) {
                    cb("error");
                }
                else {
                    cb();
                }
            });

        }
    });
};
dbService.loginUser = function (data, cb) {
    var response = new Object();
    var self = this;
    response.success = false;
    if (data.login != null && data.password != null) {
        async.waterfall([
            function (cb) {
                self.getUserOnLogin(data.login, cb);
            },
            function (user, cb) {
                if (user != null) {
                    if (data.password != user.password) {
                        response.description = 'Password is incorrect';
                        cb("break", response);
                    }
                    else {
                        var token = randtoken.generate(10);
                        response.token = token;
                        user.token = token;
                        response.success = true;
                        var userData = new Object();
                        userData.token = user.token;
                        userData.userName = user.userName;

                        req.usersHouse.findOne({userid: user.userid}, function (err, data) {
                            if (err) {
                                cb("error", null);
                            }
                            else {

                                if (data != null) {
                                    var usersHouse = data.houses;
                                    userData.homes = usersHouse;

                                    req.usersWindmill.findOne({userid: user.userid}, function (err, data) {
                                        if (err) {
                                            console.log('error: ' + err);
                                            cb("error", null);
                                        }
                                        else {

                                            if (data != null) {
                                                var usersWindmill = data.windmills;
                                                userData.windmills = usersWindmill;
                                                req.usersCars.findOne({userid: user.userid}, function (err, data) {
                                                    if (err) {
                                                        cb("error", null);
                                                    }
                                                    else {
                                                        if (data != null) {
                                                            var usersCars = data.cars;
                                                            userData.cars = usersCars;
                                                            response.data = userData;
                                                            user.save(function (err) {
                                                                if (err) {
                                                                    cb("error", null);
                                                                }
                                                                else {
                                                                    cb(null, response);
                                                                }
                                                            });
                                                        }
                                                        else {
                                                            cb("error", null);
                                                        }
                                                    }
                                                });
                                            }
                                            else {
                                                cb("error", null);
                                            }
                                        }
                                    });
                                }
                                else {
                                    cb("error", null);
                                }
                            }
                        });
                    }
                }
                else {
                    response.description = 'User not found';
                    cb(null, response);
                }
            }
        ], function (err, data) {
            if (err && err != 'break') {
                console.log('err: ' + err);
                response.success = false;
                response.description = "Something went wrong";
                cb(err, response);
                return;
            }
            if (data != null && data != undefined)
                response = data;
            cb(null, response);
        });
    } else {
        response.description = "Some field is empty";
        cb(null, response);
    }
};

dbService.verification = function (data, cb) {
    var response = new Object();
    response.success = false;
    async.waterfall([
        function (cb) {
            req.users.findOne({token: data.token}, function (err, user) {
                if (err) {
                    cb("error", null);
                }
                else {
                    cb(null, user);
                }
            });
        },
        function (user, cb) {
            if (user != null) {
                var date = new Date();
                if (date.getTime() - user.timestamp > 30 * 60 * 1000) {
                    response.description = 'Activation time is over';
                } else {
                    user.token = '';
                    user.password = randtoken.generate(6);
                    user.save(function (err) {
                        if (err) {
                            cb("error", null);
                        }
                        else {
                            var userHouse = new req.usersHouse(
                                {userid: user.userid}
                            );
                            userHouse.houses = new Array();
                            for (i = 0; i < 3; i++) {
                                var house = new Object();
                                house.id = i;
                                house.name = 'House' + i;
                                userHouse.houses.push(house);
                            }
                            userHouse.save(function (err) {
                                if (err) {
                                    cb("error", null);
                                }
                                else {
                                    var useWindmill = new req.usersWindmill(
                                        {userid: user.userid}
                                    );
                                    useWindmill.windmills = new Array();
                                    for (i = 0; i < 2; i++) {
                                        var windmill = new Object();
                                        windmill.id = i;
                                        windmill.name = 'Windmill' + i;
                                        useWindmill.windmills.push(windmill);
                                    }
                                    useWindmill.save(function (err) {
                                        if (err) {
                                            cb("error", null);
                                        }
                                        else {
                                            var userCars = new req.usersCars({userid: user.userid});
                                            userCars.cars = new Array();
                                            var car = new Object();
                                            car.id = '0';
                                            userCars.cars.push(car);
                                            userCars.save(function (err) {
                                                if (err) {
                                                    cb("error", null);
                                                }
                                                else {
                                                    const request = mailjet
                                                    .post("send", {'version': 'v3.1'})
                                                    .request({
                                                        "Messages":[
                                                          {
                                                            "From": {
                                                              "Email": "fralix@youritcity.io",
                                                              "Name": "Frédéric"
                                                            },
                                                            "To": [
                                                              {
                                                                "Email": user.email,
                                                                "Name": user.fullName
                                                              }
                                                            ],
                                                            "Subject": "Your Credentials",
                                                            "TextPart": "",
                                                            "HTMLPart": '<b>' + user.fullName + ' ,thanks for you activation. Password: ' + user.password + '</b>',
                                                                                        }
                                                        ]
                                                      })
                                                      request
                                                      .then((result) => {
                                                        console.log(result.body)
                                                        console.log("Ok")

                                                      })
                                                      .catch((err) => {
                                                        console.log(err.statusCode)
                                                        console.log("Error")
                                                      })
                                                    response.success = true;
                                                    cb(null, response);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }

                    });
                }
            } else {
                response.description = 'User not found';
                cb(null, response);
            }
        }
    ], function (err, data) {
        if (err && err != 'break') {
            response.description = "Something went wrong";
            cb(null, response);
            return;
        }
        if (data != null && data != undefined)
            response = data;
        cb(null, response);
    });

}

dbService.saveSoiToken = function (data) {
    req.users.findOne({token: data.token}, function (err, user) {
        if (err) {
            cb("error", null);
        }
        else {
            if (user != null) {
                user.siotoken = data.siotoken;
                user.save(function (err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log('siotoken added');
                    }
                });
            }
        }
    });
}

dbService.getSiotoken = function (data,cb) {
    console.log('getSiotoken data: '+JSON.stringify(data));
    req.users.findOne({token: data.token}, function (err, user) {
        if (err) {
            cb('errer',null);
        }
        else {
            if (user != null) {
                console.log()
                cb(null,user.siotoken);
            }
        }
    });
}