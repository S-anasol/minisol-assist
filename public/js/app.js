'use strict';

/*app config*/
var appConfig = {
	socket : {
		listen : "http://localhost:3001/"
	}
};

/*init sockets*/
var SocketIO = io.connect(appConfig.socket.listen);


var assistApplication = angular.module('assistApplication', []);

assistApplication.controller('assistController', function assistController($scope, $http) {
	console.log('app create');
});

// /*angular app*/
// var minisolAssist = angular.module('minisolAssist');

// /*custom factory*/
// minisolAssist.factory('$socket', function ($rootScope) {
// 	return {
// 		on: function (eventName, callback) {
// 			socket.on(eventName, function () {  
// 				var args = arguments;
// 				$rootScope.$apply(function () {
// 					callback.apply(socket, args);
// 				});
// 			});
// 		},
// 		emit: function (eventName, data, callback) {
// 			socket.emit(eventName, data, function () {
// 				var args = arguments;
// 				$rootScope.$apply(function () {
// 					if (callback) {
// 						callback.apply(socket, args);
// 					}
// 				});
// 			})
// 		}
// 	};
// });


// minisolAssist.controller('assistController',function assistController($scope,$http){
// 	console.log('application create');
// });