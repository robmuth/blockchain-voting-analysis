const fs = require("fs");

const files = ["erc1202Signatures.json", "votingSignatures.json", "voteSignatures.json", "ballotSignatures.json"];

const signaturesFiles = files.map(fileName => fs.readFileSync("../data/signatures/" + fileName)).map(fileContent => JSON.parse(fileContent));

let signatures = [];

for(let i = 0; i < signaturesFiles.length; i++) {
	const signaturesFile = signaturesFiles[i];

	for(let j = 0; j < signaturesFile.length; j++) {
		const signature = signaturesFile[j];

		if(!signatures.find(s => s.signature == signature.signature))
			signatures = [...signatures, {
				...signature,
				is_erc1202: signature.is_erc1202 || false,
			}];
	}
}

fs.writeFileSync("../data/sql/insertFunctionSighashes.sql", "DELETE FROM `evotinggasanalysis.20200421.functionSighashes` WHERE 1=1; INSERT INTO `evotinggasanalysis.20200421.functionSighashes` (`hash`, `signature`, `is_erc1202`) VALUES " + signatures.map(row => "('" + row.hash + "', '" + row.signature + "', " + (row.is_erc1202 ? "true" : false) + ")").join(",") + ";");
