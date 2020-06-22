const assert = require("assert");
const events = require("events");

const Verifier = artifacts.require("Verifier");
const MinimalVoting = artifacts.require("MinimalVotingWithZoKrates");

events.EventEmitter.defaultMaxListeners = 15;

let getDeploymentGas = async (instance) => {
	return (await web3.eth.getTransactionReceipt(instance.transactionHash)).gasUsed;
};

// accounts[0] Voting & Verifier owner
// accounts[1] Voter

contract("MinimalVotingWithZoKrates", () => {
	let accounts;

	before(() => {
		return web3.eth.getAccounts()
		.then(getAccounts => accounts = getAccounts)
		.then(() => assert.ok(accounts, "Web3 has no access to accounts (to ganache-cli)"));
	})

	let minimalVoting, verifier, minimalVotingDeploymentGas;

	it("deploys Verifier contract", () => {
		return Verifier.new({from: accounts[0]})
			.then((instance) => {
				verifier = instance;
			})
			.then(() => {
				assert.ok(verifier);
				assert.ok(verifier.address);
			})
			.then(async () => {
				console.log("#06d00 Minimal Voting ZoKrates Verfier (Solidity) Deployment: " + await getDeploymentGas(verifier) + " Gas");
			});
	});

	it("deploys MinimalVotingWithZoKrates contract", async () => {
		return MinimalVoting.new(verifier.address, {from: accounts[0]})
			.then(instance => minimalVoting = instance)
			.then(() => minimalVotingDeploymentGas = getDeploymentGas(minimalVoting))
			.then(() => {
				assert.ok(minimalVoting);
				assert.ok(minimalVoting.address);
			})
			.then(async () => {
				console.log("#06d01 Minimal Voting (Solidity) Deployment: " + await minimalVotingDeploymentGas + " Gas");
			})
	});

	it("sends a voting transaction", async () => {
		const proof_a = ["0x0c906b4f640d01d3b2e67727e62429b93b0f06e664d40c6a05c9200ec3b37ba0","0x115553af19fbec2e486e24396c19550c7cc915be4aec64e0d50bbc9be17d5900"];
		const proof_b  = [["0x238b282250a201bec35b734eb34dd88279e54f779bdf95ed3c9b2088d7a92913","0x02dcaf1716d32e2dad21ad0eb99be99d4171c090794b7b68c01f1465b37e2cf4"],["0x0fec5d8a1aa4a22ce99ae801bb1343277c29d2ed3d8be48e56659d91494ed72b","0x28d0d0315fe6506d29fb3724e7b753611aeff4f6aae5230a5b86db976d06f530"]];
		const proof_c = ["0x0e1650a4b84668c5a1063eee8836e25f269b36e417f5e5c83ff34a678d2752a9","0x0c664c26dfaba98afba15753829357449eb195c39cd49522236c9237a4df3799"];
		const out = ["0x0000000000000000000000000000000000000000000000000000000000000001"];
		
		return minimalVoting.vote(0, proof_a, proof_b, proof_c, out, {from: accounts[1]})
			.then((e) => {
				console.log("#06v01 Minimal Voting (Solidity) Voting Transaction: " + e.receipt.gasUsed + " Gas");
			});
	});

});
