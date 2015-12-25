/* global define, it, describe, beforeEach, afterEach */
import { Sammler } from "./../../lib/index.js";
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

describe( "Sammler (Unit tests)", () => {

	beforeEach( () => {
		sammler = new Sammler();
	} );

	it( "is an object", () => {
		expect( sammler ).to.be.an.object;
	} );

	describe( "getContent", () => {
		it( "should be a function", () => {
			expect( sammler.getContent ).to.be.a( "function" );
		} );
	} );

	describe( "_getLocalTarget", () => {

		it( "should be a function", () => {
			expect( sammler._getLocalTarget ).to.be.a( "function" );
		} );

		it( "should return correct path", () => {

			expect( sammler._getLocalTarget( "./.content/", "dir-1/foo.md", "dir-1" ) ).to.be.equal( path.normalize( "./.content/foo.md" ) );
			expect( sammler._getLocalTarget( "./.content/", "dir-1/sub/bar.md", "dir-1" ) ).to.be.equal( path.normalize( "./.content/sub/bar.md" ) );
			expect( sammler._getLocalTarget( "./.content/", "dir-1/sub/baz.md", "" ) ).to.be.equal( path.normalize( "./.content/dir-1/sub/baz.md" ) );

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
			if ( environment === "production" ) {
				del( targetDir ).then( ( paths ) => {
					done();
				} );
			} else {
				done();
			}
		} );

		it( "should be a function", () => {
			expect( sammler._saveContent ).to.be.a( "function" );
		} );

		it( "should save content to disk", ( done ) => {

			var gitHubContent = {
				path: "dir-1/.gitkeep",
				download_url: "https://raw.githubusercontent.com/stefanwalther/sammler-test-repo1/master/dir-1/.gitkeep"
			};

			sammler._saveContent( gitHubContent, "dir-1", targetDir )
				.then( ( data ) => {
					expect( data ).to.exist;
					expect( data ).to.be.a.file;
					expect( data ).to.have.content( "# Just some .gitkeep file" );
					done();
				});
		} );

	} );

} );
