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

This object represents a [can-query-logic/query Query]. This specific query indicates to
request completed todos and have the todos sorted by their _name_.  

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
work correctly.  If your service parameters match the [can-query-logic/query default query structure],
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

If you support the default structure, it's very likely the entire configuration you need to perform will
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

If a number or string can represent your type, then you can create a `SetType` class
that can be used with the comparison operators.

The `SetType` needs to be able to translate back and forth from
the values in the query to a number or string.

For example, you might want to represent a date with a string like:

```js
{
    filter: {date: {$gt: "Wed Apr 04 2018 10:00:00 GMT-0500 (CDT)"}}
}
```

The following creates a `DateStringSet` that translates a date string to a number:

```js
class DateStringSet {
    constructor(value){
        this.value = value;
    }
    // used to convert to a number
    valueOf(){
        return new Date(this.value).getTime()
    }
}
```

These classes must provide:

- `constructor` - initialized with the the value passed to a comparator (ex: `"Wed Apr 04 2018 10:00:00 GMT-0500 (CDT)"`).
- [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf valueOf] - return a string or number
  used to compare (ex: `1522854000000`).

To configure a `QueryLogic` to use a `SetType`, it must be the `can.SetType` property on a
schema's `keys` object.  This can be done directly like:

```js
new QueryLogic({
    keys: {
        date: {[Symbol.for("can.SetType")]: DateStringSet}
    }
});
```

More commonly, `DateStringSet` is the `can.SetType` symbol of a type like:

```js
const DateString = {
    [Symbol.for("can.SetType")]: DateStringSet
};
```

Then this `DateString` is used to configure your data type like:

```js
const Todo = DefineMap.extend({
    id: {type: "number", identity: true},
    name: "string",
    date: DateString
})
```

> NOTE: Types like `DateString` need to be distinguished from `SetType`s like
> `DateStringSet` because types like `DateString` have different values. For example,
> a `DateStringSet` might have a value like "yesterday", but this would not be a valid
> `DateString`.


#### Completely custom types

If you want total control over filtering logic, you can create a `SetType` that
provides the following:

- methods:
  - `can.isMember` - A function that returns if an object belongs to the query.
  - `can.serialize` - A function that returns the serialized form of the type for the query.
- comparisons:
  - `union` - The result of taking a union of two `SetType`s.
  - `intersection` - The result of taking an intersection of two `SetType`s.
  - `difference` - The result of taking a difference of two `SetType`s.

The following creates a `SearchableStringSet` that is able to perform searches that match
the provided text like:

```js
var recipes = [
    {id: 1, name: "garlic chicken"},
    {id: 2, name: "ice cream"},
    {id: 3, name: "chicken kiev"}
];

var result = queryLogic.filterMembers({
    filter: {name: "chicken"}
}, recipes);

result //-> [
       // {id: 1, name: "garlic chicken"},
       // {id: 3, name: "chicken kiev"}
       // ]
```

Notice how all values that match `chicken` are returned.


```js
// Takes the value of `name` (ex: `"chicken"`)
function SearchableStringSet(value) {
    this.value = value;
}

canReflect.assignSymbols(SearchableStringSet.prototype,{
    // Returns if the name on a todo is actually a member of the set.
    "can.isMember": function(value){
        return value.includes(this.value);
    },
    // Converts back to a value that can be in a query.
    "can.serialize": function(){
        return this.value;
    }
});

// Specify how to do the fundamental set comparisons.
QueryLogic.defineComparison(SearchableStringSet,SearchableStringSet,{
    union(searchA, searchB){
        // if searchA's text contains searchB's text, then
        // searchB will include searchA's results.
        if(searchA.value.includes(searchB.value)) {
            return searchB;
        }
        if(searchB.value.includes(searchA.value)) {
            return searchA;
        }
        return new QueryLogic.Or([searchA, searchB]);
    },
    intersection(searchA, searchB){
        // if searchA's text contains searchB's text, then
        // searchA is the shared search results.
        if(searchA.value.includes(searchB.value)) {
            return searchA;
        }
        if(searchB.value.includes(searchA.value)) {
            return searchB;
        }
        return QueryLogic.UNDEFINABLE;
    },
    difference(searchA, searchB){
        // if searchA's text contains searchB's text, then
        // searchA has outside what searchB would return.
        if(searchA.value.includes(searchB.value)) {
            return QueryLogic.EMPTY;
        }
        // If searchA has results outside searchB's results
        // then there are items, but we aren't able to
        // create a string that represents this.
        if(searchB.value.includes(searchA.value)) {
            return QueryLogic.UNDEFINABLE;
        }
        // If there's another situation, we
        // aren't able to tell if there is a difference.
        return QueryLogic.UNKNOWABLE;
    }
});
```

