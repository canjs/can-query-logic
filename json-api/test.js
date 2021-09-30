var QUnit = require("steal-qunit");
var QueryLogic = require("can-query-logic");
var canReflect = require("can-reflect");
const DefineMap = require('can-define-map')

// export const DateString = {
//   [Symbol.for("can.new")]: function (v) {
//     return v;
//   },
//   [Symbol.for("can.SetType")]: DateStringSet,
// };

QUnit.module("can-query-logic");

const skills = [
	{ id: 1, name: "React" },
  { id: 2, name: "Angular" },
  { id: 3, name: "DevOps" },
  { id: 4, name: "Node" },
  { id: 5, name: "UX" },
  { id: 6, name: "Design" },
]

const employees = [
	{ id: 1, name: 'Patrick', skill: "React" },
	{ id: 2, name: 'Marshall', skill: "Node" },
	{ id: 3, name: 'Justin', skill: "UX" },
]

QUnit.test("union", function(assert) {
	const queryLogic = new QueryLogic({
		identity: ["id"],
		keys: {
			id: "string",
			name: "string",
			// startDate: DateString,
			// endDate: DateString,
			skills: {
			  type: "list",
			  values: {
			    keys: {
			      id: "string",
			      name: "string",
			    },
			  },
			  keys: {
			    count: "number",
			  },
			},
		},
	});


	debugger

	console.log(typeof test)

	const results = queryLogic.filterMembers(
		{ filter: { name: { $in: ['Patrick', 'Justin']} } },
		employees,
	)

	console.log(results)
});
