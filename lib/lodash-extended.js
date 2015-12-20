import _ from "lodash";

_.mixin( require( "lodash-deep" ) );
_.mixin( {
	'filterByValues': function ( collection, key, values ) {
		return _.filter( collection, function ( o ) {
			return _.contains( values, resolveKey( o, key ) );
		} );
	}
} );

function resolveKey ( obj, key ) {
	return (typeof key == 'function') ? key( obj ) : _.deepGet( obj, key );
}

module.exports = _;