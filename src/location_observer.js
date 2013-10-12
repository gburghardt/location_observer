function LocationObserver() {
	this.handleHashChange = this._bind(this.handleHashChange, this);
	this.history = [];
	this.subscribers = [];
};

LocationObserver.errorHandler = null;

LocationObserver.prototype = {
	history: null,

	lastHash: "",

	location: null,

	oldOnHashChange: null,

	parser: null,

	pollingInterval: 100,

	subscribers: null,

	timerId: null,

	window: null,

	constructor: LocationObserver,

	init: function init(win) {
		if (!win) {
			throw new Error("Missing required argument: window");
		}
		else if (!win.location) {
			throw new Error("Missing required property: window.location");
		}

		this.window = win;
		this.location = win.location;
		this.handleHashChange();
		this._startObserving();

		win = null;
	},

	destructor: function destructor() {
		if (this.window) {
			this._stopObserving();
		}

		if (this.parser) {
			if (this.parser.destructor) {
				this.parser.destructor();
			}

			this.parser = null;
		}

		this.window = this.location = this.history = this.subscribers = null;
	},

	_bind: function _bind(fn, context) {
		return function _boundFunction() {
			return fn.apply(context, arguments);
		};
	},

	_detectHashChange: null,

	_dispatchHashChange: function _dispatchHashChange(parsedHash, hash) {
		for (var i = 0, length = this.subscribers.length; i < length; i++) {
			this._invokeSubscriber(this.subscribers[i], parsedHash, hash);
		}
	},

	getCurrentHash: function getCurrentHash() {
		var hash = "";

		if (this.location.hash) {
			hash = this.location.hash.replace(/^#/, "");
		}
		else if (/#(.*)$/.test(String(this.location))) {
			hash = String(this.location).replace(/^([^#]+)#(.*)$/, "$2");
		}

		return /%[0-9]+/.test(hash) ? decodeURIComponent(hash) : hash;
	},

	_handleError: function _handleError(error) {
		if (!LocationObserver.errorHandler || !LocationObserver.errorHandler.handleError || !LocationObserver.errorHandler.handleError(error)) {
			throw error;
		}
	},

	handleHashChange: function handleHashChange() {
		var hash = this.getCurrentHash();

		if (/^\s*$/.test(hash) || hash === this.lastHash) {
			return;
		}
		else if (this.oldOnHashChange) {
			try {
				this.oldOnHashChange();
			}
			catch (error) {
				this._handleError(error);
			}
		}

		try {
			if (this.parser) {
				if (this.parser.test(hash)) {
					var parsedHash = (this.parser) ? this.parser.deserialize(hash) : hash;

					this.history.push(hash);
					this._dispatchHashChange(parsedHash, hash);
				}
				else {
					this.history.push(hash);
				}
			}
			else {
				this.history.push(hash);
				this._dispatchHashChange(parsedHash, hash);
			}

			this.lastHash = hash;
		}
		catch (error) {
			this._handleError(error);
		}
	},

	_invokeSubscriber: function _invokeSubscriber(subscriber, parsedHash, hash) {
		try {
			if (subscriber.type === "function") {
				subscriber.callback.call(subscriber.context, parsedHash, hash);
			}
			else {
				subscriber.context[ subscriber.callback ](parsedHash, hash);
			}
		}
		catch (error) {
			this._handleError(error);
		}
	},

	_startObserving: function _startObserving() {
		if ("onhashchange" in this.window) {
			if (this.window.addEventListener) {
				this.window.addEventListener("hashchange", this.handleHashChange, false);
			}
			else if (this.window.attachEvent) {
				this.window.attachEvent("onhashchange", this.handleHashChange);
			}
			else {
				this.oldOnHashChange = this.window.onhashchange || function() {};
				this.window.onhashchange = this.handleHashChange;
			}
		}
		else {
			this._startTimedObserver();
		}
	},

	_startTimedObserver: function _startTimedObserver() {
		this.timerId = setTimeout(this.handleHashChange, this.pollingInterval);
	},

	_stopObserving: function _stopObserving() {
		if ("onhashchange" in this.window) {
			if (this.window.removeEventListener) {
				this.window.removeEventListener("hashchange", this.handleHashChange, false);
			}
			else if (this.window.detachEvent) {
				this.window.detachEvent("onhashchange", this.handleHashChange);
			}
			else {
				this.window.onhashchange = null;
			}
		}
		else {
			this._stopTimedObserver();
		}
	},

	_stopTimedObserver: function _stopTimedObserver() {
		if (this.timerId) {
			clearTimeout(this.timerId);
			this.timerId = null;
		}
	},

	subscribe: function subscribe(context, callback) {
		if (!callback) {
			callback = context;
			context = null;
		}

		var subscriber = {
			type: typeof(callback),
			context: context,
			callback: callback
		};

		if (subscriber.type === "string" && typeof context[callback] !== "function") {
			throw new Error("Method '" + callback + "' does not exist on the context");
		}

		this.subscribers.push(subscriber);
		subscriber = null;
	},

	unsubscribe: function unsubscribe(context, callback) {
		if (callback) {
			for (var i = 0, length = this.subscribers.length; i < length; i++) {
				if (this.subscribers[i].context === context && this.subscribers[i].callback === callback) {
					this.subscribers.splice(i, 1);
					break;
				}
			}
		}
		else {
			var i = this.subscribers.length;

			while (i--) {
				if (this.subscribers[i].context === context) {
					this.subscribers.splice(i, 1);
				}
			}
		}
	},
};
