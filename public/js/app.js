'use strict';

/*app config*/
var appConfig = {
	socket : {
		listen : "http://localhost:3001/"
	},
	vox : {
		app_name : 'videoconf',
		acc_name : 'andreym',
		connection_repeat : 2000,
		auth_link : "@videoconf.andreym.voximplant.com"
	},
	recognitor : {
		lang : 'ru-RU'
	}
};

/*init sockets*/
var SocketIO = io.connect(appConfig.socket.listen);


	/*init vox client*/
var VoxClientConnection = {
	name : null,
	room : Query.room || 1,
	display : Query.name || 'User_' + (new Date()).getTime(),
	connect : false,
	id : null,
	bound : null
};

/*vox ml. connections*/
var VoxMultiPeers = [];

/*init vox api*/
var minisolAssisVox = VoxImplant.getInstance();
minisolAssisVox.addEventListener(VoxImplant.Events.SDKReady, onSdkReady);
minisolAssisVox.addEventListener(VoxImplant.Events.ConnectionEstablished, onConnectionEstablished);
minisolAssisVox.addEventListener(VoxImplant.Events.ConnectionFailed, onConnectionFailed);
minisolAssisVox.addEventListener(VoxImplant.Events.ConnectionClosed, onConnectionClosed);
minisolAssisVox.addEventListener(VoxImplant.Events.AuthResult, onAuthResult);
minisolAssisVox.addEventListener(VoxImplant.Events.IncomingCall, onIncomingCall);
minisolAssisVox.addEventListener(VoxImplant.Events.MicAccessResult, onMicAccessResult);

/*rewrite api functions*/
minisolAssisVox.writeLog = function(message) {
	//console.log('LOG: ',message);
}
minisolAssisVox.writeTrace = function(message) {
	//console.log('TRACE: ', message);
}


/*sdk ready event*/
function onSdkReady(event) {
	console.log('onSDKReady event');
	voxConnection();
}

/*connection ready event*/
function onConnectionEstablished() {
	console.log('onConnectionEstablished event');
	SocketIO.emit('auth',{user : VoxClientConnection.display});
}

/*connection failed event*/
function onConnectionFailed() {
	console.error('connection failed');
}

/*connection close event*/
function onConnectionClosed() {
	console.log('vox close connection, reconnect ...');
	setTimeout(minisolAssisVox.connect, appConfig.vox.connection_repeat);
}

/*connection auth event*/
function onAuthResult(e) {
	console.log('auth result: ',e);
	if(e.result) {

		minisolAssistCall();
	}else{
		if (e.code == 302) {
			VoxClientConnection.id = VoxClientConnection.name+appConfig.vox.auth_link;
			SocketIO.emit('auth-hash',{key : e.key, username : VoxClientConnection.name});
		}else{
			console.error('error auth');
		}
	}
}

/*incoming call event*/
function onIncomingCall(e) {
	console.log('onIncomingCall: ',e);
	var headers = e.call.headers();
	console.log("Incoming call from: "+e.call.number());
	VoxMultiPeers.push({call: e.call, displayName: headers["X-DisplayName"]});

	e.call.addEventListener(VoxImplant.CallEvents.Disconnected, function(e) {
		minisolAssisRemoveCall(e.call);
	});

	e.call.addEventListener(VoxImplant.CallEvents.Failed, function(e) {
		removePeerCall(e.call);
	});

	e.call.addEventListener(VoxImplant.CallEvents.Connected, function(e) {
		e.call.showRemoteVideo(true);
		minisolAssisVox.setCallActive(e.call, true);
		document.getElementById(e.call.getVideoElementId()).play();
	});

	e.call.addEventListener('ICETimeout', function(e){
		console.log('ICE Timeout. Sending notification to the caller.');
		headers = e.call.headers();
		e.call.hangup();
		outboundCall.sendMessage(JSON.stringify({type: "ICE_FAILED", caller: e.call.number(), callee: VoxClientConnection.name, displayName: headers["X-DisplayName"]}));
	});
	e.call.answer();
}

/*mic access event*/
function onMicAccessResult() {
	console.log('onMicAccessResult');
	minisolAssisVox.showLocalVideo(true);
	SocketIO.emit('join-room',{room : VoxClientConnection.room});
}

/*connect to vox*/
function voxConnection() {
	minisolAssisVox.connect();
}


/*bound event*/

function onCallConnected(e) {
	console.log("CallConnected: "+e.call.id());
	outboundCall = e.call;
	outboundCall.showRemoteVideo(false);
	VoxClientConnection.connect = true;
}

function onCallDisconnected(e) {
	console.log('onCallDisconnected event');
	outboundCall = null;
}

function onCallFailed(e) {
	console.error("CallFailed: " + outboundCall.id() + " code: " + e.code + " reason: " + e.reason);
}