To configure a `QueryLogic` to use a `SetType`, it must be the `can.SetType` property on a
schema's `keys` object.  This can be done directly like:

```js
new QueryLogic({
    keys: {
        date: {[Symbol.for("can.SetType")]: SearchableStringSet}
    }
});
```

More commonly, `SearchableStringSet` is the `can.SetType` symbol of a type like:

```js
const SearchableString = {
    [Symbol.for("can.SetType")]: SearchableStringSet
};
```

Then this `SearchableString` is used to configure your data type like:

```js
const Todo = DefineMap.extend({
    id: {type: "number", identity: true},
    name: SearchableString,
    date: DateString
})
```

> NOTE: Types like `SearchableString` need to be distinguished from `SetType`s like
> `SearchableStringSet` because types like `SearchableString` have different values. For example,
> a `SearchableStringSet` might have a value like "yesterday", but this would not be a valid
> `SearchableString`.


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

## How it works

The following gives a rough overview of how `can-query-logic` works:

__1. Types are defined:__

A user defines the type of data that will be loaded from the server:

```js
const Todo = DefineMap.extend({
  id: {
    identity: true,
    type: Number
  },
  complete: Boolean,
  name: String,
  status: QueryLogic.makeEnum(["assigned","in-progress","complete"])
})
```

__2. The defined type exposes a schema:__

[can-define/map/map]'s expose this type information as a schema:

```js
var todoSchema = canReflect.getSchema(Todo);
todoSchema /*-> {
  identity: ["id"],
  keys: {
    id: Number,
    complete: Boolean,
    name: String,
    status: Status
  }
}*/
```

__3. The schema is used by `can-query-logic` to create set instances:__

When a call to `.union()` happens like:

```js
var todoQuery = new QueryLogic(todoSchema);

todoQuery.union(
    { filter: {name: "assigned"} },
    { filter: {name: "complete"} }
)
```

The queries (ex: `{ filter: {name: "assigned"} }`) are hydrated to set types like:

```js
var assignedSet = new BasicQuery({
    filter: new And({
        name: new Status[Symbol.for("can.SetType")]("assigned")
    })
});
```

The following is a more complex query and what it gets hydrated to:

```js
// query
{
    filter: {
        age: {$gt: 22}
    },
    sort: "name desc",
    page: {start: 0, end: 9}
}

// hydrated set types
new BasicQuery({
    filter: new And({
        age: new GreaterThan(22)
    }),
    sort: "name desc",
    page: new RealNumberRangeInclusive(0,9)
});
```


Once queries are hydrated, `can-query/src/set` is used to perform the union:

```js
set.union(assignedSet, completeSet);
```

`set.union` looks for comparator functions specified on their constructor's
`can.setComparisons` symbol property.  For example, `BasicQuery` has
a `can.setComparisons` property and value like the following:

```js
BasicQuery[Symbol.for("can.setComparisons")] = new Map([
    [BasicQuery]: new Map([
        [BasicQuery]: {union, difference, intersection}
        [QueryLogic.UNIVERSAL]: {difference}
    ])
]);
```

Types like `BasicQuery` and `And` are "composer" types.  Their
 `union`, `difference` and `intersection` methods perform
 `union`, `difference` and `intersection` on their children types.

In this case, `set.union` will call `BasicQuery`'s union with
itself.  This will see that the `sort` and `page` results match
and simply return a new `BasicQuery` with the union of the filters:

```js
new BasicQuery({
    filter: set.union( assignedSet.filter, completeSet.filter )
})
```

This will eventually result in a query like:

```js
new BasicQuery({
    filter: new And({
        name: new Status[Symbol.for("can.SetType")]("assigned", "complete")
    })
})
```

__4. The resulting query is serialized:__

Finally, this set will be serialized to:

```js
{
    filter: {
        name: ["assigned", "complete"]
    }
}
```

And this is what is returned as a result of the union.
