import fs from "fs";

export default class recursiveTest {

	constructor() {

	}

	getPath( basePath, recursive ) {
		return new Promise( (resolved, rejected) => {
			fs.readdir( basePath,  ( err, files ) => {
				if (err) {
					rejected( err );
				} else {
					//if (!recursive) {
					//	return resolved( files );
					//} else {
					//	return resolved( files );
					//}
					resolved( files );
				}
			});
		});
	}

}