@module {function} can-query-logic
@parent can-data-modeling
@collection can-core
@group can-query-logic.static 0 static
@group can-query-logic.prototype 1 prototype
@group can-query-logic/query-format 2 Query Format

@description Perform data queries and compare
queries against each other. Provides logic useful for
data caching and real-time behavior.

@signature `new QueryLogic( [schemaOrType] [,options] )`

The `can-query-logic` package exports a constructor function that builds _query logic_
from:

- an optional schema or type argument, and
- an optional `options` argument used to convert alternate parameters to
  the expected [can-query-logic/query] format.


For example, the following builds _query logic_ from a [can-define/map/map]:

```js
import QueryLogic from "can-query-logic";
import DefineMap from "can-define/map/map";

const Todo = DefineMap.extend({
    id: {
        identity: true,
        type: "number"
    },
    name: "string",
    complete: "boolean"
});

var todoQueryLogic = new QueryLogic(Todo);
```

Once a _query logic_ instance is created, it can be used to
perform actions using [can-query-logic/query queries].  For example,
the following might select 20 incomplete todos from a list of todos:

```js
// Perform query logic:
todoQueryLogic.filterMembers({
    filter: {
        complete: false
    },
    sort: "name desc",
    page: {start: 0, end: 19}
},[
    {id: 1, name: "do dishes", complete: false},
    {id: 2, name: "mow lawn", complete: true},
    ...
]) //-> [matching items]
```

By default `can-query-logic` supports queries represented by the [can-query-logic/query]
format.  It supports a variety of operators and options.  It looks like:

```js
{
    // Selects only the todos that match.
    filter: {
        complete: false
    },
    // Sort the results of the selection
    sort: "name desc",
    // Selects a range of the sorted result
    page: {start: 0, end: 19}
}
```

@param {function|can-reflect/schema} schemaOrType Defines the behavior of
keys on a [can-query/QueryObject]. This is done with either:

  - A constructor function that supports the `can.schema` symbol. Currently, [can-define/map/map] supports the `can.schema` symbol:
    ```js
    const Todo = DefineMap.extend({
        id: {
            identity: true,
            type: "number"
        },
        name: "string",
        complete: "boolean"
    });
    new Query(Todo);
    ```
  - A schema object that looks like:
    ```js
    new Query({
        // keys that uniquely represent this type
        identity: ["id"],
        keys: {
            id: MaybeNumber,
            name: MaybeString,
            complete: MaybeBoolean
        }
    })
    ```

  By default, filter properties like `status` in `{filter: {status: "complete"}}`
  are hydrated to one of the [can-query/types/comparisons comparison types] like
  `GreaterThan`. A matching schema key will overwrite this behavior. How this
  works is explained in the _Special Comparison Logic_ section below.

@param {Object} [options] The following _optional_ options are used to translate
  between the standard [can-query/QueryObject] and the parameters the server expects:

  - `toQuery(params)` - Converts from the parameters used by the server to
    the standard [can-query/QueryObject].
  - `toParams(query)` - Converts from the standard [can-query/QueryObject]
    to the parameters used by the server.

  For example, the following changes the resulting `query` to use `where`
  for filtering instead of `filter`:

  ```js
  var TodoQuery = new Query(Todo, {
    toQuery(params){
      var where = params.where;
      delete params.where;
      params.filter = where;
      return params;
    },
    toParams(query){
      var where = query.filter;
      delete query.filter;
      query.where = where;
      return query;
    }
  });
  ```

  The _Special Comparison Logic_ section below describes how to use this
  to match your query's logic to your servers.




@body



The `can-query` package provides methods that
perform data queries and compare queries against
each other.

For example, the following gets all completed
tasks from a list of tasks:

```js
var tasks = [
  {
      id: 1,
      attributes: {
          name: "do the dishes",
          complete: true
      }
  },
  {
      id: 2,
      attributes: {
          name: "wash the car",
          complete: false
      }
  }
]

var result = query.filterMembers({
  where: {complete: true}
}, tasks);

result //-> [
  {
      id: 1,
      attributes: {
          name: "do the dishes",
          complete: true
      }
  }
]
```

`can-query` is most unique in that it can
can compare queries themselves.  For example,
the returns a query that represents the
combination of two other queries:

```js
var result = query.union({
  where: {complete: true}
},{
  where: {complete: false}
})

result //-> {}
```

`can-query` uses a [can-query/types/query standard query format] that
looks like:

```js
{
  where: {name: {$ne: null}},
  page: {skip: 20, limit: 10},
  sort: {name: 1}
}
```

`can-query` assumes data in a [JSON API format](http://jsonapi.org/format/).

There are packages that provide functions used to
translate between different query and
data formats.  These are used to configure
your application's [can-service].


## Special Comparison Logic



For example,
we can define a `StringIgnoreCaseSet` which will be used to compare
`status` query values:

```js
class StringIgnoreCaseSet {
    constructor(value) {
        this.value = value.toLowerCase();
    }
    isMember(value) {
        return this.value === value.toLowerCase()
    }
    valueOf() {
        return this.value;
    }
}

new Query({
    keys: {
        status: StringIgnoreCaseSet
    }
});
```
