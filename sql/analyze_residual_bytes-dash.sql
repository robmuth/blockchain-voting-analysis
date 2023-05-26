--DELETE FROM evotinggasanalysis.20201027.gasMeasurements WHERE 1=1;

--- INPUT
DECLARE day DATE DEFAULT "2020-10-30"; -- Start date
DECLARE max DATE DEFAULT "2016-01-21"; -- Genesis
DECLARE needed_weight INT64 DEFAULT 191 * 2000;   -- Free weight needed
DECLARE weight_limit INT64 DEFAULT 2000000;

--- RUN
DECLARE foundBlock INT64 DEFAULT 0;
DECLARE dayTimestamp TIMESTAMP DEFAULT TIMESTAMP(day);
  
CREATE TEMP FUNCTION measureNeededBlocks (needed_weight INT64, weight_limit INT64, startDate DATE)
  RETURNS INT64 AS ( (
    SELECT
      number
    FROM (
      SELECT number, SUM(weight_limit - size) OVER (ORDER BY number DESC) AS weight_free_sum,
      FROM `bigquery-public-data.crypto_dash.blocks`
      WHERE DATE(timestamp) <= startDate
      ORDER BY number DESC )
    WHERE
      weight_free_sum > needed_weight
    LIMIT 1 ));
    
LOOP

  SET dayTimestamp = (SELECT MAX(b.timestamp) FROM `bigquery-public-data`.crypto_dash.blocks b WHERE DATE(b.timestamp) = day );
  
  SET foundBlock = (
    SELECT measureNeededBlocks(needed_weight, weight_limit, day)
  );
  
  INSERT INTO evotinggasanalysis.20201027.gasMeasurements (
    date,
    gas,
    block,
    blocks,
    duration,
    `from_timestamp`,
    `to_timestamp`,
    `from_block`,
    `to_block`)
  VALUES
    (day, needed_weight, foundBlock,
  
    (SELECT MAX(number) FROM `bigquery-public-data`.crypto_dash.blocks b WHERE date(b.timestamp) = day) - foundBlock + 1,
    (SELECT TIMESTAMP_DIFF(dayTimestamp, bb.timestamp, MINUTE) FROM `bigquery-public-data`.crypto_dash.blocks bb WHERE bb.number = foundBlock),
    dayTimestamp,
    (SELECT bb.timestamp FROM `bigquery-public-data`.crypto_dash.blocks bb WHERE bb.number = foundBlock),
    (SELECT MAX(number) FROM `bigquery-public-data`.crypto_dash.blocks b WHERE date(b.timestamp) = day),
    foundBlock
  );
  
SET day = DATE_ADD(day, INTERVAL -1 month);
IF day < max THEN
  LEAVE ;
END IF ;
END LOOP ;
  