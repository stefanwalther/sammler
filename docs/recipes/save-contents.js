"use strict";
var Sammler = require( "./../../dist/" ).Sammler;
var path = require( "path" );
var del = require( "del" );

var sammler = new Sammler();

var sourceDef = {
	user: "stefanwalther",
	repo: "sammler-test-repo1",
	path: "dir-1",
	ref: "master",
	recursive: true
};

var targetDir = path.join( __dirname, "./.content/" );

del( targetDir ).then( function () { // Clean the targetDir ...
	sammler.getContent( sourceDef )
		.then( function ( data ) {
			sammler.saveContents( sourceDef, data, targetDir )
				.then( function ( results ) {
					console.log("Saved all");
					results.forEach( function ( item ) {
						console.log( "Item saved: " + item );
					} )
				} )
		} );
} );
