var express = require('express');
var fs = require('fs');
var path = require("path");
var app = express();
var bodyParser = require('body-parser');

var roomList = require('./routes/roomList');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var session = require('express-session');

var room = require('./routes/roomList');
var User = require('./models/user');

var key = fs.readFileSync('keys/newkey.pem');
var cert = fs.readFileSync('keys/cert.pem');
//https key
var https_options = {
    key: key,
    cert: cert
};
var server = require('https').createServer(https_options,app);
var SkyRTC = require('skyrtc').listen(server);

var port = process.env.PORT || 443;
server.listen(port);

//Configure request header
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    next();
});

//Link to mongodb database
mongoose.connect('mongodb://localhost/skyRtc');

//Configure the public resource folder
app.use(express.static(path.join(__dirname, 'public')));

//Configure post request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Configure cookies
app.use(cookieParser());

//Configure the front-end template as ejs
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

SkyRTC.rtc.on('new_connect', function(socket) {
    console.log('Create new connection');
});

SkyRTC.rtc.on('remove_peer', function(socketId) {
    roomList.leaveRoom(socketId);
    console.log(socketId + " user left");
});

SkyRTC.rtc.on('new_peer', function(socket, room) {
    roomList.enterRoomSocket(room, socket.id);
    console.log("new user " + socket.id + " join room " + room);
});

SkyRTC.rtc.on('socket_message', function(socket, msg) {
    console.log("Received from " + socket.id + " new message： " + msg);
});

SkyRTC.rtc.on('ice_candidate', function(socket, ice_candidate) {
    console.log("Received from " + socket.id + " the ICE Candidate");
});

SkyRTC.rtc.on('offer', function(socket, offer) {
    console.log("Received from " + socket.id + " the Offer");
});

SkyRTC.rtc.on('answer', function(socket, answer) {
    console.log("Received from " + socket.id + " the Answer");
});

SkyRTC.rtc.on('error', function(error) {
    console.log("An error occurred： " + error.message);
});

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: false,
    cookie:{
        maxAge: 1000*60*100 //Cookie valid time 10min
    }
}));

app.get('/', function(req, res) {
    if(haveLogined(req.session.user)){
        res.redirect('/roomList');
    }else{
        res.render('index',{'message':''});
    }
});

app.get('/room', function(req, res) {
    if(haveLogined(req.session.user)){
        res.render('room',{username:req.session.user.username});
    }else{
        res.redirect('/');
    }
});

app.get('/roomList', function (req, res) {
    if(haveLogined(req.session.user)){
        res.render('roomList',{roomList:SkyRTC.rtc.rooms,username:req.session.user.username});
    }else{
        res.redirect('/');
    }
});

app.get('/contact', function (req, res) {
    if(haveLogined(req.session.user)){
        res.render('contact',{username:req.session.user.username});
    }else{
        res.redirect('/');
    }
});

app.post('/enterRoom', function (req, res) {
    if(haveLogined(req.session.user)){
        room.enterRoomHttp(req.body.roomNumber,req.session.user.username);
        res.redirect('/room#'+req.body.roomNumber);
    }else{
        res.redirect('/');
    }
});

app.post('/login', function (req, res) {
    User.findByUsername(req.body.username,function (err,date) {
        if(err){
            res.render('error',{'message':err})
        }else{
            if(date==null){
                res.render('index',{'message':'Wrong username of password!'});
            }else if(req.body.username==date.username&&req.body.password==date.password){
                req.session.user = date;
                res.redirect('/roomList');
            }else{
                res.render('index',{'message':'Wrong username of password！'});
            }
        }
    });
});

app.get('/logout', function (req, res) {
    req.session.user = undefined;
    res.redirect('/');
});

app.get('/addAdmin', function (req, res) {
    res.render('addAdmin');
});

app.post('/addAdmin', function (req, res) {
    var user = new User({
        username: req.body.username,
        password: req.body.password,
        nickname: req.body.nickname,
        type: req.body.type
    });
    user.save(function (err) {
        if (err){
            res.render('state',{state:'Failed to add user！'});
        }else{
            res.render('state',{state:'User added successfully！'});
        }
    });
});

app.get('/admin', function (req, res) {
    if(isAdmin()){
        res.render('admin/index');
    }else{
        res.redirect('/');
    }
});

app.post('/connectSuccess', function (req, res) {
    for(var room in SkyRTC.rtc.rooms){
        for(var i=0; i<SkyRTC.rtc.rooms[room].length;i++){
            if(SkyRTC.rtc.rooms[room][i].id == req.body.socketId){
                SkyRTC.rtc.rooms[room][i].ip = req.ip;
                SkyRTC.rtc.rooms[room][i].username = req.session.user.username;
            }
        }
    }
    res.write("success");
    res.end();
});

var isAdmin = function () {
    return true;
};

//Determine whether the user is logged in
var haveLogined = function (user) {
    if(typeof(user) == "undefined"){
        return false;
    }else{
        return true;
    }
};