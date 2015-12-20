/*global describe, beforeEach, afterEach, it*/
import Sammler from "./../../lib/index.js";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiFs from "chai-fs";
import path from "path";
import del from "del";
chai.use( chaiAsPromised );
chai.use( chaiFs );

let expect = chai.expect;
let environment = process.env.NODE_ENV || "development";
var sammler = null;

describe( 'Sammler (Unit tests)', () => {

	beforeEach( () => {
		sammler = new Sammler();
	} );

	it( 'is an object', () => {
		expect( sammler ).to.be.an.object;
	} );

	describe( "getContent", () => {
		it( 'should be a function', () => {
			expect( sammler.getContent ).to.be.a( "function" );
		} );
	} );

	describe( "getContents", () => {

		it( "should be a function", () => {
			expect( sammler.getContents ).to.be.a( "function" );
		} );

		it( "should resolve for .getContents", () => {
			let defs = [
				{
					user: "stefanwalther",
					repo: "qliksense-extension-tutorial",
					path: "docs/faq",
					ref: ""
				},
				{
					user: "stefanwalther",
					repo: "qliksense-extension-tutorial",
					path: "docs/part-01",
					ref: ""
				}
			];
			return expect( sammler.getContents( defs ) ).to.eventually.be.an( "array" ).of.length( 2 );
		} );

	} );

	describe( "_getLocalTarget", () => {

		it( "should be a function", () => {
			expect( sammler._getLocalTarget ).to.be.a( "function" );
		} );

		it( "should return correct path", () => {

			expect( sammler._getLocalTarget( "./.content/", "dir-1/LICENSE.md", "dir-1" ) ).to.be.equal( path.normalize( "./.content/LICENSE.md" ) );
			expect( sammler._getLocalTarget( "./.content/", "dir-1/sub/LICENSE.md", "dir-1" ) ).to.be.equal( path.normalize( "./.content/sub/LICENSE.md" ) );

		} );

	} );

	describe( "saveContent", () => {

		var targetDir = path.join( __dirname, "./.content/" );

		beforeEach( ( done ) => {
			sammler = new Sammler();
			del( targetDir ).then( ( paths ) => {
				done();
			} );
		} );
		afterEach( ( done ) => {
			if ( environment === 'production' ) {
				del( targetDir ).then( ( paths ) => {
					done();
				} );
			} else {
				done();
			}
		} );

		it( "should be a function", () => {
			expect( sammler.saveContent ).to.be.a( "function" );
		} );

		it( "should save content to disk", ( done ) => {

			var gitHubContent = {
				path: "dir-1/.gitkeep",
				download_url: "https://raw.githubusercontent.com/stefanwalther/sammler-test-repo1/master/dir-1/.gitkeep"
			};

			sammler.saveContent( gitHubContent, "dir-1", targetDir )
				.then( ( data ) => {
					expect( data ).to.exist;
					expect( data ).to.be.a.file;
					expect( data ).to.have.content( "# Just some .gitkeep file" );
					done();
				}, ( err ) => {
					expect( err ).to.not.exist;
					done();
				} );
		} );

	} );

} );
