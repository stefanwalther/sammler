"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Sammler = undefined;

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _https = require("https");

var _https2 = _interopRequireDefault(_https);

var _extendShallow = require("extend-shallow");

var _extendShallow2 = _interopRequireDefault(_extendShallow);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _string = require("string");

var _string2 = _interopRequireDefault(_string);

var _mkdirp = require("mkdirp");

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _octonode = require("octonode");

var _octonode2 = _interopRequireDefault(_octonode);

var _lodashDeep = require("lodash-deep");

var _lodashDeep2 = _interopRequireDefault(_lodashDeep);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_lodash2.default.mixin(_lodashDeep2.default);
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

var Sammler = exports.Sammler = (function () {
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
   * Get the content of a given source-definition.
   * @param {Object} sourceDef
   * @param {String} sourceDef.user - The user on GitHub (e.g. `stefanwalther`). Mandatory.
   * @param {String} sourceDef.repo - Name of the repository (e.g. `sammler-test-repo1`). Mandatory.
   * @param {String?} sourceDef.ref - The branch, defaults to `master`.
   * @param {String?} sourceDef.path - Path to fetch contents from (e.g. `dir-1` n sammler-test-repo1). Defaults to "".
   * @param {Boolean?} sourceDef.recursive - Whether to fetch contents recursively or not, defaults to false.
   *
   * @returns {Promise<Object>}
   */

	}, {
		key: "getContent",
		value: function getContent(sourceDef) {
			return this._getSingleContent(sourceDef);
		}

		/**
   * Save contents to disk.
   * @param {Object}sourceDef
   * @param {Object}gitHubContents
   * @param {String}targetDir
   */

	}, {
		key: "saveContents",
		value: function saveContents(sourceDef, gitHubContents, targetDir) {
			var _this = this;

			return new _bluebird2.default(function (resolved, rejected) {
				if (_this._arrayIfy(gitHubContents)) {
					var promises = [];
					gitHubContents.forEach(function (ghContent) {
						promises.push(_this._saveContent(ghContent, sourceDef.path, targetDir));
					});
					return _bluebird2.default.all(promises);
				} else {
					throw new Error("No contents passed to save!");
				}
			});
		}

		// ****************************************************************************************
		// Private methods
		// ****************************************************************************************
		/**
   * Arrayify an item.
   * @param item
   * @returns {*}
   * @private
   */

	}, {
		key: "_arrayIfy",
		value: function _arrayIfy(item) {
			if (_lodash2.default.isArray(item)) {
				return item;
			} else {
				var x = [];
				x.push(item);
				return x;
			}
		}

		/**
   * Filter either only directories, files or both from a given result-set.
   * @param data
   * @param {Array} filter The given filter, containing the following possible values: ["dir"], ["file"] or ["dir", "file"]. Defaults to the latter one.
   * @private
   * @returns {Promise.<*>}
   */

	}, {
		key: "_filter",
		value: function _filter(data, filter) {

			filter = filter || ["dir", "file"];
			var filteredData;
			// only array of returned contents can be filtered, not a single item.
			if (_lodash2.default.isArray(data)) {
				filteredData = _lodash2.default.filterByValues(data, "type", filter);
			}
			return _bluebird2.default.resolve(filteredData || data);
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
   * Promisified call to get the content using octonode.
   * (Since octonode is just used here and in _init, octonode could be replaced easily with another lib)
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
						resolved(_this2._arrayIfy(data));
					}
				});
			});
		}
	}, {
		key: "_getSingleContent",
		value: function _getSingleContent(sourceDef) {
			var _this3 = this;

			return this._getRepoContent(sourceDef.user, sourceDef.repo, sourceDef.ref, sourceDef.path).map(function (content) {
				var def = {
					user: sourceDef.user,
					repo: sourceDef.repo,
					ref: sourceDef.ref,
					path: content.path,
					recursive: sourceDef.recursive
				};
				return content.type === "dir" && sourceDef.recursive === true ? _this3._getSingleContent(def) : content;
			}).then(function (data) {
				return sourceDef.filter ? _this3._filter(data, sourceDef.filter) : _bluebird2.default.resolve(data);
			}).reduce(function (a, b) {
				return a.concat(b);
			}, []);
		}

		/**
   * Return a local target for a given gitHub file.
   * @param {String} localTarget - Local base target
   * @param {Object} gitHubFile - The GitHub content definition of a single file.
   * @param {String} gitHubPath - The original GitHub path of the repository.
   * @returns {string}
   * @private
   */

	}, {
		key: "_getLocalTarget",
		value: function _getLocalTarget(localTarget, gitHubFile, gitHubPath) {

			var baseLocalPath = localTarget;
			var file = (0, _string2.default)(gitHubFile).chompLeft(gitHubPath).chompLeft('/').s;

			return _path2.default.normalize(_path2.default.join(baseLocalPath, file));
		}

		/**
   * Saves a GitHub content to disk.
   * @param {Object}gitHubContent - The GitHub content (https://developer.github.com/v3/repos/contents/#response-if-content-is-a-file)
   * @param {String}requestedDir - The directory originally requested.
   * @param {String}target - The local directory to save the content to.
   * @private
   */

	}, {
		key: "_saveContent",
		value: function _saveContent(gitHubContent, requestedDir, target) {
			var _this4 = this;

			return new _bluebird2.default(function (resolved, rejected) {
				var localTarget = _path2.default.resolve(_this4._getLocalTarget(target, gitHubContent.path, requestedDir));

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
	}, {
		key: "client",
		get: function get() {
			return this._client;
		}
	}]);

	return Sammler;
})();