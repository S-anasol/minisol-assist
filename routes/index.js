var Express = require('express');
var Router = Express.Router();

Router.get('/', function(req, res, next) {
	res.render('index', {});
});

module.exports = Router;