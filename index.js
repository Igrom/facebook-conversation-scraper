"use strict";

const util = require("util");
const FacebookConversationScraper = require("./src/FacebookConversationScraper");

const config = {
	url: "https://www.facebook.com/ajax/mercury/thread_info.php?dpr=1",
	rawRequest: "./rawRequest"
};

let parseInitialHeaders = () => {
	return new Promise((resolve, reject) => {
		fs.readFile(config.rawRequest, {encoding: "utf8"}, (err, data) => {
			if (err) {
				reject(err);
			} else {
				let initialHeaders = {};
				data.split("\r\n").map((line) => {
					let semicolonIndex = line.indexOf(":");
					let split = [
						line.slice(0, semicolonIndex),
						line.slice(semicolonIndex + 1).trim()
					];

					// sanity check - there should have been one and only one semicolon
					if (split.length !== 2) {
						reject(new Error("Something's wrong with the raw header..."));
					}
					initialHeaders[split[0]] = split[1];
				});
				resolve(initialHeaders);
			}
		})
	});


};

parseInitialHeaders()
.then((initialHeaders) => {
	let initialBody = "<insert body here>";
	let fcs = new FacebookConversationScraper(config.url, initialBody, initialHeaders);
	fcs.scrapeToStart(1489662117509, 1);
})
.catch((err) => {
	console.log(err);
	throw err;
});