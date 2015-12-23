"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

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

var _octonode = require("octonode");

var _octonode2 = _interopRequireDefault(_octonode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Sammler = (function () {
	function Sammler(config) {
		_classCallCheck(this, Sammler);

		this.environment = process.env.NODE_ENV || "development";
		this.config = this._getConfig(config);
		this._init(this.config);
		this._client;

		var authToken = process.env.NODE_SAMMLER_TOKEN;
		if (authToken) {
			this._client = _octonode2.default.client(authToken);
		} else {
			this._client = _octonode2.default.client();
		}

		//Promise.prototype.finally = function ( callback ) {
		//	let p = this.constructor;
		//	// We don’t invoke the callback in here,
		//	// because we want then() to handle its exceptions
		//	return this.then(
		//		// Callback fulfills: pass on predecessor settlement
		//		// Callback rejects: pass on rejection (=omit 2nd arg.)
		//		value  => p.resolve( callback() ).then( () => value ),
		//		reason => p.resolve( callback() ).then( () => { throw reason } )
		//	);
		//};
	}

	_createClass(Sammler, [{
		key: "_init",

		/**
   * Initialize the instance of Sammler.
   * @param config
   * @private
   */
		value: function _init(config) {}

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

		//

	}, {
		key: "getContentRec",
		value: function getContentRec(sourceDef) {
			var _this = this;

			return this._getRepoContent(sourceDef.user, sourceDef.repo, sourceDef.ref, sourceDef.path).map(function (content) {
				var def = {
					user: sourceDef.user,
					repo: sourceDef.repo,
					ref: sourceDef.ref,
					path: content.path
				};
				return content.type === "dir" ? _this.getContentRec(def) : content;
			}).reduce(function (a, b) {
				return a.concat(b);
			}, []);
		}

		/**
   * Promisified call to get the content
   * @param rep
   * @param ref
   * @param path
   */

	}, {
		key: "_getRepoContent",
		value: function _getRepoContent(user, repo, ref, path) {
			var _this2 = this;

			return new _bluebird2.default(function (resolved, rejected) {
				_this2._client.repo(user + "/" + repo, ref).contents(path, function (err, data) {
					if (err) {
						rejected(err);
					} else {
						resolved(data);
					}
				});
			});
		}

		/**
   * Get the content of a given source-definition.
   * @param sourceDef
   * @param {String} sourceDef.user - The user (e.g. `stefanwalther`). Mandatory.
   * @param {String} sourceDef.repo - Name of the repository (e.g. `sammler-test-repo1`). Mandatory.
   * @param {String} sourceDef.ref - The branch, defaults to `master`.
   * @param {String} sourceDef.path - Path to fetch contents from (e.g. `dir-1` n sammler-test-repo1). Defaults to "".
   * @param {Boolean} recoursive - Whether to fetch contents recursively or not, defaults to false.
   * @returns {*}
   */

	}, {
		key: "getContent",
		value: function getContent(sourceDef, recursive) {
			var _this3 = this;

			var results = [];
			var that = this;
			return new _bluebird2.default(function (resolved, rejected) {
				_this3._getRepoContent(sourceDef.user, sourceDef.repo, sourceDef.ref, sourceDef.path).then(function (data) {
					//console.log( "dir", _.find( data, {type: "dir"} ) );
					if (recursive === true && _lodashExtended2.default.find(data, { type: "dir" })) {
						(function () {

							var fetchDirPromises = undefined;
							_lodashExtended2.default.where(data, { type: "dir" }, function (dir) {
								console.log("dir", dir);
								var fetchDirDef = {
									user: sourceDef.user,
									repo: sourceDef.repo,
									path: dir.path
								};
								console.log("fetchDirDef", fetchDirDef);
								fetchDirPromises.push(that.getContent(fetchDirDef, recursive));
							});
							//return Promise.all( fetchDirPromises );
							_bluebird2.default.all(fetchDirPromises).then(function (data) {
								resolved(data);
							});
						})();
					} else {
						var filter = sourceDef.filter || ["dir", "file"];
						var filteredData;
						// only array of returned contents can be filtered, not a single item.
						if (_lodashExtended2.default.isArray(data)) {
							filteredData = _lodashExtended2.default.filterByValues(data, "type", filter);
						}
						resolved(filteredData || data);
					}
				}).catch(function (err) {
					rejected(err);
				});
			});
		}
	}, {
		key: "_getFilteredData",
		value: function _getFilteredData() {}

		/**
   * Returns the collection of source-definitions.
   * @param sourceDefArr
   * @returns {Promise}
   */

	}, {
		key: "getContents",
		value: function getContents(sourceDefArr) {
			var _this4 = this;

			var getContentPromises = [];
			sourceDefArr.forEach(function (def) {
				getContentPromises.push(_this4.getContent(def));
			});
			return _bluebird2.default.all(getContentPromises);
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
			return new _bluebird2.default(function (resolved, rejected) {
				var localTarget = _path2.default.resolve(that._getLocalTarget(target, gitHubContent.path, requestedDir));

				_mkdirp2.default.sync(_path2.default.dirname(localTarget));
				var file = _fs2.default.createWriteStream(localTarget);
				_https2.default.get(gitHubContent.download_url, function (response) {
					response.on("data", function (data) {
						file.write(data);
					}).on("end", function () {
						file.end();
						resolved(file.path);
					});
				}).on("error", function (err) {
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
	}, {
		key: "client",
		get: function get() {
			return this._client;
		}
	}]);

	return Sammler;
})();

exports.default = Sammler;
//# sourceMappingURL=index.js.map
