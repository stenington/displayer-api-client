# displayer-api-client

## Example

``` javascript
  var DisplayerAPI = require("displayer-api-client");
  var api = new DisplayerAPI("http://backpack.openbadges.org");

  var user = api.user("someone@example.org");

  user.id(function (err, id) {
    console.log("Looked up user id, and it is", id);
  });

  user.groups(function (err, groups) {
    console.log("Looked up user groups, and they are", groups);
  });

  user.group(10, function (err, badges) {
    console.log("Looked up group 10, and the badges in it are", badges);
  });
```

## Callback Styles

All of the user methods support three styles of invocation:

``` javascript
  user.id(function callback (err, id) {});                        // node style callback
  user.id(function success (id) {}, function failure (err) {});   // success/failure style callbacks
  var idPromise = user.id();                                      // promises 
```

If additional arguments are needed, they preceed the callbacks (if any).

Promises are implemented by [bluebird].

## Streams

There are two additional methods that return [JSONStream] streams:

``` javascript
  var g = user.getGroupStream();
  g.on("data", function (data) {
    console.log("A group:", data);
  });

  var b = user.getBadgeStream(10);
  b.on("data", function (data) {
    console.log("A badge in group 10:", data);
  });
```

[bluebird]: https://github.com/petkaantonov/bluebird/blob/master/API.md
[JSONStream]: https://github.com/dominictarr/JSONStream