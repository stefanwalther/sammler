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

		describe( "test-setup", () => {
			it( "test-config should have a source called 'root-repo1'", () => {
				expect( _.find( config.sources, {"name": "root-repo1"} ) ).to.exist.and.have.property( "name", "root-repo1" );
			} );

			it( "test-config should have a source called 'root-files' with filter file", () => {
				expect( _.find( config.sources, {"name": "root-files"} ) ).to.exist.and.have.property( "filter" ).of.length( 1 );
			} );

			it( "should return only files for test-config 'root-files'", ( done ) => {
				sammler.getContent( _.find( config.sources, {"name": "root-files"} ) )
					.then( ( data ) => {
						expect( data ).to.be.an( "array" ).of.length( 6 );
						//expect( _.filterByValues( data, "type", ["dir"] ) ).to.be.an( "array" ).of.length( 0 );
						//expect( _.filterByValues( data, "type", ["file"] ) ).to.be.an( "array" ).of.length( 6 );
						done();
					} )
			} );
		} );

		describe( "getContent", () => {

			it( "should resolve for .getContent", () => {
				let def = {
					user: "stefanwalther",
					repo: "sammler-test-repo1",
					path: "",
					ref: "master"
				};
				return expect( sammler.getContent( def ) ).to.eventually.be.fulfilled;
			} );

			it( "should reject .getContent for an unknown path", () => {
				let def = {
					user: "stefanwalther",
					repo: "sammler-test-repo1",
					path: "does-not-exist",
					ref: "master"
				};
				return expect( sammler.getContent( def ) ).to.eventually.be.rejectedWith( "Not Found" );
			} );

			it( "should fetch root files", ( done ) => {
				sammler.getContent( _.find( config.sources, {"name": "root-repo1"} ) )
					.then( function ( data ) {
						expect( data ).to.be.of.length( 7 );
						done();
					} )
			} );

			it( "should reject .getContent for an unknown user", () => {
				let def = {
					user: "bla-bla-stefan-walther",
					repo: "sammler-test-repo1",
					path: "",
					ref: "master"
				};
				return expect( sammler.getContent( def ) ).to.eventually.be.rejectedWith( "Not Found" );
			} );

			it( "should reject .getContent for an unknown rep", () => {
				let def = {
					user: "stefan-walther",
					repo: "does-not-exist",
					path: "",
					ref: "master"
				};
				return expect( sammler.getContent( def ) ).to.eventually.be.rejectedWith( "Not Found" );
			} );

			it( "should not reject .getContent for an unknown ref", () => {
				let def = {
					user: "stefanwalther",
					repo: "sammler-test-repo1",
					path: "",
					ref: "does-not-exist"
				};
				return expect( sammler.getContent( def ) ).to.eventually.be.fulfilled;
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
					.then( ( data ) => {
						expect( data ).to.exist;
						expect( _.filterByValues( data, "type", ["dir"] ) ).to.be.an( "array" ).of.length( 1 );
						expect( _.filterByValues( data, "type", ["file"] ) ).to.be.an( "array" ).of.length( 3 );
						done();
					} )
			} );

			it.only( "should retrieve contents recursively", ( done ) => {

				var sourceDef = _.find( config.sources, {"name": "root-repo1"} );
				sourceDef.recursive = true;
				sammler.getContentRec( sourceDef, true )
					.then( ( data ) => {
						expect( data ).to.exist.and.to.be.an("array").of.length(14);
						expect( _.filterByValues( data, "type", ["dir"] ) ).to.be.an("array").of.length(0);
						expect( _.filterByValues( data, "type", ["file"] ) ).to.be.an( "array" ).of.length( 14 );
						done();
					} );
			} );

		} );

		describe( "getContents", () => {

			it( "should be resolved with valid sourceDefs", () => {

				var sourceDefs = [];
				sourceDefs.push( _.find( config.sources, {"name": "root-repo1"} ) );
				sourceDefs.push( _.find( config.sources, {"name": "root-repo2"} ) );

				return expect( sammler.getContent( sourceDefs ) ).to.eventually.be.rejected;
			} );

			it( "should be rejected if one of the sourceDefs is rejected", () => {

				var sourceDefs = [];
				sourceDefs.push( _.find( config.sources, {"name": "root-repo1"} ) );
				sourceDefs.push( _.find( config.sources, {"name": "root-repo-eh-eh"} ) );

				return expect( sammler.getContent( sourceDefs ) ).to.eventually.be.rejectedWith( "Not Found" );
			} );
		} );

		it.skip( "should be able to fetch a directory recursively", ( done ) => {

			var sourceDefs = _.find( config.sources, {"name": "dir-1-recursive"} );
			sammler.getContent( sourceDefs )
				.then( ( data ) => {
					expect( data ).to.exist;
					expect( data ).to.be.an( "array" );
					//expect( _.filterByValues( data, "type", ["dir"] ) ).to.be.an( "array" ).of.length( 1 );
					//expect( _.filterByValues( data, "type", ["file"] ) ).to.be.an( "array" ).of.length( 5 );
					done();
				}, ( err ) => {
					expect( err ).to.not.exist;
					done();
				} )

		} );

	} );
} );
