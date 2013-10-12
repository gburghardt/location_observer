LocationObserver.JsonParser = function JsonParser() {};

LocationObserver.JsonParser.prototype = {
	constructor: LocationObserver.JsonParser,

	regex: /^\s*[\{\[].*?[\}\]]\s*$/,

	deserialize: function deserialize(hash) {
		return JSON.parse(hash);
	},

	serialize: function serialize(data) {
		return JSON.stringify(data);
	},

	test: function test(hash) {
		return this.regex.test(hash);
	}
};
