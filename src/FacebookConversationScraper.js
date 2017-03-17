"use strict";

const util = require("util");
const fs = require("fs");
const rp = require("request-promise");

class FacebookConversationScraper {
	// friendId - userId of friend with whom conversation to scrape
	// initialHeaders - dictionary of headers sourced from a browser request
	constructor(url, initialBody, initialHeaders) {
		this.url = url;												// string
		this.bodyTemplate = this.deriveBodyTemplate(initialBody);	// string
		this.initialHeaders = initialHeaders;						// dict
	}

	saveData(path, data, append=true) {
		if (append) {
			fs.appendFile(path, data);
		} else {
			fs.writeFile(path, data);
		}
	}

	deriveBodyTemplate(initialBody) {
		let regex = /\[(offset|timestamp|limit)\]=([^&]*)/g;
		return initialBody.replace(regex, (match) => {
			let equalIndex = match.indexOf("=");
			return match.slice(0, equalIndex + 1) + "%s";
		});
	}

	constructBody(timestamp, limit, offset) {
		return util.format(this.bodyTemplate, offset, timestamp, limit);
	}

	requestMessages(timestamp, limit, offset=0) {
		let headers = Object.assign({}, this.initialHeaders);
		if (headers["Accept-Encoding"]) {
			delete headers["Accept-Encoding"];
		}


		let body = this.constructBody(timestamp, limit, offset);
		let options = {
			url: this.url,
			headers: headers,
			body: body,
			json: true,
			timeout: 5000,
			followRedirect: true
		};

		return rp.post(options, body)
		.then((resp) => {
			let regex = /for \(;;\);/;
			let payload = JSON.parse(resp.replace(regex, "")).payload;
			if (payload.end_of_history) {
				return [];
			} else {
				return payload.actions;
			}
		});
	}

	scrapeUntil(startTimestamp, endTimestamp, interval) {
		let timestamp = startTimestamp;
		let actions = [];

		let scrape = () => {
			return this.requestMessages(timestamp, interval)
			.then((messages) => {
				if (messages.length > 0) {
					console.log(messages.map(v => v.body));
					timestamp = messages[0].timestamp;
					scrape();
				} else {
					// end_of_history reached
				}
			});
		}

		return scrape();
	}

	scrapeToStart(startTimestamp=9999999999, interval=100) {
		return this.scrapeUntil(startTimestamp, 0, interval);
	}
}

module.exports = FacebookConversationScraper;