var set = require("../set");


var within = function(value, range){
	return value >= range[0] && value <= range[1];
};
var numericProperties = function(setA, setB, property1, property2){
	return {
		sAv1: +setA[property1],
		sAv2: +setA[property2],
		sBv1: +setB[property1],
		sBv2: +setB[property2],
	};
};

// diff from setA's perspective
var diff = function(setA, setB, property1, property2){
	// p for param
	// v for value
	var numProps = numericProperties(setA, setB, property1, property2);
	var sAv1 = numProps.sAv1,
		sAv2 = numProps.sAv2,
		sBv1 = numProps.sBv1,
		sBv2 = numProps.sBv2,
		count = sAv2 - sAv1 + 1;

	var after = {
		difference: [sBv2+1, sAv2],
		intersection: [sAv1,sBv2],
		union: [sBv1, sAv2],
		count: count,
		meta: "after"
	};
	var before = {
		difference: [sAv1, sBv1-1],
		intersection: [sBv1,sAv2],
		union: [sAv1, sBv2],
		count: count,
		meta: "before"
	};

	// if the sets are equal
	if(sAv1 === sBv1 && sAv2 === sBv2) {
		return {
			intersection: [sAv1,sAv2],
			union: [sAv1,sAv2],
			count: count,
			meta: "equal"
		};
	}
	// A starts at B but A ends later
	else if( sAv1 === sBv1 && sBv2 < sAv2 ) {
		return after;
	}
	// A end at B but A starts earlier
	else if( sAv2 === sBv2 && sBv1 > sAv1 ) {
		return before;
	}
	// B contains A
	else if( within(sAv1, [sBv1, sBv2]) && within(sAv2, [sBv1, sBv2]) ) {
		return {
			intersection: [sAv1,sAv2],
			union: [sBv1, sBv2],
			count: count,
			meta: "subset"
		};
	}
	// A contains B
	else if( within(sBv1, [sAv1, sAv2]) && within(sBv2, [sAv1, sAv2]) ) {
		return {
			intersection: [sBv1,sBv2],
			// there is a difference in what A has
			difference: [null, null],
			union: [sAv1, sAv2],
			count: count,
			meta: "superset"
		};
	}
	// setA starts earlier and overlaps setB
	else if(sAv1 < sBv1 && within(sAv2, [sBv1, sBv2]) ) {
		return before;
	}
	// setB starts earlier and overlaps setA
	else if(sBv1 < sAv1 && within(sBv2, [sAv1, sAv2]) ) {
		return after;
	}
	// side by side ... nothing intersection
	else if(sAv2 === sBv1-1) {
		return {
			difference: [sAv1,sAv2],
			union: [sAv1, sBv2],
			count: count,
			meta: "disjoint-before"
		};
	}

	else if(sBv2 === sAv1 - 1) {
		return {
			difference: [sAv1,sAv2],
			union: [sBv1, sAv2],
			count: count,
			meta: "disjoint-after"
		};
	}
	if(!isNaN(count)) {
		return {
			count: count,
			meta: "disjoint"
		};
	}

};


module.exports = function(min, max) {
    function isUniversal(range) {
        return range.start <= min && range.end >= max;
    }

    function RealNumberRangeInclusive(start, end){
        this.start = arguments.length > 0 ? start : min;
        this.end = arguments.length > 1 ? end : max;
    }

    function intersection(range1, range2){
        var result = diff(range1, range2,"start","end");
        if(result.intersection) {
            return new RealNumberRangeInclusive(result.intersection[0], result.intersection[1]);
        } else {
            return set.EMPTY;
        }
    }

    function difference(range1, range2){
        var result = diff(range1, range2,"start","end");
        if(result.difference) {
            return new RealNumberRangeInclusive(result.difference[0], result.difference[1]);
        } else {
            return set.EMPTY;
        }
    }

    set.defineComparison(RealNumberRangeInclusive, RealNumberRangeInclusive,{
        union: function(range1, range2){
            var result = diff(range1, range2,"start","end");
            if(result.union) {
                return new RealNumberRangeInclusive(result.union[0], result.union[1]);
            } else {
                return set.EMPTY;
            }
        },
        intersection: intersection,
        difference: difference
    });

    set.defineComparison(RealNumberRangeInclusive, set.UNIVERSAL, {
        difference: function(range){
            if(isUniversal(range)) {
                return set.EMPTY;
            } else {
                return difference(range, {start: min, end: max});
            }
        },
        intersection: function(range) {return range;}
    });

    set.defineComparison(set.UNIVERSAL,RealNumberRangeInclusive, {
        difference: function(universe, range){
            if(isUniversal(range)) {
                return set.EMPTY;
            } else {
                return difference({start: min, end: max}, range);
            }
        }
    });

    return RealNumberRangeInclusive;
};
