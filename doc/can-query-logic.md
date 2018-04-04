@module {function} can-query-logic
@parent can-data-modeling
@collection can-core
@group can-query-logic.prototype 1 prototype
@group can-query-logic/query-format 2 query format
@group can-query-logic.static 3 static methods

@group can-query-logic.static-types 4 static types
@outline 3

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
keys on a [can-query-logic/query]. This is done with either:

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
  between the standard [can-query-logic/query] and the parameters the server expects:

  - `toQuery(params)` - Converts from the parameters used by the server to
    the standard [can-query-logic/query].
  - `toParams(query)` - Converts from the standard [can-query-logic/query]
    to the parameters used by the server.

  The _Special Comparison Logic_ section below describes how to use these
  options to match your query's logic to your servers.



@body

## Purpose

`can-query-logic` is used to give CanJS an _understanding_ of what __the parameters used to
retrieve a list of data__ represent.  This awareness helps other libraries like
[can-connect] and [can-fixture] provide real-time, caching and other behaviors.

__The parameters used to retrieve a list of data?__

In many applications, you request a list of data by making a `fetch` or `XMLHTTPRequest`
to a url like:

```
/api/todos?filter[complete]=true&sort=name+asc
```

The values after the `?` are used to control the data that comes back. Those values [can-deparam]-ed into
a query object look like this:

```js
{
    filter: {complete: true},
    sort: "name asc"
}
```

This object represent a [can-query-logic/query Query]. This specific query indicates to
request completed todos and have them sorted by their _name_.  

A `QueryLogic` instance _understands_ what a `Query` represents. For example, it can filter items
that match a particular query:

```js
var todos = [
  { id: 1, name: "learn CanJS",   complete: true  },
  { id: 2, name: "wash the car",  complete: false },
  { id: 3, name: "do the dishes", complete: true  }
]

var queryLogic = new QueryLogic();

var result = queryLogic.filterMembers({
  filter: {complete: true}
}, todos);

result //-> [
//  { id: 3, name: "do the dishes", complete: true  },
//  { id: 1, name: "learn CanJS",   complete: true  }
//]
```

A [can-query-logic.prototype.isMember] to see if a particular item
belongs to a query and [can-query-logic.prototype.index] to get the location where that
item should be inserted.  This is particularly useful for creating real-time behaviors.

## Use

There are two main uses of `can-query-logic`:

- Configuring a `QueryLogic` instance to match your service behavior.
- Using a `QueryLogic` instance to create a new [can-connect] behavior.



## Configuration

Most people will only ever need to configure a
`QueryLogic` logic instance.  Once properly configured, all [can-connect] behaviors will
work correctly.  If your service parameters matches the [can-query-logic/query default query structure],
you likely don't need to use `can-query-logic` directly at all.  However, if your service parameters differ from
the [can-query-logic/query default query structure] or they need additional logic, some configuration will be necessary.

### Matching the default query structure

By default, `can-query-logic` assumes your service layer will match a [can-query-logic/query default query structure]
that looks like:

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

There's:

- a `filter` property for filtering records,
- a `sort` property for specifying the order to sort records, and
- a `page` property that selects a range of the sorted result.

If you control the service layer, we __encourage__ you to make it match the default
[can-query-logic/query].  The default query structure also supports the following [can-query-logic/comparison-operators]: `$eq`, `$gt`, `$gte`, `$in`, `$lt`, `$lte`, `$ne`, `$nin`.

If you support the default structure, it's very likely all the configuration you need to perform will
happen on the data type you pass to your [can-connect can-connect connection]. For example,
you might create a `Todo` data type and pass it to a connection like this:

```js
import DefineMap from "can-define/map/map";
import realTimeRest from "can-real-time-rest";

const Todo = DefineMap.extend({
  id: {
    identity: true,
    type: "number"
  },
  complete: "boolean",
  name: "string"
});

realTimeRest({
  url: "/todos",
  Map: Todo
});
```
@highlight 4,15

Internally, `realTimeRest` is using `Todo` to create and configure a `QueryLogic`
instance for you.  The previous example is equivalent to:

```js
import DefineMap from "can-define/map/map";
import realTimeRest from "can-real-time-rest";
import QueryLogic from "can-query-logic";

const Todo = DefineMap.extend({
  id: {
    identity: true,
    type: "number"
  },
  complete: "boolean",
  name: "string"
});

var todoQueryLogic = new QueryLogic(Todo);

realTimeRest({
  url: "/todos",
  Map: Todo,
  queryLogic: todoQueryLogic
});
```
@highlight 14,19

If your services don't match the default query structure or logic, read on to
see how to configure your query to match your service layer.

### Changing the query structure

If the logic of your service layer matches the logic of the [can-query-logic/query default query], but the form
of the query parameters is different, the easiest way to configure the `QueryLogic` is to
translate your parameter structure to the [can-query-logic/query default query structure].

For example, to change queries to use `where` instead of `filter` so that queries can be
made like:

```js
Todo.getList({
    where: {complete: true}
})
```

You can use the `options`'s `toQuery` and `toParams` functions
to set the `filter` property value to the passed in `where` property value.

```js
// 1. DEFINE YOUR TYPE
const Todo = DefineMap.extend({...});

var todoQueryLogic = new QueryLogic(Todo, {
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

// 2. CREATE YOUR CONNECTION
realTimeRest({
  url: "/todos",
  Map: Todo,
  queryLogic: todoQueryLogic
});
```


### Defining filter properties with special logic

If the logic of the [can-query-logic/query default query] is not adequate to represent
the behavior of your service layer queries, you can define special behaviors called `SetType`s to
provide the additional logic.

Depending on your needs, this can be quite complex or rather simple. The following sections
provide configuration examples in increasing complexity.

Before reading the following sections, it's useful to have some background information on
how `can-query-logic` works.

`can-query-logic` uses [set theory](https://en.wikipedia.org/wiki/Set_theory)

#### Built-in special types

`can-query-logic` comes with functionality that can be used to create special logic. For example,
the [can-query-logic.makeEnum] method can be used to build a `Status` type that contains ONLY the
enumerated values:

```js
import QueryLogic from "can-query-logic";
import DefineMap from "can-define/map/map";

const Status = QueryLogic.makeEnum(["new","assigned","complete"]);

const Todo = DefineMap.extend({
    id: "number",
    status: Status,
    complete: "boolean",
    name: "string"
});

const todoLogic = new QueryLogic(Todo);
todoLogic.union(
    {filter: {status: ["new","assigned"] }},
    {filter: {status: "complete" }}
) //-> {}
```


#### Custom types that work with the comparison operators

If your type can be represented by a number or string, then you can


```js
class DateStr(){
    constructor(value){
        this.value = value;
    }
    valueOf(){
        return new Date(this.value).getTime()
    }
}
```


#### Completely custom types




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


### Testing your QueryLogic

It can be very useful to test your `QueryLogic` before using it with [can-connect].

```js
Type = DefineMap.extend({ ... })

var queryLogic = new QueryLogic(Todo, {
    toQuery(params){ ... },
    toParams(query){ ... }
})

unit.test("isMember", function(){
    var result = queryLogic.isMember({
        filter: {special: "SOMETHING SPECIAL"}
    },{
        id: 0,
        name: "I'm very special"
    });
    assert.ok(result, "is member");
})

```
