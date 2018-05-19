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
import {DefineMap, QueryLogic} from "can";

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
    sort: "-name",
    page: {start: 0, end: 19}
},[
    {id: 1, name: "do dishes", complete: false},
    {id: 2, name: "mow lawn", complete: true},
    ...
]) //-> [matching records]
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
    sort: "-name",
    // Selects a range of the sorted result
    page: {start: 0, end: 19}
}
```

@param {function|can-reflect/schema} schemaOrType Defines the behavior of
keys on a [can-query-logic/query]. This is done with either:

  - A constructor function that supports [can-reflect.getSchema can-reflect.getSchema]. Currently, [can-define/map/map] supports the `can.getSchema` symbol:
    ```js
    import {DefineMap} from "can";

    const Todo = DefineMap.extend({
        id: {
            identity: true,
            type: "number"
        },
        name: "string",
        complete: "boolean"
    });
    new QueryLogic(Todo);
    ```
  - A [can-reflect.getSchema schema object] that looks like the following:
    ```js
    import {MaybeNumber, MaybeString, MaybeBoolean} from "can"
    new QueryLogic({
        // keys that uniquely represent this type
        identity: ["id"],
        keys: {
            id: MaybeNumber,
            name: MaybeString,
            complete: MaybeBoolean
        }
    })
    ```

    Note that if a key type (ex: `name: MaybeString`) is __not__ provided, filtering by that
    key will still work, but there won't be any type coercion. For example, the following
    might not produce the desired results:

    ```js
    var queryLogic = new QueryLogic({identity: ["id"]});
    queryLogic.union(
        {filter: {age: 7}},
        {filter: {age: "07"}}) //-> {filter: {age: {$in: [7,"07"]}}}
    ```
    Use types like [can-data-types/maybe-number/maybe-number] if you want to add basic
    type coercion:

    ```js
    var queryLogic = new QueryLogic({
        identity: ["id"],
        keys: {age: MaybeNumber}
    });
    queryLogic.union(
        {filter: {age: 7}},
        {filter: {age: "07"}}) //-> {filter: {age: 7}}
    ```

    If you need even more special key behavior, read [defining properties with special logic](#Definingfilterpropertieswithspeciallogic).

  By default, filter properties like `status` in `{filter: {status: "complete"}}`
  are used to create to one of the [can-query-logic/comparison-operators] like
  `GreaterThan`. A matching schema key will overwrite this behavior. How this
  works is explained in the [Defining filter properties with special logic](#Definingfilterpropertieswithspeciallogic) section below.

@param {Object} [options] The following _optional_ options are used to translate
  between the standard [can-query-logic/query] and the parameters the server expects:

  - `toQuery(params)` - Converts from the parameters used by the server to
    the standard [can-query-logic/query].
  - `toParams(query)` - Converts from the standard [can-query-logic/query]
    to the parameters used by the server.

  The [Changing the query structure](#Changingthequerystructure) section below describes how to use these options to match your query's logic to your servers.



@body

## Purpose

`can-query-logic` is used to give CanJS an _understanding_ of what __the parameters used to
retrieve a list of data__ represent.  This awareness helps other libraries like
[can-connect] and [can-fixture] provide real-time, caching and other behaviors.

__The parameters used to retrieve a list of data?__

In many applications, you request a list of data by making a `fetch` or `XMLHTTPRequest`
to a url like:

```
/api/todos?filter[complete]=true&sort=name
```

The values after the `?` are used to control the data that comes back. Those values are
[can-deparam deserialized] into
a query object look like this:

```js
{
    filter: {complete: true},
    sort: "name"
}
```

This object represents a [can-query-logic/query Query]. This specific query is for requesting completed todos and have the todos sorted by their _name_.  

A `QueryLogic` instance _understands_ what a `Query` represents. For example, it can filter records
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

The [can-query-logic.prototype.filterMembers] method allows `QueryLogic` to be used similar to a database. `QueryLogic` instances methods help solve other problems too:

- __real-time__ - [can-query-logic.prototype.isMember] returns if a particular item
belongs to a query and [can-query-logic.prototype.index] returns the location where that item belongs.
- __caching__ - [can-query-logic.prototype.isSubset] can tell you if you've already loaded
  data you are looking for.  [can-query-logic.prototype.difference] can tell you what data
  you need to load that already isn't in your cache.

In fact, `can-query-logic`'s most unique ability is to be able to directly compare
queries that represent sets of data instead of having to compare
the data itself. For example, if you already loaded all completed todos,
`can-query-logic` can tell you how to get all remaining todos:

```js
var completedTodosQuery = {filter: {complete: false}};
var allTodosQuery = {};
var remainingTodosQuery = queryLogic.difference(allTodosQuery, completedTodosQuery);

