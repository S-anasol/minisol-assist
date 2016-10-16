'use strict';

/*app config*/
var appConfig = {
	socket : {
		listen : "http://localhost:3001/"
	},
	vox : {
		app_name : 'videoconf',
		acc_name : 'andreym',
		connection_repeat : 2000
	}
};

/*init sockets*/
var SocketIO = io.connect(appConfig.socket.listen);


//(function(){
	/*init vox client*/
	var VoxClientConnection = {
		name : null,
		room : Query.room || 1,
		display : Query.name || 'User_' + (new Date()).getTime(),
		connected : false,
		id : null,
		bound : null
	};

	/*vox ml. connections*/
	var VoxMultiPeers = [];

	/*init vox api*/
	var voxAPI = VoxImplant.getInstance();
	
	voxAPI.writeLog = function(message) {
		//console.log("LOG: "+message);
	}
	
	voxAPI.writeTrace = function(message) {
		//console.log("TRACE: "+message);
	}


	/*start vox events */
	
	voxAPI.addEventListener(VoxImplant.Events.SDKReady, function(event) {
		console.log('SDKReady event');
		console.log("onSDKReady. SDK version: " + event.version);
		console.log("WebRTC supported: " + voxAPI.isRTCsupported())
		console.log('Establishing connection...');
		voxAPI.connect();
	});

	voxAPI.addEventListener(VoxImplant.Events.onMicAccessResult, function(e) {
		console.log("Mic Access Allowed: " + e.result);
		console.log('Hello');
		voxAPI.showLocalVideo(true);
		
	});


	voxAPI.addEventListener(VoxImplant.Events.ConnectionEstablished, function() {
		console.log('ConnectionEstablished event ' + voxAPI.connected());
		SocketIO.emit('auth', {user : VoxClientConnection.display});
	});

	voxAPI.addEventListener(VoxImplant.Events.ConnectionFailed, function() {
		console.error('ConnectionFailed event');
	});

	voxAPI.addEventListener(VoxImplant.Events.ConnectionClosed, function() {
		//repeat connection after close
		setTimeout(voxAPI.connect, appConfig.vox.connection_repeat);
	});

	voxAPI.addEventListener(VoxImplant.Events.AuthResult, function(e) {
		if(e.result) {
			console.log("create conference");
			VoxClientConnection.bound = voxAPI.call("joinconf", true, null, {"X-Conference-Id": VoxClientConnection.room});
			
			VoxClientConnection.bound.addEventListener(VoxImplant.CallEvents.Connected, function(e) {
				console.log('Bound CallConnected event: ' + e.call.id());
				VoxClientConnection.bound = e.call;
				VoxClientConnection.bound.showRemoteVideo(false);
				
				VoxClientConnection.connected = true;
			});
			
			VoxClientConnection.bound.addEventListener(VoxImplant.CallEvents.Disconnected, function() {
				console.log('Bound Disconnected event: ' + VoxClientConnection.bound.id() + ' with state: ' + VoxClientConnection.bound.state());
				VoxClientConnection.bound = null;
			});
			
			VoxClientConnection.bound.addEventListener(VoxImplant.CallEvents.Failed, function(e) {
				console.error("CallFailed: " + VoxClientConnection.bound.id() + " code: " + e.code + " reason: " + e.reason);
			});
			
			VoxClientConnection.bound.addEventListener(VoxImplant.CallEvents.ProgressToneStart, function(e) {
				console.log('ProgressToneStart start for: ' + VoxClientConnection.bound.id());
			});
			
			VoxClientConnection.bound.addEventListener(VoxImplant.CallEvents.ProgressToneStop, function(e) {
				console.log("ProgessToneStop for call id: " + VoxClientConnection.bound.id());
			});
			
			VoxClientConnection.bound.addEventListener(VoxImplant.CallEvents.MessageReceived, function(e) {
				var MessageResult = null;
				console.log("onMessage: " + e.text + " for call id: " + VoxClientConnection.bound.id());
				try{
					MessageResult = JSON.parse(e.text);
				}catch(e){
					console.error('Event parse error ', e);
				}

				if(typeof MessageResult != "undefined") {
					for (var i in MessageResult.peers) {
						var RemotePeer = MessageResult.peers[i];
						if(RemotePeer.callerid < VoxClientConnection.name && !voxCallExists(RemotePeer.callerid)) {
							console.log("Calling to peer " + RemotePeer.displayName + " (" + RemotePeer.callerid + ")");
							var PeerCall = voxAPI.call(RemotePeer.callerid, true, null, {"X-DirectCall": "true", "X-DisplayName": RemotePeer.displayName});
							
							VoxMultiPeers.push({call: PeerCall, displayName: RemotePeer.displayName});
							
							PeerCall.addEventListener(VoxImplant.CallEvents.Connected, function(e) {
								e.call.showRemoteVideo(true);
								voxAPI.setCallActive(e.call, true);
								if(document.getElementById(e.call.getVideoElementId())) document.getElementById(e.call.getVideoElementId()).play();
							});
							
							PeerCall.addEventListener(VoxImplant.CallEvents.Disconnected, function(e) {
								voxCallRemove(e.call);
							});

							PeerCall.addEventListener(VoxImplant.CallEvents.Failed, function(e) {
								voxCallRemove(e.call);
								console.error('Failed P2P call');
							});
						}
					}
				}else{
					switch(MessageResult.type) {
						case 'ICE_FAILED' :
							var PeerCall = voxAPI.call(MessageResult.callee, true, null, {"X-DirectCall": "true", "X-DisplayName": MessageResult.displayName});
							VoxMultiPeers.push.push({call: PeerCall, displayName: RemotePeer.displayName});

							PeerCall.addEventListener(VoxImplant.CallEvents.Connected, function(e) {
								e.call.showRemoteVideo(true);
								voxAPI.setCallActive(e.call, true);
							});

							PeerCall.addEventListener(VoxImplant.CallEvents.Disconnected, function(e) {
								voxCallRemove(e.call);
							});

							PeerCall.addEventListener(VoxImplant.CallEvents.Failed, function(e) {
								voxCallRemove(e.call);
								console.error('Failed P2P call');
							});
						break;
						case 'CALL_PARTICIPANT_DISCONNECTED' : 
							voxCallRemove(MessageResult.call, true);
						break;
						case 'CALL_PARTICIPANT_FAILED' : 
							voxCallRemove(MessageResult.call, true);
						break;
					}
				}
			});
		}else{
			if(e.code == 302) {
				VoxClientConnection.id = VoxClientConnection.name + "@" + appConfig.vox.app_name + "." + appConfig.vox.acc_name + ".voximplant.com";
				SocketIO.emit('auth-hash', {key : e.key, username : VoxClientConnection.name});
			}
		}
	});


	voxAPI.addEventListener(VoxImplant.Events.IncomingCall, function(e) {
		var headers = e.call.headers();
		console.log("Incoming call from: " + e.call.number());
		VoxMultiPeers.push({call: e.call, displayName: headers["X-DisplayName"]});
		/*income call's events*/
		
		e.call.addEventListener(VoxImplant.CallEvents.Disconnected, function(e) {
			voxCallRemove(e.call);
		});
		
		e.call.addEventListener(VoxImplant.CallEvents.Failed, function(e) {
			voxCallRemove(e.call);
		});
		
		e.call.addEventListener(VoxImplant.CallEvents.Connected, function(e) {
			e.call.showRemoteVideo(true);
			console.log('Remote video: ', e);
			voxAPI.setCallActive(e.call, true);
			document.getElementById(e.call.getVideoElementId()).play();
		});

		e.call.addEventListener('ICETimeout', function(e) {
			console.log('ICE Timeout. Sending notification to the caller.');
			headers = e.call.headers();
			e.call.hangup();
			VoxClientConnection.bound.sendMessage(JSON.stringify({type: "ICE_FAILED", caller: e.call.number(), callee: VoxClientConnection.name, displayName: headers["X-DisplayName"]}));
		});

		e.call.answer();
	});

	


	/*SDK INIT*/
	function initSDK(){
		voxAPI.init({
			micRequired : true,
			useRTCOnly  : true,
			videoSupport : true,
			videoContainerId : 'videos'
		});
	};





	function voxCallExists(name) {
		for(var i in VoxMultiPeers) {
			if(VoxMultiPeers[i].call.number() == name) return true;
		}
		return false;
	}

	function voxCallRemove(call, pstn) {
		if (typeof pstn == "undefined") pstn = false;
		if(pstn) {
			for(var i in VoxMultiPeers) {
				if (VoxMultiPeers[i].call.number() == call) {
					$('#' + VoxMultiPeers[i].call.number()).remove();
					VoxMultiPeers.splice(i, 1);
				}
			}
		}else{
			for(var i in VoxMultiPeers) {
				if (VoxMultiPeers[i].call == call) {
					var CallNum = Helper.getNameFromURI(VoxMultiPeers[i].call.number());
					$('#' + CallNum).remove();
					VoxMultiPeers.splice(i, 1);
				}
			}
		}
	}
	/*end vox events*/

	/*socket on events start*/
	
	/*auth event*/
	SocketIO.on('auth', function(data) {
		if(data && data.api_result) {
			console.log('auth result: ',data);
			VoxClientConnection.name = data.username;
			/*auth in vox service*/
			voxAPI.requestOneTimeLoginKey(
				VoxClientConnection.name + "@" 
				+ appConfig.vox.app_name + "." 
				+ appConfig.vox.acc_name + 
				".voximplant.com"
			);
		}else{
			console.error('error auth user');
		}
	});

	SocketIO.on('auth-hash', function(data) {
		if(data && data.result) {
			voxAPI.loginWithOneTimeKey(VoxClientConnection.id, data.result);
		}
	});
	/*socket on events end*/

	window.addEventListener('load', function() {
		initSDK();
	});

//})();