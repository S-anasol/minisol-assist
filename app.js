var AppConfig = require('./config/config.json');

/*init*/
var AppHelper = require('./libs/Helper.js');
var express = require('express');
var pathLoader = require('path');
var consolidate = require('consolidate');
var swig = require('swig');
var AppCurl = require('curlrequest');
var Application = express();
Application.SocketIO = require("socket.io").listen(AppConfig.socketio.listen);


/*load app routes*/
var AppRoutes = require('./routes/index');
Application.use('/', AppRoutes);

/*app config init*/
Application.use(express.static(pathLoader.join(__dirname, AppConfig.express.static)));
Application.engine('html', consolidate.swig);
Application.set('view engine', 'html');
Application.set('views', pathLoader.join(__dirname, AppConfig.express.views));
//Application.use('port', AppConfig.express.listen);


/*app error*/
Application.use(function(req, res, next) {
	var error = new Error('Not found');
	error.status = 404;
	next(error);
});


Application.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.sendFile('error');
});

/*socket events*/
var conferenceRooms = {};//[roomId] => {users: {},users_count : (int)}
Application.SocketIO.on('connection', function(socket) {
	__log('new user connected with id: ' + socket.id);
	socket.on('auth', function(data) {
		if(!data.user) data.user = 'User ' + (new Date()).getTime();
		// var CurlRequestUrl = AppConfig.vox.api + 'BindUser/'
		// 	+ '?account_name=' + AppConfig.vox.acc_name
		// 	+ '&api_key=' + AppConfig.vox.app_key
		// 	+ '&user_name=' + data.user
		// 	+ '&application_name=' + AppConfig.vox.app_name;

		// AppCurl.request({url : CurlRequestUrl}, function(answer) {
		// 	console.log('answer: ',answer);
		// });
	});
});

function __log(message){
	if(typeof message == "string") {
		console.log('[ '+(new Date()).getTime()+' ] ' + message);
	}else{
		console.log('[ '+(new Date()).getTime()+' ] ', message);
	}
}

module.exports = Application;