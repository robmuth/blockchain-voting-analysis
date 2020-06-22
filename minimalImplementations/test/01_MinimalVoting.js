const assert = require("assert");
const events = require("events");

const MinimalVoting = artifacts.require("MinimalVoting");

events.EventEmitter.defaultMaxListeners = 15;

let getDeploymentGas = async (instance) => {
	return (await web3.eth.getTransactionReceipt(instance.transactionHash)).gasUsed;
};

contract("MinimalVoting", () => {
	let accounts;

	before(() => {
		return web3.eth.getAccounts()
		.then(getAccounts => accounts = getAccounts)
		.then(() => assert.ok(accounts, "Web3 has no access to accounts (to ganache-cli)"));
	})

	let minimalVoting, minimalVotingDeploymentGas;
	it("deploys MinimalVoting contract", async () => {
		return MinimalVoting.new()
			.then(instance => minimalVoting = instance)
			.then(() => minimalVotingDeploymentGas = getDeploymentGas(minimalVoting))
			.then(() => {
				assert.ok(minimalVoting);
				assert.ok(minimalVoting.address);
			})
			.then(async () => {
				console.log("#01d00 Minimal Voting (Solidity) Deployment: " + await minimalVotingDeploymentGas + " Gas");
			})
	});

	it("sends a voting transaction", async () => {
		return minimalVoting.vote(0)
			.then((e) => {
				console.log("#01v00 Minimal Voting (Solidity) Voting Transaction: " + e.receipt.gasUsed + " Gas");
			});
	})

});