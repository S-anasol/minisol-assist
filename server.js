var app = require('./app');
var http = require('http');
var debug = require('debug')('projects:server');
var config = require('./config/config.json');

app.set('port', config.express.port);

var server = http.createServer(app);

server.listen(config.server.port);

server.on('error', function(error) {
	console.log('app error', error);
});

server.on('listening', function() {
	var addr = server.address();
	var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
	debug("Listening on " + bind);
});