function onProgressToneStart(e) {
	console.log('Start progress tone for: ' + outboundCall.id);
}

function onProgressToneStop(e) {
	console.log('Stop progress tone for: ' + outboundCall.id);
}

function onMessage(e) {
	var ResultMessage;
	try{
		ResultMessage = JSON.parse(e.text);
	}catch (e){
		console.error(e);
	}
	console.log('Message: ',e);
	if (typeof ResultMessage.peers != "undefined") {
		for(var i in ResultMessage.peers) {
			if (ResultMessage.peers[i].callerid < VoxClientConnection.name && !minisolAssistGetCall(ResultMessage.peers[i].callerid)) {
				var Call = minisolAssisVox.call(ResultMessage.peers[i].callerid, true, null, {"X-DirectCall": "true", "X-DisplayName": ResultMessage.peers[i].displayName});
				VoxMultiPeers.push({call: Call, displayName : ResultMessage.peers[i].displayName});
				Call.addEventListener(VoxImplant.CallEvents.Connected, outboundP2Pcall_connected);
				Call.addEventListener(VoxImplant.CallEvents.Disconnected, outboundP2Pcall_disconnected);
				Call.addEventListener(VoxImplant.CallEvents.Failed, outboundP2Pcall_failed);
			}
		}
	}else{
		switch(ResultMessage.type) {
			case 'ICE_FAILED': 
				var Call = minisolAssisVox.call(ResultMessage.callee, true, null, {"X-DirectCall": "true", "X-DisplayName": ResultMessage.displayName});
				VoxMultiPeers.push.push({call: Call, displayName: ResultMessage.displayName});
				Call.addEventListener(VoxImplant.CallEvents.Connected, outboundP2Pcall_connected);
				Call.addEventListener(VoxImplant.CallEvents.Disconnected, outboundP2Pcall_disconnected);
				Call.addEventListener(VoxImplant.CallEvents.Failed, outboundP2Pcall_failed);
			break;
		}
	}
}


var outboundCall = null;
/*assist call event*/
function minisolAssistCall(){
	console.log('Start conference');
	outboundCall = minisolAssisVox.call("joinconf", true, null, {"X-Conference-Id": VoxClientConnection.room});
	outboundCall.addEventListener(VoxImplant.CallEvents.Connected, onCallConnected);
	outboundCall.addEventListener(VoxImplant.CallEvents.Disconnected, onCallDisconnected);
	outboundCall.addEventListener(VoxImplant.CallEvents.Failed, onCallFailed);
	outboundCall.addEventListener(VoxImplant.CallEvents.ProgressToneStart, onProgressToneStart);
	outboundCall.addEventListener(VoxImplant.CallEvents.ProgressToneStop, onProgressToneStop);
	outboundCall.addEventListener(VoxImplant.CallEvents.MessageReceived, onMessage);
}




function outboundP2Pcall_connected(e) {
	console.log('remove video: ',e);
	e.call.showRemoteVideo(true);
	document.getElementById(e.call.getVideoElementId()).play();
	minisolAssisVox.setCallActive(e.call, true);
}

function outboundP2Pcall_disconnected(e) {
	minisolAssisRemoveCall(e.call);
}

function outboundP2Pcall_failed(e) {
	minisolAssisRemoveCall(e.call);
}

function minisolAssisRemoveCall(call, ptsn) {
	if (typeof ptsn == "undefined") ptsn = false;
	
	if (ptsn === true) {
		for(var i in VoxMultiPeers) {
			if(VoxMultiPeers[i].call.number() == call) {
				$('#' + VoxMultiPeers[i].call.number()).remove();
				VoxMultiPeers.splice(i, 1);
			}
		}
	}else{
		for(var i in VoxMultiPeers) {
			if (VoxMultiPeers[i].call == call) {
				var num = Helper.getNameFromURI(VoxMultiPeers[i].call.number());
				$('#' + num).remove();
				VoxMultiPeers.splice(i, 1);
			}
		}
	}
}

function minisolAssistGetCall(name) {
	for(var i in VoxMultiPeers) {
		if(VoxMultiPeers[i].call.number() == name) return true;
	}
	return false;
}



function minisolAssistAuth(username) {
	console.log('minisolAssistAuth');
	minisolAssisVox.requestOneTimeLoginKey(username + appConfig.vox.auth_link);
}

function minisolAssistEventSDK()
{
	minisolAssisVox.init({ 
		useRTCOnly: true,
		micRequired: true, 
		videoSupport: true,
		videoContainerId : 'videos'
	});
}

/*socket.events*/
SocketIO.on('auth', function(data) {
	console.log('auth', data);
	if(data && data.api_result){
		VoxClientConnection.name = data.username;
		minisolAssistAuth(VoxClientConnection.name);
	}
});

