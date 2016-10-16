

var MinisolAssist = function(Dictionary){
	var self = this;
	this.dictionary = Dictionary;

	this.getRecommendation = function(message){
		var result = [];
		if(message.indexOf('ассист') + 1 > 0  || message.indexOf('assis') + 1 > 0) {
			if(message.indexOf('assist') + 1 > 0){
				var search = message.split('assist');
				result.push({link : "https://google.com/?q=" + encodeURIComponent(search[1]), string: search[1]});
			}
			if(message.indexOf('ассист') + 1 > 0){
				var search = message.split('ассист');
				result.push({link : "https://google.com/?q=" + encodeURIComponent(search[1]), string: search[1]});
			}
			if(message.indexOf('minisol assist') + 1 > 0){
				var search = message.split('minisol assis');
				result.push({link : "https://google.com/?q=" + encodeURIComponent(search[1]), string: search[1]});
			}
			if(message.indexOf('минисол асист') + 1 > 0){
				var search = message.split('минисол асист');
				result.push({link : "https://google.com/?q=" + encodeURIComponent(search[1]), string: search[1]});
			}
			if(message.indexOf('minnesota assist') + 1 > 0){
				var search = message.split('minnesota assist');
				result.push({link : "https://google.com/?q=" + encodeURIComponent(search[1]), string: search[1]});
			}
			return result;
		}else{
			for(var i in self.dictionary){
				if(self.dictionary[i].string == message){
					result.push(self.dictionary[i]);
				}
			}
			if(result.length == 0){
				var words = message.toLowerCase().split(' ');
				for(var i in words){
					if(words[i].length > 2){
						var buff = self.searchInDictionary(words[i]);
						if(buff.length > 0){
							for(var j in buff) {
								result.push(buff[j]);
							}
						}
					}
				}
			}

			
		}
		return result;
	}

	this.searchInDictionary = function(word) {
		var result = [];
		for(var i in self.dictionary){
			if(self.dictionary[i].string == word || self.dictionary[i].string.indexOf(word) + 1 > 0){
				result.push(self.dictionary[i]);
			}
		}
		return result;
	}

	return this;
}

module.exports = MinisolAssist;