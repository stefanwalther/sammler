import Promise from "bluebird";
import fs from "fs";
import https from "https";
import extend from "extend-shallow";
import _ from "lodash";
import path from "path";
import s from "string";
import mkdirp from "mkdirp";
import octonode from "octonode";
import lodashDeep from "lodash-deep";

function resolveKey ( obj, key ) {
	return (typeof key === "function") ? key( obj ) : _.deepGet( obj, key );
}
_.mixin( lodashDeep );
_.mixin( {
	"filterByValues": function ( collection, key, values ) {
		return _.filter( collection, function ( o ) {
			return _.contains( values, resolveKey( o, key ) );
		} );
	}
} );

export class Sammler {
	constructor ( config ) {
		this.environment = process.env.NODE_ENV || "development";
		this.config = this._getConfig( config );
		this._init( this.config );
		this._client = null;

		var authToken = process.env.NODE_SAMMLER_TOKEN;
		if ( authToken ) {
			this._client = octonode.client( authToken );
		} else {
			this._client = octonode.client();
		}
	}

	get client () {
		return this._client;
	}

	/**
	 * Initialize the instance of Sammler.
	 * @param config
	 * @private
	 */
	_init ( /*config*/ ) {

	}

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
	getContent ( sourceDef ) {
		return this._getSingleContent( sourceDef );
	}

	/**
	 * Save contents to disk.
	 * @param {Object}sourceDef - The source definition.
	 * @param {Object}gitHubContents - Retrieved gitHub contents.
	 * @param {String}targetDir - The local target directory.
	 */
	saveContents ( sourceDef, gitHubContents, targetDir ) {

		if ( this._arrayIfy( gitHubContents ) ) {
			var promises = [];
			gitHubContents.forEach( ( ghContent ) => {
				promises.push( this._saveContent( ghContent, sourceDef.path, targetDir ) );
			} );
			return Promise.all( promises );
		} else {
			return Promise.rejected( "No contents passed to save!" );
		}
	}

	/**
	 * Retrieve gitHub contents based on a source-definition and store the results to the given target directory.
	 * Basically calls .getContent() and then .saveContents()
	 * @param sourceDef
	 * @param targetDir
	 */
	fetchContents ( sourceDef, targetDir ) {

		return new Promise( ( resolved, rejected ) => {
			this.getContent( sourceDef )
				.then( ( gitHubContents ) => {
					this.saveContents( sourceDef, gitHubContents, targetDir )
						.then( ( data ) => {
							resolved( data );
						} );
				} );
		} );
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
	_arrayIfy ( item ) {
		if ( _.isArray( item ) ) {
			return item;
		} else {
			let x = [];
			x.push( item );
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
	_filter ( data, filter ) {

		filter = filter || ["dir", "file"];
		var filteredData;
		// only array of returned contents can be filtered, not a single item.
		if ( _.isArray( data ) ) {
			filteredData = _.filterByValues( data, "type", filter );
		}
		return Promise.resolve( filteredData || data );
	}

	/**
	 * Get the current config
	 * @param instanceConfig
	 * @private
	 */
	_getConfig ( instanceConfig ) {
		let defaultConfig = {
			version: "3.0.0",
			debug: false, //(this.environment === "development") ? true : false,
			protocol: "https",
			timeout: 5000
		};
		return extend( defaultConfig, instanceConfig );
	}

	/**
	 * Promisified call to get the content using octonode.
	 * (Since octonode is just used here and in _init, octonode could be replaced easily with another lib)
	 * @param rep
	 * @param ref
	 * @param ghPath
	 */
	_getRepoContent ( user, repo, ref, ghPath ) {
		return new Promise( ( resolved, rejected ) => {
			this._client.repo( user + "/" + repo, ref ).contents( ghPath, ( err, data ) => {
				if ( err ) {
					rejected( err );
				} else {
					resolved( this._arrayIfy( data ) );
				}
			} );
		} );
	}

	_getSingleContent ( sourceDef ) {

		return this._getRepoContent( sourceDef.user, sourceDef.repo, sourceDef.ref, sourceDef.path )
			.map( ( content ) => {
				let def = {
					user: sourceDef.user,
					repo: sourceDef.repo,
					ref: sourceDef.ref,
					path: content.path,
					recursive: sourceDef.recursive
				};
				return (content.type === "dir" && sourceDef.recursive === true) ? this._getSingleContent( def ) : content;
			} )
			.then( ( data ) => {
				return sourceDef.filter ? this._filter( data, sourceDef.filter ) : Promise.resolve( data );
			} )
			.reduce( ( a, b ) => {
				return a.concat( b );
			}, [] );
	}

	/**
	 * Return a local target for a given gitHub file.
	 * @param {String} localTarget - Local base target
	 * @param {Object} gitHubFile - The GitHub content definition of a single file.
	 * @param {String} gitHubPath - The original GitHub path of the repository.
	 * @returns {string}
	 * @private
	 */
	_getLocalTarget ( localTarget, gitHubFile, gitHubPath ) {

		let baseLocalPath = localTarget;
		let file = s( gitHubFile ).chompLeft( gitHubPath ).chompLeft( "/" ).s;

		return path.normalize( path.join( baseLocalPath, file ) );
	}

	/**
	 * Saves a GitHub content to disk.
	 * @param {Object}gitHubContent - The GitHub content (https://developer.github.com/v3/repos/contents/#response-if-content-is-a-file)
	 * @param {String}requestedDir - The directory originally requested.
	 * @param {String}target - The local directory to save the content to.
	 * @private
	 */
	_saveContent ( gitHubContent, requestedDir, target ) {

		return new Promise( ( resolved, rejected ) => {
			let localTarget = path.resolve( this._getLocalTarget( target, gitHubContent.path, requestedDir ) );

			mkdirp.sync( path.dirname( localTarget ) );
			let file = fs.createWriteStream( localTarget );
			https.get( gitHubContent.download_url, ( response ) => {
				response.on( "data", ( data ) => {
					file.write( data );
				} ).on( "end", () => {
					file.end();
					resolved( file.path );
				} );
			} ).on( "error", ( err ) => {
				rejected( err );
			} );
		} );
	}

}
