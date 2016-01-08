/* global define, it, describe, beforeEach, afterEach */
import { SammlerGitHub } from "./../../lib/index.js";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import fsUtils from "fs-utils";
import path from "path";
import _ from "lodash";
import del from "del";

chai.use( chaiAsPromised );

let expect = chai.expect;

describe( "Sammler (e2e tests)", () => {

	var sammlerGitHub = null;

	describe( "when fetching a single repo (sammler-test-reop1)", () => {

		var config = fsUtils.readYAMLSync( path.join( __dirname, "./sammler-test-repo1.yml" ) );

		beforeEach( () => {
			sammlerGitHub = new SammlerGitHub( config.gitHubApi );
		} );

		it( "should be a proper object", () => {
			expect( sammlerGitHub ).to.be.an.object;
		} );

		describe( "test-setup", () => {
			it( "test-config should have a source called 'root-repo1'", () => {
				expect( _.find( config.sources, {"name": "root-repo1"} ) ).to.exist.and.have.property( "name", "root-repo1" );
			} );

			it( "test-config should have a source called 'root-files' with filter file", () => {
				expect( _.find( config.sources, {"name": "root-files"} ) ).to.exist.and.have.property( "filter" ).of.length( 1 );
			} );

			it( "should return only files for test-config 'root-files'", ( done ) => {
				sammlerGitHub.getContent( _.find( config.sources, {"name": "root-files"} ) )
					.then( ( data ) => {
						expect( data ).to.be.an( "array" ).of.length( 6 );
						expect( _.filterByValues( data, "type", ["dir"] ) ).to.be.an( "array" ).of.length( 0 );
						expect( _.filterByValues( data, "type", ["file"] ) ).to.be.an( "array" ).of.length( 6 );
						done();
					} );
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
				return expect( sammlerGitHub.getContent( def ) ).to.eventually.be.fulfilled;
			} );

			it( "should reject .getContent for an unknown path", () => {
				let def = {
					user: "stefanwalther",
					repo: "sammler-test-repo1",
					path: "does-not-exist",
					ref: "master"
				};
				return expect( sammlerGitHub.getContent( def ) ).to.eventually.be.rejectedWith( "Not Found" );
			} );

			it( "should fetch root files", ( done ) => {
				sammlerGitHub.getContent( _.find( config.sources, {"name": "root-repo1"} ) )
					.then( function ( data ) {
						expect( data ).to.be.of.length( 8 );
						done();
					} );
			} );

			it( "should reject .getContent for an unknown user", () => {
				let def = {
					user: "bla-bla-stefan-walther",
					repo: "sammler-test-repo1",
					path: "",
					ref: "master"
				};
				return expect( sammlerGitHub.getContent( def ) ).to.eventually.be.rejectedWith( "Not Found" );
			} );

			it( "should reject .getContent for an unknown rep", () => {
				let def = {
					user: "stefan-walther",
					repo: "does-not-exist",
					path: "",
					ref: "master"
				};
				return expect( sammlerGitHub.getContent( def ) ).to.eventually.be.rejectedWith( "Not Found" );
			} );

			it( "should not reject .getContent for an unknown ref", () => {
				let def = {
					user: "stefanwalther",
					repo: "sammler-test-repo1",
					path: "",
					ref: "does-not-exist"
				};
				return expect( sammlerGitHub.getContent( def ) ).to.eventually.be.fulfilled;
			} );

			it( "should be able to fetch a single file w file extension (README.md)", ( done ) => {
				var sourceConfig = _.find( config.sources, {"name": "root-readme"} );
				sammlerGitHub.getContent( sourceConfig ).then( ( data ) => {
					expect( data ).to.be.an( "array" ).of.length( 1 );
					expect( data[0] ).to.have.property( "name", "README.md" );
					done();
				} );
			} );

			it( "should be able to fetch a single file w/o file extension (LICENSE)", ( done ) => {
				var sourceConfig = _.find( config.sources, {"name": "root-license"} );
				sammlerGitHub.getContent( sourceConfig ).then( ( data ) => {
					expect( data ).to.be.an( "array" ).of.length( 1 );
					expect( data[0] ).to.have.property( "name", "LICENSE" );
					done();
				} );
			} );

			it( "should be able to fetch a directory with all the contents (non recursive)", ( done ) => {

				var sourceConfig = _.find( config.sources, {"name": "dir-1"} );
				sammlerGitHub.getContent( sourceConfig )
					.then( ( data ) => {
						expect( data ).to.exist;
						expect( _.filterByValues( data, "type", ["dir"] ) ).to.be.an( "array" ).of.length( 1 );
						expect( _.filterByValues( data, "type", ["file"] ) ).to.be.an( "array" ).of.length( 3 );
						done();
					} );
			} );

			it( "should retrieve contents recursively", ( done ) => {

				var sourceDef = _.find( config.sources, {"name": "root-repo1"} );
				sourceDef.recursive = true;
				sammlerGitHub.getContent( sourceDef )
					.then( ( data ) => {
						expect( data ).to.exist.and.to.be.an( "array" ).of.length( 16 );
						expect( _.filterByValues( data, "type", ["dir"] ) ).to.be.an( "array" ).of.length( 0 );
						expect( _.filterByValues( data, "type", ["file"] ) ).to.be.an( "array" ).of.length( 16 );
						done();
					} );
			} );

		} );

		describe( "fetchContents", () => {

			const targetDir = path.join( __dirname, "./.content" );
			beforeEach( ( done ) => {
				del( targetDir ).then( function () {
					done();
				} );
			} );

			//Todo: Add more tests
			//Todo: Add negative tests
			it( "saves results recursively for root-rep1", ( done ) => {
				var sourceDef = _.find( config.sources, {"name": "root-repo1"} );
				sourceDef.recursive = true;
				sammlerGitHub.fetchContents( sourceDef, path.normalize( targetDir ) )
					.then( ( data ) => {
						expect( data).to.exist;
						done();
					} );
			} );
		} );

	} );
} );
