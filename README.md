# Blockchain Voting Gas Analysis

In this repository we show how we analyzed the Ethereum Mainnet for e-voting smart contracts.

Required prerequisites:
- [Ethereum ETL](https://github.com/blockchain-etl/ethereum-etl)
- or [Google BigQuery](https://console.cloud.google.com) access
- Voting method signatures from [EIP-1202](http://github.com/ethereum/EIPs/blob/master/EIPS/eip-1202.md) and [4byte.directory](http://4byte.directory)
- Node.js and npm

We generated the following tables for caching results.

> **Important note:** we limit our SQL analysis to 2020-04-21 due to rerepeatability for our paper.

## Method Signatures
Expected voting method signatures and their sources. For the 4byte.directory we searched for the keywords and scrapped them with the API. We then generated SQL inserts for the functionSighashes table (see below).

| File (in ./data/signatures/)                                       | Keyword | Source                                     |
|--------------------------------------------------------------------|---------|--------------------------------------------|
| [erc1202Signatures.json](./data/signatures/erc1202Signatures.json) |         | [EIP-1202](http://github.com/ethereum/EIPs/blob/master/EIPS/eip-1202.md)         |
| [ballotSignatures.json](./data/signatures/ballotSignatures.json)   | ballot  | [4byte.directory](http://4byte.directory)  |
| [voteSignatures.json](./data/signatures/voteSignatures.json)       | vote    | [4byte.directory](http://4byte.directory)  |
| [votingSignatures.json](./data/signatures/votingSignatures.json)   | voting  | [4byte.directory](http://4byte.directory)  |

Our scraper tool [4byte_scraper.js](./script/4byte_scraper.js) is written in Node.JS and needs ```sync-request``` module from npm repo (```npm install sync-request```). Next, our transformer script [insertSignaturesTransform.js](./script/insertSignaturesTransform.js) transform the JSON signatures into SQL inserts [insertSignatures.sql](./data/sql/insertSignatures.sql) (note: maybe the SQL insert is too long and must be split into multiple statements).

## SQL Tables
### functionSighashes
List of expected voting method signature hashes.

| Field      | Type    | Mode     |
|------------|---------|----------|
| hash       | STRING  | REQUIRED |
| signature  | STRING  | NULLABLE |
| is_erc1202 | BOOLEAN | NULLABLE |

Inserts see [functionSighashes.sql](./data/sql/insertSignatures.sql).

### votingContracts
Deployed smart contracts which have expected voting method signatures in their bytecodes.

| Field              | Type      | Mode     |
|--------------------|-----------|----------|
| address            | STRING    | REQUIRED |
| function_sighashes | STRING    | REPEATED |
| is_erc20           | BOOLEAN   | NULLABLE |
| is_erc721          | BOOLEAN   | NULLABLE |
| is_erc1202         | BOOLEAN   | NULLABLE |
| block_timestamp    | TIMESTAMP | NULLABLE |
| block_number       | INTEGER   | NULLABLE |

Table filled with querying the Mainnet dataset by [cacheVotingContracts.sql](./data/sql/cacheVotingContracts.sql).

### votingContractMethods
Cache table which saves how many expected voting method signature hashes are in a deployed smart contract.

| Field          | Type    | Mode     |
|----------------|---------|----------|
| address        | STRING  | REQUIRED |
| voting_methods | INTEGER | NULLABLE |

Table filled with querying the votingContracts table by [cacheVotingMethodsCount.sql](./data/sql/cacheVotingMethodsCount.sql).

## SQL Queries
### Number of voting contracts and sum of their Ether balance
```sql
SELECT
  COUNT(DISTINCT votingContract.address) AS contracts,
  SUM(balances.eth_balance / 1000000000000000000) AS balance_eth,
FROM
  `evotinggasanalysis.20200421.votingContracts` votingContract,
  `evotinggasanalysis.20200421.votingContractMethods` count,
  bigquery-public-data.crypto_ethereum.balances balances
WHERE
  DATE(votingContract.block_timestamp) <= "2020-04-21" AND 
      count.address = votingContract.address
  AND votingContract.address = balances.address
  AND count.voting_methods > 1
```

### Sum of all received Ether to voting contracts
```sql
SELECT
  SUM(transactions.value / 1000000000000000000) AS txs_balance,
FROM
  `evotinggasanalysis.20200421.votingContracts` votingContract,
  `evotinggasanalysis.20200421.votingContractMethods` count,
  bigquery-public-data.crypto_ethereum.transactions transactions
WHERE
DATE(transactions.block_timestamp) <= "2020-04-21" AND
      count.address = votingContract.address
  AND count.voting_methods > 1
  AND transactions.to_address = votingContract.address
```

### Number of unique voting smart contract bytecodes
```sql
SELECT
  COUNT(DISTINCT contracts.bytecode) AS contracts,
FROM
  `evotinggasanalysis.20200421.votingContracts` votingContract,
  `evotinggasanalysis.20200421.votingContractMethods` count,
  `bigquery-public-data.crypto_ethereum.contracts` contracts
WHERE
DATE(votingContract.block_timestamp) <= "2020-04-21" AND
      count.address = votingContract.address
  AND votingContract.address = contracts.address
  AND count.voting_methods > 1
```

### Number of transactions to voting smart contracts
```sql
SELECT 
  COUNT(*) 
FROM 
  evotinggasanalysis.20200421.votingContracts contracts,
  evotinggasanalysis.20200421.votingContractMethods count,
  bigquery-public-data.crypto_ethereum.transactions transactions
WHERE DATE(contracts.block_timestamp) <= "2020-04-21" AND DATE(transactions.block_timestamp) <= "2020-04-21" AND
      count.address = contracts.address
  AND count.voting_methods >  1
  AND contracts.address = transactions.to_address
```