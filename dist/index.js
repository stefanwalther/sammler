"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); //import { Promise } from "bluebird";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _github = require("github");

var _github2 = _interopRequireDefault(_github);

var _lodashDeep = require("lodash-deep");

var _lodashDeep2 = _interopRequireDefault(_lodashDeep);

var _jsYaml = require("js-yaml");

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _https = require("https");

var _https2 = _interopRequireDefault(_https);

var _extendShallow = require("extend-shallow");

var _extendShallow2 = _interopRequireDefault(_extendShallow);

var _lodashExtended = require("./lodash-extended");

var _lodashExtended2 = _interopRequireDefault(_lodashExtended);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _string = require("string");

var _string2 = _interopRequireDefault(_string);

var _mkdirp = require("mkdirp");

var _mkdirp2 = _interopRequireDefault(_mkdirp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Sammler = (function () {
	function Sammler(config) {
		_classCallCheck(this, Sammler);

		this.gitHub = null;
		this.environment = process.env.NODE_ENV || "development";
		this._init(config);
	}

	/**
  * Initialize the instance of Sammler.
  * @param config
  * @private
  */

	_createClass(Sammler, [{
		key: "_init",
		value: function _init(config) {

			var that = this;
			var currentConfig = this._getConfig(config);
			this.gitHub = new _github2.default(currentConfig);

			var authToken = process.env.NODE_SAMMLER_TOKEN;
			if (authToken) {
				that.gitHub.authenticate({
					type: "oauth",
					token: authToken
				});
			}
		}

		/**
   * Get the current config
   * @param instanceConfig
   * @private
   */

	}, {
		key: "_getConfig",
		value: function _getConfig(instanceConfig) {
			var defaultConfig = {
				version: "3.0.0",
				debug: false, //(this.environment === 'development') ? true : false,
				protocol: "https",
				timeout: 5000
			};
			return (0, _extendShallow2.default)(defaultConfig, instanceConfig);
		}

		/**
   * Get the content of a given source-definition.
   * @param sourceDef
   * @returns {*}
   */

	}, {
		key: "getContent",
		value: function getContent(sourceDef) {
			var that = this;
			return new Promise(function (resolved, rejected) {
				that.gitHub.repos.getContent(sourceDef, function (err, data) {
					if (err) {
						rejected(err);
					} else {

						//if ( sourceDef.recursive === true ) {
						//
						//}

						var filter = sourceDef.filter || ["dir", "file"];
						var filteredData;

						// only array of returned contents can be filtered, not a single item.
						if (_lodashExtended2.default.isArray(data)) {
							filteredData = _lodashExtended2.default.filterByValues(data, "type", filter);
						}
						resolved(filteredData || data);
					}
				});
			});
		}

		/**
   * Returns the collection of source-definitions.
   * @param sourceDefArr
   * @returns {Promise}
   */

	}, {
		key: "getContents",
		value: function getContents(sourceDefArr) {
			var getContentPromises = sourceDefArr.map(this.gitHub.repos.getContent);
			return Promise.all(getContentPromises);
		}
	}, {
		key: "_getLocalTarget",
		value: function _getLocalTarget(localTarget, gitHubFile, gitHubPath) {

			var baseLocalPath = localTarget;
			var file = (0, _string2.default)(gitHubFile).chompLeft(gitHubPath).chompLeft('/').s;

			return _path2.default.normalize(_path2.default.join(baseLocalPath, file));
		}
	}, {
		key: "saveContent",
		value: function saveContent(gitHubContent, requestedDir, target) {

			var that = this;
			return new Promise(function (resolved, rejected) {
				var localTarget = _path2.default.resolve(that._getLocalTarget(target, gitHubContent.path, requestedDir));

				_mkdirp2.default.sync(_path2.default.dirname(localTarget));
				var file = _fs2.default.createWriteStream(localTarget);
				_https2.default.get(gitHubContent.download_url, function (response) {
					console.log('response.status', response.statusCode);
					response.pipe(file);
				}).on("error", function (e) {
					rejected(e);
				});
				file.on("finish", function () {
					file.close(function () {
						resolved(file.path);
					});
				});
				file.on("error", function (err) {
					console.error(err);
					rejected(err);
				});
			});
		}

		/**
   * Save a GitHub content to disk.
   * @param gitHubContent
   * @param target
   * @private
   */

	}, {
		key: "_saveToDisk",
		value: function _saveToDisk(gitHubContent, target) {}
	}, {
		key: "saveContents",
		value: function saveContents(sourceDefArray) {}
	}]);

	return Sammler;
})();

exports.default = Sammler;
//# sourceMappingURL=index.js.map
