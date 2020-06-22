DELETE FROM `evotinggasanalysis.20200421.votingContracts` WHERE 1=1;

INSERT INTO `evotinggasanalysis.20200421.votingContracts`
SELECT
  address,
  function_sighashes,
  is_erc20,
  is_erc721,
  FALSE, --is_erc1202,
  block_timestamp,
  block_number
FROM `bigquery-public-data.crypto_ethereum.contracts`
WHERE 1=1
  AND DATE(block_timestamp) <= '2020-04-21'
  AND EXISTS(SELECT 1 FROM UNNEST(function_sighashes) intersec WHERE intersec IN UNNEST((
    SELECT ARRAY_AGG(`hash`) FROM evotinggasanalysis.20200421.functionSighashes WHERE is_erc1202 = FALSE
  ))
);

INSERT INTO `evotinggasanalysis.20200421.votingContracts`
SELECT
  address,
  function_sighashes,
  is_erc20,
  is_erc721,
  TRUE, --is_erc1202,
  block_timestamp,
  block_number
FROM `bigquery-public-data.crypto_ethereum.contracts`
WHERE 1=1
  AND DATE(block_timestamp) <= '2020-04-21'
  AND EXISTS(SELECT 1 FROM UNNEST(function_sighashes) intersec WHERE intersec IN UNNEST((
    SELECT ARRAY_AGG(`hash`) FROM evotinggasanalysis.20200421.functionSighashes WHERE is_erc1202 = TRUE
  ))
);