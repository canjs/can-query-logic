@function can-query-logic.set.union set.union
@parent can-query-logic.static

Perform a union of set types.

@signature `QueryLogic.set.union(setA, setB)`

Performs a union of `setA` and `setB` and returns the
result.  Will throw an error if [can-query-logic.defineComparison] has
not been called with comparison operations
necessary to perform the union.  Use [can-query-logic.prototype.union]
to perform a union between two plain [can-query-logic/query] objects.

`QueryLogic.set.union` can be used to test custom comparison types:

```js
var gt3 = new QueryLogic.GreaterThan(3);
var lt6 = new QueryLogic.LessThan(6);
QueryLogic.set.union(gt3, lt6) //-> QueryLogic.UNIVERSAL
```

@param {SetType} [setA] An instance of a SetType.
@param {SetType} [setB] An instance of a SetType.
@return {SetType} An instance of a SetType.
