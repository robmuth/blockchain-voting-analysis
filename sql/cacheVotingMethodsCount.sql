DELETE FROM evotinggasanalysis.20200421.votingContractMethods WHERE 1=1;

INSERT INTO evotinggasanalysis.20200421.votingContractMethods
SELECT
  votingContracts.address,
  COUNT(functionSighashes.HASH) AS voting_methods
FROM
  evotinggasanalysis.20200421.functionSighashes,
  evotinggasanalysis.20200421.votingContracts votingContracts
WHERE
  `hash` IN ( (
    SELECT
      hashes
    FROM
      evotinggasanalysis.20200421.votingContracts innerVotingContracts,
      UNNEST(innerVotingContracts.function_sighashes) hashes
    WHERE
      address = votingContracts.address ))
GROUP BY
  votingContracts.address;