remainingTodosQuery //-> {filter: {complete: {$ne: false}}}
```

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
        complete: {$in: [false, null]}
    },
    // Sort the results of the selection
    sort: "-name",
    // Selects a range of the sorted result
    page: {start: 0, end: 19}
}
```

This structures follows the [Fetching Data JSONAPI specification](http://jsonapi.org/format/#fetching).

There's:

- a [filter](http://jsonapi.org/format/#fetching-filtering) property for filtering records,
- a [sort](http://jsonapi.org/format/#fetching-sorting) property for specifying the order to sort records, and
- a [page](http://jsonapi.org/format/#fetching-pagination) property that selects a range of the sorted result. _The range indexes are inclusive_.

> __NOTE__: [can-connect] does not follow the rest of the JSONAPI specification. Specifically
> [can-connect] expects your server to send back JSON data in a different format.

If you control the service layer, we __encourage__ you to make it match the default
[can-query-logic/query].  The default query structure also supports the following [can-query-logic/comparison-operators]: `$eq`, `$gt`, `$gte`, `$in`, `$lt`, `$lte`, `$ne`, `$nin`.

If you support the default structure, it's very likely the entire configuration you need to perform will
happen on the data type you pass to your [can-connect can-connect connection]. For example,
you might create a `Todo` data type and pass it to a connection like this:

```js
import {DefineMap, realtimeRestModel} from "can";

const Todo = DefineMap.extend({
  id: {
    identity: true,
    type: "number"
  },
  complete: "boolean",
  name: "string"
});

realtimeRestModel({
  url: "/todos",
  Map: Todo
});
```
@highlight 4,15

Internally, `realTimeRest` is using `Todo` to create and configure a `QueryLogic`
instance for you.  The previous example is equivalent to:

```js
import {DefineMap, realtimeRestModel, QueryLogic} from "can";

const Todo = DefineMap.extend({
  id: {
    identity: true,
    type: "number"
  },
  complete: "boolean",
  name: "string"
});

var todoQueryLogic = new QueryLogic(Todo);

realtimeRestModel({
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
// DEFINE YOUR TYPE
const Todo = DefineMap.extend({...});

// CREATE YOUR QUERY LOGIC
var todoQueryLogic = new QueryLogic(Todo, {
    // Takes what your service expects: {where: {...}}
    // Returns what QueryLogic expects: {filter: {...}}
    toQuery(params){
        var where = params.where;
        delete params.where;
        params.filter = where;
        return params;
    },
    // Takes what QueryLogic expects: {filter: {...}}
    // Returns what your service expects: {where: {...}}
    toParams(query){
        var where = query.filter;
        delete query.filter;
        query.where = where;
        return query;
    }
});

// PASS YOUR QueryLogic TO YOUR CONNECTION
realTimeRest({
  url: "/todos",
  Map: Todo,
  queryLogic: todoQueryLogic
});
```


### Defining filter properties with special logic

If the logic of the [can-query-logic/query default query] is not adequate to represent
the behavior of your service layer queries, you can define special classes called `SetType`s to
provide the additional logic.

Depending on your needs, this can be quite complex or rather simple. The following sections
provide configuration examples in increasing complexity.

Before reading the following sections, it's useful to have some background information on
how `can-query-logic` works.  We suggest reading the [How it works](#Howitworks) section.

#### Built-in special types

`can-query-logic` comes with functionality that can be used to create special logic. For example,
the [can-query-logic.makeEnum] method can be used to build a `Status` type that contains ONLY the
enumerated values:

```js
import {QueryLogic, DefineMap} from "can";

const Status = QueryLogic.makeEnum(["new","assigned","complete"]);

const Todo = DefineMap.extend({
    id: "number",
    status: Status,
    complete: "boolean",
    name: "string"
});

const todoLogic = new QueryLogic(Todo);
var unionQuery = todoLogic.union(
    {filter: {status: ["new","assigned"] }},
    {filter: {status: "complete" }}
)

unionQuery //-> {}
```

> NOTE: `unionQuery` is empty because if we loaded all todos that
> are new, assigned, and complete, we've loaded every todo.  
> The `{}` query would load every todo.

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
    // Return a set that would load all records in searchA and searchB.
    union(searchA, searchB){
        // If searchA's text contains searchB's text, then
        // searchB will include searchA's results.
        if(searchA.value.includes(searchB.value)) {
            // A:`food` ∪ B:`foo` => `foo`
            return searchB;
        }
        if(searchB.value.includes(searchA.value)) {
            // A:`foo` ∪ B:`food` => `foo`
            return searchA;
        }
        // A:`ice` ∪ B:`cream` => `ice` || `cream`
        return new QueryLogic.ValueOr([searchA, searchB]);
    },
    // Return a set that would load records shared by searchA and searchB.
    intersection(searchA, searchB){
        // If searchA's text contains searchB's text, then
        // searchA is the shared search results.
        if(searchA.value.includes(searchB.value)) {
            // A:`food` ∩ B:`foo` => `food`
            return searchA;
        }
        if(searchB.value.includes(searchA.value)) {
            // A:`foo` ∩ B:`food` => `food`
            return searchB;
        }
        // A:`ice` ∩ B:`cream` => `ice` && `cream`
        // But suppose AND isn't supported,
        // So we return `UNDEFINABLE`.
        return QueryLogic.UNDEFINABLE;
    },
    // Return a set that would load records in searchA that are not in
    // searchB.
    difference(searchA, searchB){
        // if searchA's text contains searchB's text, then
        // searchA has nothing outside what searchB would return.
        if(searchA.value.includes(searchB.value)) {
            // A:`food` \ B:`foo` => ∅
            return QueryLogic.EMPTY;
        }
        // If searchA has results outside searchB's results
        // then there are records, but we aren't able to
        // create a string that represents this.
        if(searchB.value.includes(searchA.value)) {
            // A:`foo` \ B:`food` => UNDEFINABLE
            return QueryLogic.UNDEFINABLE;
        }

        // A:`ice` \ B:`cream` => `ice` && !`cream`
        // If there's another situation, we
        // aren't able to express the difference
        // so we return UNDEFINABLE.
        return QueryLogic.UNDEFINABLE;
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

[can-define/map/map]s expose this type information as a schema:

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

The queries (ex: `{ filter: {name: "assigned"} }`) are hydrated to `SetType`s like:

```js
var assignedSet = new BasicQuery({
    filter: new And({
        name: new Status[Symbol.for("can.SetType")]("assigned")
    })
});
```

> NOTE: __hydrated__ is the opposite of serialization. It means we take
> a plain JavaScript object like `{ filter: {name: "assigned"} }` and
> create instances of types with it.

The following is a more complex query and what it gets hydrated to:

```js
// query
{
    filter: {
        age: {$gt: 22}
    },
    sort: "-name",
    page: {start: 0, end: 9}
}

// hydrated set types
new BasicQuery({
    filter: new And({
        age: new GreaterThan(22)
    }),
    sort: "-name",
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

`can-query-logic`s methods reflect [set theory](https://en.wikipedia.org/wiki/Set_theory)
 operations.  That's why most types need a `union`, `intersection`, and `difference`
 method.  With that, other methods like `isEqual` and `isSubset` can be derived.

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

The serialized output above is what is returned as a result of the union.


### Code Organization

On a high level, `can-query-logic` is organized in four places:

- `src/set.js` - The core "set logic" functionality. For example `set.isEqual`
  is built to derive from using underlying `difference` and `intersection` operators.
- `src/types/*` - These are the `SetType` constructors used to make comparisons between
  different sets or properties.
- `src/serializers/*` - These provide hydration and serialization methods used to
  change the plain JavaScript query objects to `SetType`s and back to plain JavaScript
  query objects.
- `can-query-logic.js` - Assembles all the different types and serializers to
  hydrate  a query object to a SetType instance, then uses `set.js`'s logic to
  perform the set logic and serialize the result.
