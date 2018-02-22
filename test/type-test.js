var Type = require("../src/type");
var QUnit = require("steal-qunit");
var RealN

QUnit.module("can-type");

// There is a need for "subset" and "superset"
// Might have "real numbers"
// But want even and odds and integers
// Can't "build up" to real with all those other combinations
QUnit.test("real-number-range-inclusive", function(){

    function RealNumberRangeExclusive(start, end){
        this.start = start;
        this.end = end;
    }
    Type.compare(RealNumberRangeExclusive, RealNumberRangeExclusive, {
        union: function(){

        },
        intersection: function(){

        },
        difference: function(){

        }
    });


    Type(RealNumberRangeExclusive,[

    ])

    function GreaterThan(start) {

    }

    function EvenNumberRange(start, end) {

    }

    /*TYPE: INTEGERS-NUMBERS
        REPRESENT:
            TRUTHY (non 0)
            FALSEY (0)
            INFINITE (+/- Infinity)
            EVENs
            ODDs
            {$gte: 0}
        MEMBERS:
            -1,0,1,2,3*/

    function Integer(){}
    Type(Integer);

    /*function Even(){}
    Type(Even,{
        supersets: [
            Integer
        ]
    });*/

    function GreaterThan(value){
        this.value = value;
    }
    Type(GreaterThan,{
        is: function(member){
            // it would be nice if member was already checked?
            return this.value > member;
        },
        subsets: [
            ["self", function(possibleSubset){
                return this.value <= possibleSubset.value;
            }]
        ],
        supersets: [
            ["self", function(possibleSuperSet){
                return this.value >= possibleSuperSet.value;
            }]
        ]
        equal: [
            ["self", function(member){
                return this.value === member.value;
            }]
        ]
    });

    // GreaterThan Even
    function IntegerGreaterThan(value) {
        this.value = value;
    }
    Type.intersect(IntegerGreaterThan, GreaterThan, Integer);

    //Type.equal( new GreaterThan(5), new GreaterThan(6) );

    QUnit.equal( Type.subset( new GreaterThan(5), new IntegerGreaterThan(5)), false, "new GreaterThan(5) <= new IntegerGreaterThan(5) === false" );


    QUnit.equal( Type.subset( new IntegerGreaterThan(5), new GreaterThan(5)), true, "new IntegerGreaterThan(5) <= new GreaterThan(5) === true" );

    QUnit.equal( Type.subset( new IntegerGreaterThan(3), new GreaterThan(5)), false, "new IntegerGreaterThan(3) <= new GreaterThan(5) === false" );



    /*
    var Integer = Type("Integer",{
        is: function(member) {
            return Number.isInteger(member);
        },

    });
    var Even = Type("Even",{
        is: function(member){
            return Integer.is(member) && member % 2 === 0;
        },

    });

    // GT AND INTEGER

    var CanNumber = Type("CanNumber",{
        is: function(){
            return typeof member === "number";
        },
        subsets: [
            Integer
        ]
    });*/





})
