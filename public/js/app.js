'use strict';

/*app config*/
var appConfig = {
	socket : {
		listen : "http://localhost:3001/"
	},
	vox : {
		app_name : 'videoconf',
		acc_name : 'andreym'
	}
};

/*init sockets*/
var SocketIO = io.connect(appConfig.socket.listen);

/*init*/


var assistApplication = angular.module('assistApplication', []);

assistApplication.factory('$socket', function($rootScope) {
	return {
		on: function (eventName, callback) {
			SocketIO.on(eventName, function () {  
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(SocketIO, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			SocketIO.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(SocketIO, args);
					}
				});
			})
		}
	};
});



assistApplication.controller('assistController', function assistController($scope, $socket) {
	$scope.voxAPI = VoxImplant.getInstance();
	$scope.clientName = Query.clientName || 'User ' + (new Date()).getTime();
	$scope.conferenceID = Query.conferenceID || false;

	/*vox events*/
	$scope.voxAPI.addEventListener(VoxImplant.Events.SDKReady, function(event) {
		$scope.userConnect();
	});
	
	$scope.voxAPI.addEventListener(VoxImplant.Events.ConnectionEstablished, function(){
		console.info('connection: ',$scope.voxAPI.connected());
	});
	
	$scope.voxAPI.addEventListener(VoxImplant.Events.ConnectionFailed, function(){

	});
	
	$scope.voxAPI.addEventListener(VoxImplant.Events.ConnectionClosed, function(){

	});
	
	$scope.voxAPI.addEventListener(VoxImplant.Events.AuthResult, function(event){

	});
	
	$scope.voxAPI.addEventListener(VoxImplant.Events.IncomingCall, function(event){

	});
	
	$scope.voxAPI.addEventListener(VoxImplant.Events.MicAccessResult, function(){

	});

	/*scope functions*/
	$scope.userConnect = function() {
		console.info('connect vox');
		$scope.voxAPI.connect();
	}

	
});

