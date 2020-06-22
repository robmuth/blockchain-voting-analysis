const assert = require("assert");
const events = require("events");

const MinimalVoting = artifacts.require("MinimalVotingWithHashTokenCheck");

events.EventEmitter.defaultMaxListeners = 15;

let getDeploymentGas = async (instance) => {
	return (await web3.eth.getTransactionReceipt(instance.transactionHash)).gasUsed;
};

const KECCAK256_OF_EMPTY_STRING = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"; // keccak256(abi.encodePacked(""))
const KECCAK256_OF_KECCAK256_OF_EMPTY_STRING = "0x10ca3eff73ebec87d2394fc58560afeab86dac7a21f5e402ea0a55e5c8a6758f"; // keccak256(abi.encodePacked(keccak256(abi.encodePacked(""))

contract("MinimalVotingWithHashTokenCheck", () => {
	let accounts;

	before(() => {
		return web3.eth.getAccounts()
		.then(getAccounts => accounts = getAccounts)
		.then(() => assert.ok(accounts, "Web3 has no access to accounts (to ganache-cli)"));
	})

	let minimalVoting, minimalVotingDeploymentGas;
	it("deploys MinimalVotingWithHashTokenCheck contract", async () => {
		return MinimalVoting.new()
			.then(instance => minimalVoting = instance)
			.then(() => minimalVotingDeploymentGas = getDeploymentGas(minimalVoting))
			.then(() => {
				assert.ok(minimalVoting);
				assert.ok(minimalVoting.address);
			})
			.then(async () => {
				console.log("#03d00 Minimal Voting (Solidity Deployment: " + await minimalVotingDeploymentGas + " Gas");
			})
	});

	it("saves right to vote", async () => {
		return minimalVoting.authorize(KECCAK256_OF_KECCAK256_OF_EMPTY_STRING)
			.then((e) => {
				console.log("#03v00 Minimal Voting (Solidity) Authorize Transaction: " + e.receipt.gasUsed + " Gas");
			});
	});

	it("sends a voting transaction", async () => {
		return minimalVoting.vote(0, KECCAK256_OF_EMPTY_STRING,{from: accounts[1]})
			.then((e) => {
				console.log("#03v01 Minimal Voting (Solidity) Voting Transaction: " + e.receipt.gasUsed + " Gas");
			});
	});

});
