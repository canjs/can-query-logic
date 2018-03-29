module.exports = function(algebra, props, items){
	var id = algebra.id(props);

	for(var i = 0; i < items.length; i++) {
		var connId = algebra.id(items[i]);
		if( id == connId) {
			return i;
		}
	}
	return -1;
};
