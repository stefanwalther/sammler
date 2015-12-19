import lodashDeep from "lodash-deep";
import yaml from "js-yaml";
import fs from "fs";
import https from "https";
import extend from "extend-shallow";
import _ from "./lodash-extended";
import path from "path";
import S from "string";
import mkdirp from "mkdirp";
import octonode from "octonode";

export default class Sammler {
	constructor ( config ) {
		this.environment = process.env.NODE_ENV || "development";
		this.config = this._getConfig( config );
		this._init( this.config );
		this._client;

		var authToken = process.env.NODE_SAMMLER_TOKEN;
		if ( authToken ) {
			this._client = octonode.client( authToken );
		} else {
			this._client = octonode.client();
		}

	}

	get client() {
		return this._client;
	}

	/**
	 * Initialize the instance of Sammler.
	 * @param config
	 * @private
	 */
	_init ( config ) {

	}

	/**
	 * Get the current config
	 * @param instanceConfig
	 * @private
	 */
	_getConfig ( instanceConfig ) {
		let defaultConfig = {
			version: "3.0.0",
			debug: false, //(this.environment === 'development') ? true : false,
			protocol: "https",
			timeout: 5000
		};
		return extend( defaultConfig, instanceConfig );
	}

	/**
	 * Get the content of a given source-definition.
	 * @param sourceDef
	 * @returns {*}
	 */
	getContent ( sourceDef ) {

		return new Promise( ( resolved, rejected ) => {
			this._client.repo( sourceDef.user + "/" + sourceDef.repo, sourceDef.ref).contents( sourceDef.path, ( err, data ) => {
				if ( err ) {
					rejected( err );
				} else {
					//if ( sourceDef.recursive === true ) {
					//
					//}
					var filter = sourceDef.filter || ["dir", "file"];
					var filteredData;

					// only array of returned contents can be filtered, not a single item.
					if ( _.isArray( data ) ) {
						filteredData = _.filterByValues( data, "type", filter );
					}
					resolved( filteredData || data );
				}
			} );
		} );
	}


	/**
	 * Returns the collection of source-definitions.
	 * @param sourceDefArr
	 * @returns {Promise}
	 */
	getContents ( sourceDefArr ) {
		let getContentPromises = [];
		sourceDefArr.forEach( ( def ) => {
			getContentPromises.push( this.getContent( def ));
		});
		return Promise.all( getContentPromises );
	}

	_getLocalTarget ( localTarget, gitHubFile, gitHubPath ) {

		let baseLocalPath = localTarget;
		let file = S( gitHubFile ).chompLeft( gitHubPath ).chompLeft( '/' ).s;

		return path.normalize( path.join( baseLocalPath, file ) );

	}

	saveContent ( gitHubContent, requestedDir, target ) {

		let that = this;
		return new Promise( ( resolved, rejected ) => {
			let localTarget = path.resolve( that._getLocalTarget( target, gitHubContent.path, requestedDir ) );

			mkdirp.sync( path.dirname( localTarget ) );
			let file = fs.createWriteStream( localTarget );
			https.get( gitHubContent.download_url, ( response ) => {
				response.on("data", ( data) => {
					file.write( data );
				}).on("end", () => {
					file.end();
					resolved( file.path );
				})
			}).on("error", ( err ) => {
				rejected( err );
			});
		} );
	}

	/**
	 * Save a GitHub content to disk.
	 * @param gitHubContent
	 * @param target
	 * @private
	 */
	_saveToDisk ( gitHubContent, target ) {

	}

	saveContents ( sourceDefArray ) {

	}
}
