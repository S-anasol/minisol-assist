var AppConfig = require('./config/config.json');

/*init*/
var express = require('express');
var pathLoader = require('path');
var consolidate = require('consolidate');
var swig = require('swig');
var Application = express();

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

module.exports = Application;