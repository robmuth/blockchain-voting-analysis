const assert = require("assert");
const events = require("events");

const MinimalVoting = artifacts.require("MinimalVotingWithEtherTransfer");

events.EventEmitter.defaultMaxListeners = 15;

let getDeploymentGas = async (instance) => {
	return (await web3.eth.getTransactionReceipt(instance.transactionHash)).gasUsed;
};

contract("MinimalVotingWithEtherTransfer", () => {
	let accounts;

	before(() => {
		return web3.eth.getAccounts()
		.then(getAccounts => accounts = getAccounts)
		.then(() => assert.ok(accounts, "Web3 has no access to accounts (to ganache-cli)"));
	})

	let minimalVoting, minimalVotingDeploymentGas;
	it("deploys MinimalVotingWithEtherTransfer contract", async () => {
		return MinimalVoting.new()
			.then(instance => minimalVoting = instance)
			.then(() => minimalVotingDeploymentGas = getDeploymentGas(minimalVoting))
			.then(() => {
				assert.ok(minimalVoting);
				assert.ok(minimalVoting.address);
			})
			.then(async () => {
				console.log("#04d00 Minimal Voting (Solidity Deployment: " + await minimalVotingDeploymentGas + " Gas");
			})
	});

	it("sends a voting transaction", async () => {
		return minimalVoting.vote(0, {from: accounts[1], value: 1})
			.then((e) => {
				console.log("#04v01 Minimal Voting (Solidity) Voting Transaction: " + e.receipt.gasUsed + " Gas");
			});
	});

});
