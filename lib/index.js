//import { Promise } from "bluebird";
import GitHubApi from "github";
import lodashDeep from "lodash-deep";
import yaml from "js-yaml";
import fs from "fs";
import https from "https";
import extend from "extend-shallow";
import _ from "./lodash-extended";
import path from "path";
import S from "string";
import mkdirp from "mkdirp";

export default class Sammler {

	constructor ( config ) {
		this.gitHub = null;
		this.environment = process.env.NODE_ENV || "development";
		this._init( config );
	}

	/**
	 * Initialize the instance of Sammler.
	 * @param config
	 * @private
	 */
	_init ( config ) {

		var that = this;
		let currentConfig = this._getConfig( config );
		this.gitHub = new GitHubApi( currentConfig );

		var authToken = process.env.NODE_SAMMLER_TOKEN;
		if ( authToken ) {
			that.gitHub.authenticate(
				{
					type: "oauth",
					token: authToken
				}
			);
		}
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
		var that = this;
		return new Promise( ( resolved, rejected ) => {
			that.gitHub.repos.getContent( sourceDef, ( err, data ) => {
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
		let getContentPromises = sourceDefArr.map( this.gitHub.repos.getContent );
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
					console.log( 'response.status', response.statusCode );
					response.pipe( file );
				} )
				.on( "error", ( e ) => {
					rejected( e );
				} );
			file.on( "finish", () => {
				file.close( () => {
					resolved( file.path );
				} );
			} );
			file.on( "error", ( err ) => {
				console.error( err );
				rejected( err );
			} )
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