LocationObserver.SimpleQueryStringParser = function SimpleQueryStringParser() {};

LocationObserver.SimpleQueryStringParser.prototype = {
	constructor: LocationObserver.SimpleQueryStringParser,

	regex: /[\w\[\].]+=/,

	_hydrate: function _hydrate(data, keys, value) {
	},

	deserialize: function deserialize(hash) {
		var data = {};

		hash.replace(/([^&=]+)=([^&]+)/g, function(match, key, value) {
			data[key] = decodeURIComponent(value);
		});

		return data;
	},

	serialize: function serialize(data) {
		var s = [];

		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				s.push(key + "=" + encodeURIComponent(data[key]));
			}
		}

		return s.join("&");
	},

	test: function test(hash) {
		return this.regex.test(hash);
	}
};
