--- INPUT
DECLARE day DATE DEFAULT "2022-12-30"; -- Start date
DECLARE max DATE DEFAULT "2015-07-30"; -- Genesis
--DECLARE gas INT64 DEFAULT 791970000;   -- Free gas needed

--DECLARE gas INT64 DEFAULT 21000 * 2000;   -- Naive voting * 2000
--DECLARE gas INT64 DEFAULT 21000 * 100000;   -- Naive voting * 100000

DECLARE gas INT64 DEFAULT 41897 * 2000;     -- Minimal voting * 2000
--DECLARE gas INT64 DEFAULT 41897 * 100000;   -- Minimal voting * 100000

--DECLARE gas INT64 DEFAULT 150000 * 2000;     -- The DAO voting * 2000
--DECLARE gas INT64 DEFAULT 150000 * 100000;   -- The DAO voting * 100000

--- RUN
DECLARE foundBlock INT64 DEFAULT 0;
DECLARE dayTimestamp TIMESTAMP DEFAULT TIMESTAMP(day);
  
CREATE TEMP FUNCTION measureNeededBlocks (gas INT64, startDate DATE)
  RETURNS INT64 AS ( (
    SELECT
      number
    FROM (
      SELECT number, SUM(GREATEST(gas_limit, 30 * POW(10, 6)) - gas_used) OVER (ORDER BY number DESC) AS gas_free_sum,
      FROM `bigquery-public-data.crypto_ethereum.blocks`
      WHERE DATE(timestamp) <= startDate
      ORDER BY number DESC )
    WHERE
      gas_free_sum > gas
    LIMIT 1 ));
    
LOOP
  SET dayTimestamp = (SELECT MAX(b.timestamp) FROM `bigquery-public-data`.crypto_ethereum.blocks b WHERE DATE(b.timestamp) = day );
  
  SET foundBlock = (SELECT measureNeededBlocks(gas, day));
  
  INSERT INTO diss-377408.diss.gasMeasurements (
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
    (SELECT CAST(AVG(GREATEST(gas_limit, 30 * POW(10, 6))) AS INT64) FROM `bigquery-public-data`.crypto_ethereum.blocks b WHERE b.number >= foundBlock AND b.number <= (SELECT MAX(bc.number) FROM `bigquery-public-data`.crypto_ethereum.blocks bc WHERE date(bc.timestamp) = day))
  );
SET day = DATE_ADD(day, INTERVAL -1 month);
IF day < max THEN
  LEAVE ;
END IF ;
END LOOP ;