var Query = function(){
	var query_string = {};
	var url = window.location.search.substring(1);
	var params = url.split('&');
	for(var i in params) {
		var args = params[i].split("=");
		if (typeof query_string[args[0]] === "undefined") {
			query_string[args[0]] = args[1];
		}else{
			if(typeof query_string[args[0]] === "string") {
				var arr = [ query_string[args[0]], args[1] ];
				query_string[args[0]] = arr;
			}else{
				query_string[args[0]].push(args[1]);
			}
		}
	}
	return query_string;
}();

var Helper = {
	getNameFromURI : function(uri) {
		if (uri.indexOf('@') != -1) uri = uri.substr(0, uri.indexOf('@'));
		uri = uri.replace("sip:", "");
		return uri;
	}
};