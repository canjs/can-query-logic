import {DefineMap, QueryLogic, Reflect as canReflect} from "can";

class DateStringSet {
	constructor(value){
		this.value = value;
	}
	// used to convert to a number
	valueOf(){
		return new Date(this.value).getTime();
	}
}

canReflect.assignSymbols(DateStringSet.prototype,{
	"can.serialize": function(){
		return this.value;
	}
});

const DateString = {
	[Symbol.for("can.SetType")]: DateStringSet
};

const Todo = DefineMap.extend({
	id: {type: "number", identity: true},
	name: "string",
	date: DateString
});

const todo = new Todo({
	id: "1",
	name: "Thomas",
	date: "Wed Apr 04 2018 10:00:00 GMT-0500 (CDT)"
})

console.log( todo.date.valueOf() );