SocketIO.on('auth-hash', function(data) {
	console.log('auth-hash', data);
	if(data && data.result) {
		minisolAssisVox.loginWithOneTimeKey(VoxClientConnection.id, data.result);
	}
});


SocketIO.on('new-message', function(data){
	var classMessage = data.from == VoxClientConnection.display ? "message-my" : "message-my-not";
	$('#message-list').append(
		'<li class="message-wrap '+classMessage+'"><span class="user-name">'+data.from+'</span><span class="message">'+data.message+'</span></li>'
	);
});

SocketIO.on('messages', function(data) {
	console.log('messages: ', data);
	if(data && data.length > 0) { 
		for(var i in data){
			$('#message-list').append(
				'<li class="message-wrap message-my-not"><span class="user-name">'+data[i].from+'</span><span class="message">'+data[i].message+'</span></li>'
			);
		}
	}
});

SocketIO.on('rec', function(data) {
	console.log('minisol assist recommendation: ', data);
	if(data && data.string && data.link) {
		var template = '<li class="message-wrap message-assist">';
			template += '<a class="message-assist-link" href="'+data.link+'" target="_blank">';
				if(data.img && data.img != ''){
					template += '<span class="message-assist-wrap-preview">';
						template += '<img class="message-assist-preview" src="'+data.img+'" />';
					template += '</span>';
				}
				template += '<span class="message-assist-query">' +data.string+ '</span>'
			template += '</a>';
		template += '</li>';
		$('#message-list').append(template);
	}
});




/*speech to text*/
window.recognitor = null;
var GoogleSpeechRecognitor = function(){
	var self = this;
	this.defaultLang = 'ru-RU';
	this.recognitor = null;
	this.recognizing = true;
	this.interim_transcript = '';

	/*start listening*/
	this.startListening = function(){
		console.log('start listening');
		self.recognitor = new webkitSpeechRecognition();
		self.recognitor.continuous = true;
		self.recognitor.interimResults = true;
		self.recognitor.lang = appConfig.recognitor.lang;

		self.recognitor.onresult = self.recognitorMessage;
		self.recognitor.onstart = function(){
			self.recognizing = true;
		}
		self.recognitor.onerror = self.recognitorError;
		self.recognitor.onend = self.recognitorEnd;

		self.recognitor.start();
	}

	/*speech result recognition*/
	this.recognitorMessage = function(event) {
		console.log('recognitor result: ', event);
		var interim_transcript = '';
		if (typeof(event.results) == 'undefined') {
			self.recognitor.onend = null;
			self.restartRecognitor();
		}
		
		for (var i = event.resultIndex; i < event.results.length; ++i) {
			if (event.results[i].isFinal) {
				SocketIO.emit('minisol-assist-speech',{message : event.results[i][0].transcript,room : VoxClientConnection.room});
			}
		}
	}
	
	/*error*/
	this.recognitorError = function(event) {
		console.log('rec error: ',event);
		switch(event.error) {
			case 'no-speech' : console.log('no-speech'); break;
			case 'audio-capture' : console.error('no audio inputs');break;
			case 'not-allowed' : console.log('not-allowed'); break;
		}
		
	}

	/*finish recognitor*/
	this.recognitorEnd = function() {
		self.restartRecognitor();
	}

	this.restartRecognitor = function() {
		self.recognitor.stop();
		self.recognizing = false;
		window.recognitor = null;
		//restart recognitor
		window.recognitor = new GoogleSpeechRecognitor();
		window.recognitor.startListening();
	}

	return this;
}





setTimeout(function(){
	$('#loader').remove();
	minisolAssistEventSDK();
}, 2500);


/*jquery bind*/
$(document).ready(function(){
	$('body').on('click', '#call-end-triggered', function(event){
		event.preventDefault();
		if(!$(this).hasClass('new-call')) {
			minisolAssisVox.disconnect();
			$(this).addClass('new-call');
		}else{
			window.location.reload();
		}

		return false;
	});

	$('body').on('keypress', '#message-text', function(event){

		if(event.keyCode == 13){
			$('#send-new-message').trigger('click');
			return false;
		}
	});


	$('body').on('click', '#send-new-message', function(event){
		event.preventDefault();
		var text = $('#message-text').val();
		if(text.length > 0){
			SocketIO.emit('new-message',{
				room : VoxClientConnection.room,
				from : VoxClientConnection.display,
				message : text
			});
			$('#message-text').val('');
		}
		return false;
	});

	if (!('webkitSpeechRecognition' in window)) {
		console.error('your browser does not support speech recognitor');
	}else{
		window.recognitor = new GoogleSpeechRecognitor();
		window.recognitor.startListening();
	}
});
>>>>>>> release/BUILD_ALFA
