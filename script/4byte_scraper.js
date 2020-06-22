const request = require("sync-request");
const fs = require("fs");

let parseJson = async (json) => {
	let parsed = JSON.parse(json);

	return {
		next: parsed.next || null,
		signatures: parsed.results ? parsed.results.map((result) => { 
			return { 
				signature: result.text_signature,
				hash: result.hex_signature,
			}
		}) : null
	};
};

let main = async () => {
	let counter = 0; 

	let signatures = [];

	let nextUrl = "https://www.4byte.directory/api/v1/signatures/?format=json&text_signature=voting";

	while(nextUrl) {
		console.log(nextUrl);

		let downloaded = request("GET", nextUrl);
		let parsed = await parseJson(downloaded.getBody());

		nextUrl = parsed.next ? parsed.next : null;

		if(parsed.signatures)
			signatures = [...signatures, ...parsed.signatures];

		await new Promise(resolve => setTimeout(resolve, 1000));

	}

	return signatures;
}

main().then((signatures) => {
	fs.writeFileSync("../data/json/votingSignatures.json", JSON.stringify(signatures));
}).catch(console.err);
