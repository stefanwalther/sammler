"use strict";

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_lodash2.default.mixin(require("lodash-deep"));
_lodash2.default.mixin({
	'filterByValues': function filterByValues(collection, key, values) {
		return _lodash2.default.filter(collection, function (o) {
			return _lodash2.default.contains(values, resolveKey(o, key));
		});
	}
});

function resolveKey(obj, key) {
	return typeof key == 'function' ? key(obj) : _lodash2.default.deepGet(obj, key);
}

module.exports = _lodash2.default;
//# sourceMappingURL=lodash-extended.js.map
