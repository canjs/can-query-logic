@function can-query-logic.prototype.memberIdentity memberIdentity
@parent can-query-logic.prototype
@hide

@signature `queryLogic.memberIdentity(record)`

Returns the configured `id` property value from `record`.  If there are
multiple ids, a `JSON.stringify`-ed JSON object is returned with each
`id` value is returned.

```js
var todoQueryLogic = new QueryLogic({
    identity: ["_id"]
})
todoQueryLogic.memberIdentity({_id: 5}) //-> 5

var todoQueryLogic = new QueryLogic({
    identity: ["studentId", "classId"]
});

todoQueryLogic.memberIdentity({studentId: 6, classId: "7", foo: "bar"})
    //-> '{"classId":"7","studentId":6}'
```

  @param  {Object} record An instance's raw data.
  @return {*|String} If a single identity property is configured, its value will be returned.
  If multiple identity properties are configured a `JSON.stringify`-ed object is returned.
