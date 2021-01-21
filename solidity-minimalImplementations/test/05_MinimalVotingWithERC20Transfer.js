const assert = require("assert");
const events = require("events");

const MinimalToken = artifacts.require("MinimalToken");
const MinimalVoting = artifacts.require("MinimalVotingWithERC20Transfer");

events.EventEmitter.defaultMaxListeners = 15;

let getDeploymentGas = async (instance) => {
	return (await web3.eth.getTransactionReceipt(instance.transactionHash)).gasUsed;
};

// accounts[0] Voting owner
// accounts[1] Voter
// accounts[2] Token owner

contract("MinimalVotingWithERC20Transfer", () => {
	let accounts;

	before(() => {
		return web3.eth.getAccounts()
		.then(getAccounts => accounts = getAccounts)
		.then(() => assert.ok(accounts, "Web3 has no access to accounts (to ganache-cli)"));
	})

	let minimalVoting, minimalToken, minimalVotingDeploymentGas;

	it("deploys MinimalToken contract", () => {
		return MinimalToken.new({from: accounts[2]})
			.then((instance) => {
				minimalToken = instance;
			})
			.then(() => {
				assert.ok(minimalToken);
				assert.ok(minimalToken.address);
			})
			.then(async () => {
				console.log("#05d00 Minimal Voting (Solidity) Deployment: " + await getDeploymentGas(minimalToken) + " Gas");
			})
	});

	it("deploys MinimalVotingWithERC20Transfer contract", async () => {
		return MinimalVoting.new(minimalToken.address, {from: accounts[0]})
			.then(instance => minimalVoting = instance)
			.then(() => minimalVotingDeploymentGas = getDeploymentGas(minimalVoting))
			.then(() => {
				assert.ok(minimalVoting);
				assert.ok(minimalVoting.address);
			})
			.then(async () => {
				console.log("#05d01 Minimal Voting (Solidity) Deployment: " + await minimalVotingDeploymentGas + " Gas");
			})
	});

	it("transfers minmal token", () => {
		return minimalToken.approve(accounts[1], 1, {from: accounts[2]})
			.then(() => minimalToken.allowance(accounts[2], accounts[1]))
			.then(allowance => assert.equal(1, allowance))
			.then(() => minimalToken.transfer(accounts[1], 1, {from: accounts[1]}))
			.then(() => minimalToken.balanceOf(accounts[1]))
			.then(balance => assert.equal(1, balance));
	});

	it("sends a voting transaction", async () => {
		return minimalToken.approve(minimalVoting.address, 1, {from: accounts[1]})
			.then((e) => {
				console.log("#05v00 Minimal Voting (Solidity) Token Transfer Transaction: " + e.receipt.gasUsed + " Gas");
			})
			.then(() => minimalToken.balanceOf(accounts[0]))
			.then(balance => assert.equal(0, balance))
			.then(() => minimalToken.allowance(accounts[1], minimalVoting.address))
			.then(allowance => assert.equal(1, allowance))
			.then(() => minimalToken.balanceOf(accounts[0]))
			.then(balance => assert.equal(0, balance))
			.then(() => minimalVoting.vote(0, 1, {from: accounts[1]}))
			.then((e) => {
				console.log("#05v01 Minimal Voting (Solidity) Voting Transaction: " + e.receipt.gasUsed + " Gas");
			})
			.then(() => minimalToken.balanceOf(accounts[0]))
			.then(balance => assert.equal(1, balance))
			.then(() => minimalToken.balanceOf(accounts[1]))
			.then(balance => assert.equal(0, balance))
			.then(() => minimalToken.balanceOf(accounts[2]))
			.then(balance => assert.equal(0, balance));
	});

});
