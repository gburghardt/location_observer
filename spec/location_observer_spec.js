describe("LocationObserver", function() {

	beforeEach(function() {
		this.observer = new LocationObserver();
	});

	describe("init", function() {

		it("throws an error when called with no arguments", function() {
			var observer = new LocationObserver();

			expect(function() {
				observer.init();
			}).toThrow(new Error("Missing required argument: window"));
		});

		it("throws an error if the first argument does not have a location object", function() {
			var observer = new LocationObserver();

			expect(function() {
				observer.init({});
			}).toThrow(new Error("Missing required property: window.location"));
		});

		it("starts observing changes to the location hash", function() {
			var win = {
				location: {
					hash: ""
				}
			};

			var observer = new LocationObserver();
			spyOn(observer, "_startObserving");

			observer.init(win);

			expect(observer._startObserving).toHaveBeenCalled();
			expect(observer.window).toBe(win);
			expect(observer.location).toBe(win.location);
		});

	});

	describe("getCurrentHash", function() {

		describe("when a location.hash property exists", function() {

			beforeEach(function() {
				this.win = {
					location: {
						hash: ""
					}
				};
				spyOn(this.observer, "_startObserving");
				this.observer.init(this.win);
			});

			it("returns the hash, minus the # sign", function() {
				this.win.location.hash = "#foo";
				expect(this.observer.getCurrentHash()).toBe("foo");
			});

			it("returns an empty string if there is no hash", function() {
				expect(this.observer.getCurrentHash()).toBe("");
			});

			it("returns an empty string if the hash is only #", function() {
				this.win.location.hash = "#";
				expect(this.observer.getCurrentHash()).toBe("");
			});

		});

		describe("when no location.hash property exists, this location object is converted to a string and", function() {

			beforeEach(function() {
				this.win = {
					location: {
						_hash: "",

						toString: function() {
							return "http://www.example.com" + this._hash;
						}
					}
				};
				spyOn(this.observer, "_startObserving");
				this.observer.init(this.win);
			});

			it("returns an empty string if there is no hash", function() {
				this.win.location._hash = "";
				expect(this.observer.getCurrentHash()).toBe("");
			});

			it("returns an empty string if the hash is only #", function() {
				this.win.location._hash = "#";
				expect(this.observer.getCurrentHash()).toBe("");
			});

			it("returns the hash minus the # sign", function() {
				this.win.location._hash = "#foo";
				expect(this.observer.getCurrentHash()).toBe("foo");
			});

		});

	});

	describe("subscribe", function() {

		it("accepts just a callback function", function() {
			var callback = function() {};
			this.observer.subscribe(callback);

			expect(this.observer.subscribers.length).toBe(1);

			expect(this.observer.subscribers[0]).toEqual({
				type: "function",
				context: null,
				callback: callback
			});
		});

		it("accepts a context and a callback function", function() {
			var context = {};
			var callback = function() {};
			this.observer.subscribe(context, callback);

			expect(this.observer.subscribers.length).toBe(1);

			expect(this.observer.subscribers[0]).toEqual({
				type: "function",
				context: context,
				callback: callback
			});
		});

		it("accepts a context and the name of a function", function() {
			var context = {
				foo: function() {}
			};

			this.observer.subscribe(context, "foo");

			expect(this.observer.subscribers.length).toBe(1);

			expect(this.observer.subscribers[0]).toEqual({
				type: "string",
				context: context,
				callback: "foo"
			});
		});

		it("throws an error if the context does not have the specified method name", function() {
			var observer = this.observer;
			var context = {};

			expect(function() {
				observer.subscribe(context, "badMethod");
			}).toThrow(new Error("Method 'badMethod' does not exist on the context"));
		});

	});

	describe("unsubscribe", function() {

		it("removes all subscribers with the given context", function() {
			var context = {
				foo: function() {},
				bar: function() {}
			};

			this.observer.subscribe(context, "foo");
			this.observer.subscribe(context, "bar");
			this.observer.unsubscribe(context);

			expect(this.observer.subscribers.length).toBe(0);
		});

		it("removes a subscriber by context and callback function", function() {
			var context = {
				foo: function() {}
			};
			this.observer.subscribe(context, context.foo);
			this.observer.subscribe(context, "foo");

			this.observer.unsubscribe(context, context.foo);
			expect(this.observer.subscribers.length).toBe(1);
		});

		it("removes a subscriber by context and method name", function() {
			var context = {
				foo: function() {}
			};
			this.observer.subscribe(context, context.foo);
			this.observer.subscribe(context, "foo");

			this.observer.unsubscribe(context, "foo");
			expect(this.observer.subscribers.length).toBe(1);
		});

	});

	describe("_invokeSubscriber", function() {

		it("invokes a function subscriber", function() {
			var called = false;
			var context = {
				callback: callback = function(arg1, arg2) {
					called = true;
					expect(this).toBe(context);
					expect(arg1).toBe(parsedHash);
					expect(arg2).toBe(hash);
				}
			};
			var subscriber = {
				type: "function",
				context: context,
				callback: context.callback
			};
			var parsedHash = {};
			var hash = "test";

			this.observer._invokeSubscriber(subscriber, parsedHash, hash);

			expect(called).toBe(true);
		});

		it("invokes a subscriber by method name", function() {
			var called = false;
			var context = {
				callback: callback = function(arg1, arg2) {
					called = true;
					expect(this).toBe(context);
					expect(arg1).toBe(parsedHash);
					expect(arg2).toBe(hash);
				}
			};
			var subscriber = {
				type: "string",
				context: context,
				callback: "callback"
			};
			var parsedHash = {};
			var hash = "test";

			this.observer._invokeSubscriber(subscriber, parsedHash, hash);

			expect(called).toBe(true);
		});

		it("throws an error if the subscriber throws an error", function() {
			var observer = this.observer;
			var subscriber = {
				type: "function",
				context: null,
				callback: function() {
					throw new Error("Faux error!");
				}
			};

			expect(function() {
				observer._invokeSubscriber(subscriber, {}, "test");
			}).toThrow(new Error("Faux error!"));
		});

		describe("when an error handler object exists", function() {

			beforeEach(function() {
				this.observer = new LocationObserver();
				this.errorHandler = {
					handleError: function() {}
				};
				this.subscriber = {
					type: "function",
					context: {},
					callback: function() {
						throw new Error("Faux error!");
					}
				};

				LocationObserver.errorHandler = this.errorHandler;
			});

			afterEach(function() {
				LocationObserver.errorHandler = null;
			});

			it("swallows the error if the handler returns true", function() {
				spyOn(this.errorHandler, "handleError").and.returnValue(true);

				this.observer._invokeSubscriber(this.subscriber, {}, "test");

				expect(this.errorHandler.handleError).toHaveBeenCalledWith(new Error("Faux error!"));
			});

			it("rethrows the error if the handler returns anything falsey", function() {
				var observer = this.observer;
				var subscriber = this.subscriber;

				this.errorHandler.handleError = function() {return false;};
				expect(function() {
					observer._invokeSubscriber(subscriber, {}, "test");
				}).toThrow(new Error("Faux error!"));

				this.errorHandler.handleError = function() {return null;};
				expect(function() {
					observer._invokeSubscriber(subscriber, {}, "test");
				}).toThrow(new Error("Faux error!"));

				this.errorHandler.handleError = function() {return undefined;};
				expect(function() {
					observer._invokeSubscriber(subscriber, {}, "test");
				}).toThrow(new Error("Faux error!"));
			});

		});

	});

	describe("_dispatchHashChange", function() {

		beforeEach(function() {
			spyOn(this.observer, "_startObserving");
			this.observer.init({
				location: {
					hash: "test"
				}
			});
		});

		it("notifies each subscriber", function() {
			var subscribers = [{
				type: "string",
				context: {
					foo: function() {}
				},
				callback: "foo"
			},{
				type: "function",
				context: {},
				callback: function() {}
			}];

			spyOn(this.observer, "_invokeSubscriber");
			this.observer.subscribe(subscribers[0].context, subscribers[0].callback);
			this.observer.subscribe(subscribers[1].context, subscribers[1].callback);

			expect(this.observer.subscribers.length).toBe(2);

			this.observer._dispatchHashChange("test", "test");

			expect(this.observer._invokeSubscriber).toHaveBeenCalledWith(subscribers[0], "test", "test");
			expect(this.observer._invokeSubscriber).toHaveBeenCalledWith(subscribers[1], "test", "test");
		});

	});

	describe("handleHashChange", function() {

		beforeEach(function() {
			spyOn(this.observer, "_startObserving");
			spyOn(this.observer, "_invokeSubscriber");

			this.observer.init({
				location: {
					hash: "test"
				}
			});

			spyOn(this.observer, "_dispatchHashChange");
		});

		it("does nothing if no change to the hash", function() {
			expect(this.observer.history.length).toBe(1);

			this.observer.handleHashChange();

			expect(this.observer.history.length).toBe(1);
			expect(this.observer._dispatchHashChange).not.toHaveBeenCalled();
		});

		it("dispatches the hash change event to the subscribers", function() {
			this.observer.location.hash = "changed";
			this.observer.handleHashChange();

			expect(this.observer._dispatchHashChange).toHaveBeenCalledWith("changed", "changed");
		});

		it("adds the current hash to the hash history", function() {
			expect(this.observer.history.length).toBe(1);
			this.observer.location.hash = "changed";
			this.observer.handleHashChange();

			expect(this.observer.history.length).toBe(2);
			expect(this.observer.history).toEqual(["test", "changed"]);
		});

		it("stores the current hash as the 'lastHash'", function() {
			expect(this.observer.lastHash).toBe("test");
			this.observer.location.hash = "changed";
			this.observer.handleHashChange();

			expect(this.observer.lastHash).toBe("changed");
		});

		describe("when an old onhashchange handler exists", function() {

			beforeEach(function() {
				this.observer.oldOnHashChange = function() {};
				this.observer.location.hash = "changed";
			});

			it("calls the old onhashchange handler if one exists", function() {
				spyOn(this.observer, "oldOnHashChange");
				this.observer.handleHashChange();

				expect(this.observer.oldOnHashChange).toHaveBeenCalled();
			});

			describe("and the old handler throws an error", function() {

				beforeEach(function() {
					spyOn(this.observer, "oldOnHashChange").and.throwError("Faux error!");

					LocationObserver.errorHandler = {
						handleError: function() {}
					};
				});

				afterEach(function() {
					LocationObserver.errorHandler = null;
				});

				it("allows the error handler to gracefully handle the error", function() {
					spyOn(LocationObserver.errorHandler, "handleError").and.returnValue(true);

					this.observer.handleHashChange();

					expect(LocationObserver.errorHandler.handleError).toHaveBeenCalledWith(new Error("Faux error!"));
					expect(this.observer._dispatchHashChange).toHaveBeenCalled();
				});

				it("throws an error if the error is not handled by the error handler", function() {
					spyOn(LocationObserver.errorHandler, "handleError").and.returnValue(false);
					var observer = this.observer;

					expect(function() {
						observer.handleHashChange();
					}).toThrow(new Error("Faux error!"));

					expect(this.observer.oldOnHashChange).toHaveBeenCalled();
					expect(LocationObserver.errorHandler.handleError).toHaveBeenCalledWith(new Error("Faux error!"));
					expect(this.observer._dispatchHashChange).not.toHaveBeenCalled();
				});

			});

		});

		it("parses the hash with a parser if a parser exists", function() {
			var parsedHash = {};
			var parser = {
				deserialize: function() {}
			};
			spyOn(parser, "deserialize").and.returnValue(parsedHash);

			this.observer.parser = parser;
			this.observer.location.hash = "changed";
			this.observer.handleHashChange();

			expect(parser.deserialize).toHaveBeenCalledWith("changed");
			expect(this.observer._dispatchHashChange).toHaveBeenCalledWith(parsedHash, "changed");
		});

	});

});
