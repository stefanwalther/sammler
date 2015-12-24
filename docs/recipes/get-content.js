"use strict";
var Sammler = require( "./../../dist/" ).Sammler;

var sammler = new Sammler();

var sourceDef = {
	user: "stefanwalther",
	repo: "sammler-test-repo1",
	path: "dir-1",
	ref: "master",
	recursive: true
};

sammler.getContent( sourceDef )
	.then( function ( data ) {
		data.forEach( function ( item ) {
			console.log( "\t" + item.path );
		});
	});

// Results:
// 	dir-1/.gitkeep
// 	dir-1/a.md
// 	dir-1/b.md
// 	dir-1/images/a.png
// 	dir-1/images/b.png
// 	dir-1/images/sub-single/single.md
// 	dir-1/images/sub/x.md
// 	dir-1/images/sub/y.png
// 	dir-1/images/sub/z.png

