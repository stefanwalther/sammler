/*global describe, beforeEach, it*/
import Sammler from "./../../lib/index.js";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import fsUtils from "fs-utils";
import path from "path";
import _ from "./../../lib/lodash-extended";
chai.use( chaiAsPromised );

let expect = chai.expect;

describe( 'Sammler (e2e tests)', () => {

	var sammler = null;

	describe( "when fetching a single repo (sammler-test-reop1)", () => {

		var config = fsUtils.readYAMLSync( path.join( __dirname, './sammler-test-repo1.yml' ) );

		beforeEach( () => {
			sammler = new Sammler( config.gitHubApi );
		} );

		it( "should be a proper object", () => {
			expect( sammler ).to.be.an.object;
		} );

		it( "test-config should have a source called 'root'", () => {
			expect( _.find( config.sources, {"name": "root"} ) ).to.exist.and.have.property( "repo" );
		} );

		it( "should fetch root files", ( done ) => {

			sammler.getContent( _.find( config.sources, {"name": "root"} ) )
				.then( function ( data ) {
					expect( data ).to.be.of.length( 7 );
					done();
				} )
		} );

		it( "test-config should have a source called 'root-files' with filter file", () => {
			expect( _.find( config.sources, {"name": "root-files"} ) ).to.exist.and.have.property( "filter" ).of.length( 1 );
		} );

		it( "should return only files for test-config 'root-files'", ( done ) => {
			sammler.getContent( _.find( config.sources, {"name": "root-files"} ) )
				.then( function ( data ) {
					expect( data ).to.be.an( "array" ).of.length( 6 );
					expect( _.filterByValues( data, "type", ["dir"] ) ).to.be.an( "array" ).of.length( 0 );
					expect( _.filterByValues( data, "type", ["file"] ) ).to.be.an( "array" ).of.length( 6 );
					done();
				} )
		} );

		it( "should be able to fetch a single file w file extension (README.md)", () => {
			var sourceConfig = _.find( config.sources, {"name": "root-readme"} );
			return expect( sammler.getContent( sourceConfig ) ).to.eventually.have.property( "name", "README.md" );
		} );

		it( "should be able to fetch a single file w/o file extension (LICENSE)", () => {
			var sourceConfig = _.find( config.sources, {"name": "root-license"} );
			return expect( sammler.getContent( sourceConfig ) ).to.eventually.have.property( "name", "LICENSE" );
		} );

		it( "should be able to fetch a directory with all the contents (non recursive)", ( done ) => {

			var sourceConfig = _.find( config.sources, {"name": "dir-1"} );
			sammler.getContent( sourceConfig )
				.then( function ( data ) {
					expect( data ).to.exist;
					expect( data ).to.be.an( "array" );
					expect( _.filterByValues( data, "type", ["dir"] ) ).to.be.an( "array" ).of.length( 1 );
					expect( _.filterByValues( data, "type", ["file"] ) ).to.be.an( "array" ).of.length( 3 );
					done();
				} )
		} );

		it.skip( "should be able to fetch a directory recursively", ( done ) => {

			var sourceConfig = _.find( config.sources, {"name": "dir-1-recursive"} );
			sammler.getContent( sourceConfig )
				.then( function ( data ) {
					expect( data ).to.exist;
					expect( data ).to.be.an( "array" );
					expect( _.filterByValues( data, "type", ["dir"] ) ).to.be.an( "array" ).of.length( 1 );
					expect( _.filterByValues( data, "type", ["file"] ) ).to.be.an( "array" ).of.length( 5 );
					done();
				} )

		} );

	} );
} );
