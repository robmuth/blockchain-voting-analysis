# Blockchain Voting Gas Analysis

In this repository we show how we analyzed the Ethereum Mainnet for voting smart contracts. All tables with our results can be downloaded from [./results/](./results/) or analyzed again with the following instructions. The Jupyter Notebook with all results for the (LaTeX) paper is available in the repo and [Google Colab](https://colab.research.google.com/drive/1oIxMjJu7LQvSMnXiIgC9S_5CgGA_5d2R).

Required prerequisites:
- [Ethereum ETL](https://github.com/blockchain-etl/ethereum-etl)
- or [Google BigQuery](https://console.cloud.google.com) access
- Voting method signatures from [EIP-1202](http://github.com/ethereum/EIPs/blob/master/EIPS/eip-1202.md) and [4byte.directory](http://4byte.directory)
- Node.js and npm

We generated the following tables for caching/saving results.

> **Important note:** we limit our SQL analysis to 2020-10-27 due to repeatability for our paper.

## Method Signatures
Expected voting method signatures and their sources. For the 4byte.directory we searched for the keywords and scrapped them with the API. We then generated SQL inserts for the functionSighashes table (see below).

| File (in ./contract-signatures/)                                       | Keyword | Source                                     |
|--------------------------------------------------------------------|---------|--------------------------------------------|
| [erc1202Signatures.json](./contract-signatures/erc1202Signatures.json) |         | [EIP-1202](http://github.com/ethereum/EIPs/blob/master/EIPS/eip-1202.md)         |
| [ballotSignatures.json](./contract-signatures/ballotSignatures.json)   | ballot  | [4byte.directory](http://4byte.directory)  |
| [voteSignatures.json](./contract-signatures/voteSignatures.json)       | vote    | [4byte.directory](http://4byte.directory)  |
| [votingSignatures.json](./contract-signatures/votingSignatures.json)   | voting  | [4byte.directory](http://4byte.directory)  |
| [daoSignatures.json](./contract-signatures/daoSignatures.json)         |         | [Github](https://github.com/TheDAO/DAO-1.0/blob/master/DAO.sol)  |

Our Jupyiter Notebook collects signatures on its own. For Ethereum ETL we use scrapper tools. Our scraper tool [4byte_scraper.js](./script/4byte_scraper.js) is written in Node.JS and needs ```sync-request``` module from npm repo (```npm install sync-request```). Next, our transformer script [insertSignaturesTransform.js](./script/insertSignaturesTransform.js) transform the JSON signatures into SQL inserts [insertSignatures.sql](./sql/insertSignatures.sql) (note: maybe the SQL insert is too long and must be split into multiple statements).

## SQL Tables
### functionSighashes
List of expected voting method signature hashes.

| Field      | Type    | Mode     |
|------------|---------|----------|
| hash       | STRING  | REQUIRED |
| signature  | STRING  | NULLABLE |
| is_erc1202 | BOOLEAN | NULLABLE |

Inserts see [functionSighashes.sql](./sql/insertSignatures.sql).

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

Table filled with querying the Mainnet dataset by [cacheVotingContracts.sql](./sql/cacheVotingContracts.sql).

### votingContractMethods
Cache table which saves how many expected voting method signature hashes are in a deployed smart contract.

| Field          | Type    | Mode     |
|----------------|---------|----------|
| address        | STRING  | REQUIRED |
| voting_methods | INTEGER | NULLABLE |

Table filled with querying the votingContracts table by [cacheVotingMethodsCount.sql](./sql/cacheVotingMethodsCount.sql).

### votingTransactions
Cache table for all transactions which call a voting method.

| Field              | Type      | Mode     |
|--------------------|-----------|----------|
| hash               | STRING    |          |
| from_address       | STRING    |          |
| to_address         | STRING    |          |
| gas                | INTEGER   |          |
| gas_price          | INTEGER   |          |
| value              | NUMERIC   |          |
| receipt_gas_used   | INTEGER   |          |
| block_number       | INTEGER   |          |
| block_timestamp    | TIMESTAMP |          |
| function_sighash   | STRING    |          |

Inserts see [insertVotingTransactions.sql](./sql/insertVotingTransactions.sql).

## SQL Queries
### Number of voting contracts and sum of their Ether balance
```sql
SELECT
  COUNT(DISTINCT votingContract.address) AS contracts,
  SUM(balances.eth_balance / 1000000000000000000) AS balance_eth,
FROM
  `evotinggasanalysis.20201027.votingContracts` votingContract,
  `evotinggasanalysis.20201027.votingContractMethods` count,
  bigquery-public-data.crypto_ethereum.balances balances
WHERE
  DATE(votingContract.block_timestamp) <= "2020-10-27" AND 
      count.address = votingContract.address
  AND votingContract.address = balances.address
  AND count.voting_methods > 1
```

### Sum of all received Ether to voting contracts
```sql
SELECT
  SUM(transactions.value / 1000000000000000000) AS txs_balance,
FROM
  `evotinggasanalysis.20201027.votingContracts` votingContract,
  `evotinggasanalysis.20201027.votingContractMethods` count,
  bigquery-public-data.crypto_ethereum.transactions transactions
WHERE
DATE(transactions.block_timestamp) <= "2020-10-27" AND
      count.address = votingContract.address
  AND count.voting_methods > 1
  AND transactions.to_address = votingContract.address
```

### Number of unique voting smart contract bytecodes
```sql
SELECT
  COUNT(DISTINCT contracts.bytecode) AS contracts,
FROM
  `evotinggasanalysis.20201027.votingContracts` votingContract,
  `evotinggasanalysis.20201027.votingContractMethods` count,
  `bigquery-public-data.crypto_ethereum.contracts` contracts
WHERE
DATE(votingContract.block_timestamp) <= "2020-10-27" AND
      count.address = votingContract.address
  AND votingContract.address = contracts.address
  AND count.voting_methods > 1
```

### Number of transactions to voting smart contracts
```sql
SELECT 
  COUNT(*) 
FROM 
  evotinggasanalysis.20201027.votingContracts contracts,
  evotinggasanalysis.20201027.votingContractMethods count,
  bigquery-public-data.crypto_ethereum.transactions transactions
WHERE DATE(contracts.block_timestamp) <= "2020-10-27" AND DATE(transactions.block_timestamp) <= "2020-10-27" AND
      count.address = contracts.address
  AND count.voting_methods >  1
  AND contracts.address = transactions.to_address
```

## Free Gas Measurements

### Measurements results table

Table **gasMeasurements** for saving the measurement results.

| Field             | Type      | Mode     |
|-------------------|-----------|----------|
| date              | DATE      | NULLABLE |
| gas               | INTEGER   | NULLABLE |
| block             | INTEGER   | NULLABLE |
| blocks            | INTEGER   | NULLABLE |
| duration          | INTEGER   | NULLABLE |
| from_timestamp    | TIMESTAMP | NULLABLE |
| to_timestamp      | TIMESTAMP | NULLABLE |
| from_block        | INTEGER   | NULLABLE |
| to_block          | INTEGER   | NULLABLE |
| blockgaslimit_avg | INTEGER   | NULLABLE |


### Measuring needed blocks for given amount of gas in a given time perdiod with monthly interval

> **Caution:** Runs potentially long and may cost some real $$$ ;-)

```sql
--- INPUT
DECLARE day DATE DEFAULT "2020-10-27"; -- Start date
DECLARE max DATE DEFAULT "2015-07-30"; -- Genesis
DECLARE gas INT64 DEFAULT 791970000;   -- Free gas needed

--- RUN
DECLARE foundBlock INT64 DEFAULT 0;
DECLARE dayTimestamp TIMESTAMP DEFAULT TIMESTAMP(day);
  
CREATE TEMP FUNCTION measureNeededBlocks (gas INT64, startDate DATE)
  RETURNS INT64 AS ( (
    SELECT
      number
    FROM (
      SELECT number, SUM(gas_limit - gas_used) OVER (ORDER BY number DESC) AS gas_free_sum,
      FROM `bigquery-public-data.crypto_ethereum.blocks`
      WHERE DATE(timestamp) <= startDate
      ORDER BY number DESC )
    WHERE
      gas_free_sum > gas
    LIMIT 1 ));
    
LOOP
  SET dayTimestamp = (SELECT MAX(b.timestamp) FROM `bigquery-public-data`.crypto_ethereum.blocks b WHERE DATE(b.timestamp) = day );
  
  SET foundBlock = (SELECT measureNeededBlocks(gas, day));
  
  INSERT INTO evotinggasanalysis.20201027.gasMeasurements (
    date,
    gas,
    block,
    blocks,
    duration,
    `from_timestamp`,
    `to_timestamp`,
    `from_block`,
    `to_block`,
    `blockgaslimit_avg`)
  VALUES
    (day, gas, foundBlock,
  
    (SELECT MAX(number) FROM `bigquery-public-data`.crypto_ethereum.blocks b WHERE date(b.timestamp) = day) - foundBlock,
    (SELECT TIMESTAMP_DIFF(dayTimestamp, bb.timestamp, MINUTE) FROM `bigquery-public-data`.crypto_ethereum.blocks bb WHERE bb.number = foundBlock),
    dayTimestamp,
    (SELECT bb.timestamp FROM `bigquery-public-data`.crypto_ethereum.blocks bb WHERE bb.number = foundBlock),
    (SELECT MAX(number) FROM `bigquery-public-data`.crypto_ethereum.blocks b WHERE date(b.timestamp) = day),
    foundBlock,
    (SELECT CAST(AVG(gas_limit) AS INT64) FROM `bigquery-public-data`.crypto_ethereum.blocks b WHERE b.number >= foundBlock AND b.number <= (SELECT MAX(bc.number) FROM `bigquery-public-data`.crypto_ethereum.blocks bc WHERE date(bc.timestamp) = day))
  );
SET day = DATE_ADD(day, INTERVAL -1 month);
IF day < max THEN
  LEAVE ;
END IF ;
END LOOP ;
```

### Get median of gas measurement results
Get the median of all gas measurement results (grouped by initial gas input).

```sql
CREATE TEMP FUNCTION MEDIAN(arr ANY TYPE) AS ((
  SELECT IF(
      MOD(ARRAY_LENGTH(arr), 2) = 0,
      (arr[OFFSET(DIV(ARRAY_LENGTH(arr), 2) - 1)] + arr[OFFSET(DIV(ARRAY_LENGTH(arr), 2))]) / 2,
      arr[OFFSET(DIV(ARRAY_LENGTH(arr), 2))] )
  FROM (SELECT ARRAY_AGG(x ORDER BY x) AS arr FROM UNNEST(arr) AS x)
)); -- Source: https://stackoverflow.com/a/55529409

SELECT
  gas,
  CAST(CEIL(MEDIAN(ARRAY_AGG(blocks))) AS INT64) blocks_median,
  CAST(CEIL(AVG(blocks)) AS INT64) blocks_avg,
  CAST(STDDEV(blocks) AS INT64) blocks_std,
  CAST(CEIL(MEDIAN(ARRAY_AGG(duration))) AS INT64) duration_median,
  CAST(STDDEV(duration) AS INT64) duration_std,
  CAST(CEIL(MEDIAN(ARRAY_AGG(blockgaslimit_avg))) AS INT64) blockgaslimit_median,
  CAST(STDDEV(blockgaslimit_avg) AS INT64) blockgaslimit_std,
  COUNT(*) as datapoints
FROM (SELECT DISTINCT * FROM `evotinggasanalysis.20201027.gasMeasurements` WHERE blocks IS NOT NULL)
GROUP BY gas
```

## Minimal Implementations
The minimal voting implementations are implemented within the [Truffle Framework](https://www.trufflesuite.com). Our measurements can be reproduced with the test cases (run ```truffle test```). The test cases require an npm/Node.JS environment and ganache-cli.

- Truffle project: [./solidity-minimalImplementations/](./solidity-minimalImplementations/)
- Smart contracts: [./solidity-minimalImplementations/contracts/](./solidity-minimalImplementations/contracts/)
- ZoKrates zero-knowledge-proof the hash/proof files can be found in [./solidity-minimalImplementations/zokrates/](./solidity-minimalImplementations/zokrates/) and require a ZoKrates environment or the corresponding [Remix](http://remix.ethereum.org/) Plugin.
