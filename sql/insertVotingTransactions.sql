INSERT INTO `evotinggasanalysis.20200421.votingTransactions`
SELECT
  `hash`,
  from_address,
  to_address,
  gas,
  gas_price,
  value,
  receipt_gas_used,
  block_number,
  block_timestamp,
  substr(input, 0, 10) as function_sighash,
FROM
  `bigquery-public-data.crypto_ethereum.transactions`
WHERE 1=1
  AND receipt_contract_address IS NULL
  AND receipt_status = 1
  AND to_address in (SELECT address FROM `evotinggasanalysis.20200421.votingContracts`)
  AND substr(input, 0, 10) IN (SELECT `hash` FROM `evotinggasanalysis.20200421.functionSighashes`)


