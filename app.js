var AppConfig = require('./config/config.json');
var MinisolAssistDictionary = require('./config/dictionary.json');

/*init*/
var AppHelper = require('./libs/Helper.js');
var express = require('express');
var pathLoader = require('path');
var consolidate = require('consolidate');
var swig = require('swig');
var AppCurl = require('curlrequest');
var MinisolAssist = require('./libs/MinisolAssist.js')(MinisolAssistDictionary);

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
	res.render('error', {});
});

/*socket events*/
var chatMessages = {};//room:int,message:string,from:string



Application.SocketIO.on('connection', function(socket) {
	__log('new user connected with id: ' + socket.id);
	
	socket.on('auth', function(data) {
		if(!data.user) data.user = 'User_' + (new Date()).getTime();
		var username = AppHelper.getLogin(10);
		var requestURI = AppConfig.vox.api + "AddUser/"
			+ "?account_name=" + AppConfig.vox.acc_name
			+ "&api_key=" + AppConfig.vox.app_key
			+ "&user_name=" + username
			+ "&user_display_name=" + data.user.split(' ').join('%20')
			+ "&user_password=" + AppConfig.vox.secret;
		AppCurl.request({url : requestURI}, function(err, parts) {
			if(parts){
				var auth = JSON.parse(parts);
				if(auth.result){
					var requestURI = AppConfig.vox.api + 'BindUser/'
						+ "?account_name=" + AppConfig.vox.acc_name
						+ "&api_key=" + AppConfig.vox.app_key
						+ "&user_name=" + username
						+ "&application_name=" + AppConfig.vox.app_name;
					console.log(requestURI);
					AppCurl.request({url : requestURI}, function(err, parts) {
						if(parts){
							parts = JSON.parse(parts);
							if(parts.result == 1){
								socket.emit('auth', {'api_result' : true, 'username' : username});
							}else{
								socket.emit('auth',{'api_result' : false});
							}
						}
					});
					
				}else{
					socket.emit('auth',{'api_result' : false});
				}
			}else{
				socket.emit('auth',{'api_result' : false});
			}
		});
	});

	socket.on('auth-hash', function(data) {
		var result = AppHelper.calcHash(data.key, data.username, AppConfig.vox.secret);
		console.log(data.key, data.username);
		socket.emit('auth-hash',{'result' : result});
	});

	socket.on('join-room', function(data){
		if(data && data.room){
			if(!chatMessages[data.room]) chatMessages[data.room] = [];
			socket.roomID = data.room;
			console.log('user ' + socket.id + ' join to room: ' + data.room);
			socket.join(data.room);

			
			socket.emit('messages',chatMessages[data.room]);
		}
	});

	socket.on('new-message', function(data){
		console.log('new message in room: ' + data.room + ' from user: ' + data.from);
		if(data.room && data.message && data.from) {
			if(!chatMessages[data.room]) chatMessages[data.room] = [];
			chatMessages[data.room].push({from: data.from,message: data.message});
			socket.broadcast.to(data.room).emit('new-message',data);
			socket.emit('new-message',data);
			console.log(chatMessages);
		}
	});

	socket.on('minisol-assist-speech', function(data) {
		console.log(data);
		if(data && data.message && data.message.length > 0){
			var message = data.message.trim();
			var result = MinisolAssist.getRecommendation(message);
			if(result && result[0]) {
				for(var i in Application.SocketIO.sockets.sockets){
					if(Application.SocketIO.sockets.sockets[i].roomID == data.room){
						Application.SocketIO.sockets.sockets[i].emit('rec',result[0]);
					}
				}
			}
			// socket.broadcast.to(data.room).emit('rec',{results : result});
			// socket.emit('rec',{results : result});
		}
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