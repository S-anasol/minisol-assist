var Helper = function(){
	var self = this;
	this.getRandom = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	this.getLogin = function(length){
		var dictionary = 'abcdefghijklmnopqrstuvwxyz0123456789';
		var result = '';
		for(var i = 0; i < length; i ++) {
			result += dictionary[self.getRandom(0, dictionary.length - 1)];
		}
		return result;
	}
	return this;
};

module.exports = Helper;