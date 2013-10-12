# LocationObserver

LocationObserver is an object oriented, cross browser library that
detects changes to the browser's location hash. You can add a custom
parser to convert the hash into any format you want to make processing
these changes easier. Furthermore, this is a standalone library.

## Why Use LocationObserver?

LocationObserver is meant to be included in other JavaScript libaries
and frameworks with no dependencies so you can jump right in to
responding intelligently to changes in the hash portion of the
browser location bar.

Many JavaScript frameworks come with their own "hash change" event
allowing you to bookmark locations in a JavaScript application. Many
frameworks or libraries do not. Furthermore, your code needs to do
something intelligent with the change in hash values, and most
libraries and frameworks still require you to write boiler plate code
before a hash in a URL can trigger an action in JavaScript.

## Getting Started

You only need `location_observer.js`. No outside dependencies are
required. You can optionally include a hash parser so you don't have
to interpret hash values, and instead you can work with a native
JavaScript object.

    // 1) Instantiate the observer
    var observer = new LocationObserver();

    // 2) Subscribe to the observer in one of three ways:

    var callback = function(data, hash) {
        // ...
    };

    var obj = {
        doSomething: function(data, hash) {
            // ...
        }
    };

    // 2.A) With a callback function
    observer.subscribe(callback);

    // 2.B) With an object and the name of the method to execute
    observer.subscribe(obj, "doSomething");

    // 2.C) With an object, and a function
    observer.subscribe(obj, obj.doSomething);

    // 3) Optionally assign a hash parser:
    observer.parser = new LocationObserver.JsonParser();

    // 4) Optionally assign another object as the error handler:
    LocationObserver.errorHandler = {
        handleError: function(error) {
            // return true if the error is handled gracefully

            // return false to have LocationObserver rethrow the error
        }
    };

    // 5) Start observing the hash changes
    observer.init(window);

Since there are no external dependencies, this can be used with any
JavaScript library or framework.

### Hash Parsers

The hash parsers allow you to automatically parse the hash into a
JavaScript object. This makes doing something specific with a hash
change easier.

This library comes with two hash parsers:

* LocationObserver.JsonParser - Encode and decode hashes as JSON

  Example: `#%7B%22id%22%3A1%7D` is decoded to: `{"id": 1}`

* LocationObserver.SimpleQueryStringParser - Encode and decode hashes
  as simple query strings. Nested keys in the query string are not
  decoded, but kept as-is.

  Example: `#id=1` is decoded to: `{"id": 1}`

  Example: `#blog[id]=1` is decoded to: `{"blog[id]": 1}`

## Cleaning Up LocationObserver

Once you are finished using the observer, unsubscribe from it and call
the `destructor` method to ready that object for natural garbage
collection by the browser.

    observer.unsubscribe(callback);
    // or...
    observer.unsubscribe(obj, "doSomething");
    // or...
    observer.unsubscribe(obj, obj.doSomething);
    // or...
    observer.unsubscribe(obj);

    observer.destructor();
    observer = null;

## Creating Your Own Hash Parser

You can create a custom hash parser using this template:

    function MyHashParser() {}

    MyHashParser.prototype = {
        constructor: MyHashParser,

        regex: /ensure_i_am_valid/,

        deserialize: function(hash) {
            // return the deserialized hash
        },

        serialize: function(data) {
            // return the new hash as a string
        },

        test: function(hash) {
            return this.regex.test(hash);
        }
    };

As long as the custom parse uses this interface, any parser will work:

* A public method called `deserialize` which takes a String value and
  returns a JavaScript object
* A public method called `serialize` which takes an Object and returns
  that object serialized into a String
* A public method called `test` which takes the hash as a String and
  returns true if the String can be parsed using this parser.

Any change to the hash will at least call the `test(hash)` method. You
could allow the user to click a link to jump down the page, and not
want JavaScript to respond to the hash change. If the `test` method
returns false, the current hash value is stored in the history, but
the JavaScript event handlers are not notified.

For example, the JsonParser is used to serialize and deserialize the
hash and provide a JavaScript object for your event handlers. Now
let's say the user clicks this link:

    <a href="#more">View More</a>

The hash "#more" is not valid JSON. To avoid throwing a JavaScript
error, the `JsonParser#test` method returns false because the hash
value does not start with a "{" or "]", and does not end with a "}" or
"]".