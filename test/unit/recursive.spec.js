/*global describe, beforeEach, afterEach, it*/
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiFs from "chai-fs";
import path from "path";
import del from "del";
import recursive from "./recursive";
chai.use( chaiAsPromised );
chai.use( chaiFs );

let expect = chai.expect;

describe.only( "recursive test", () => {
	var rec;
	beforeEach( () => {
		rec = new recursive();
	} );
	it( "should be an object", () => {
		expect( rec.getPath ).to.be.a( "function" );
	} );
	it( "should return something", ( done ) => {
		rec.getPath( path.normalize( "C:\\" ) )
			.then( function ( files ) {
				//console.log('files', files);
				files.forEach( (file) => {
					console.log(file.isDirectory());
				});
				expect( files ).to.exist;
				expect( files ).to.be.an( "array" );
				done();
			} )
	} );
} );
