const fs = require("fs");

const Blockchain = require("./src/Blockchain.js");
const Transaction = require("./src/Transaction.js");
const Participants = require("./src/Participants.js");
const ProofOfStake = require("./consensus/proof-of-stake.js");
const ProofOfStakeRandom = require("./consensus/proof-of-stake-random.js");
const ProofOfStakeHybrid = require("./consensus/proof-of-stake-hybrid.js");
const ProofOfStakeAge = require("./consensus/proof-of-stake-age.js");

async function main() {
  const repeat_lines = 50;

  console.log("-".repeat(repeat_lines));
  console.log("New Blockchain started with Proof of Stake");
  console.log("-".repeat(repeat_lines));

  let blockchainPos = new Blockchain("pos-random");
  let blockchainHybrid = new Blockchain("pos-hybrid");
  let blockchainAge = new Blockchain("pos-age");

  console.log("Genesis Block 1 created");
  console.log("-".repeat(repeat_lines));

  console.log("-".repeat(repeat_lines));
  console.log("\nValidators joining the network...");

  let proofofstake = new ProofOfStake();
  let proofofstakeRandom = new ProofOfStakeRandom();
  let proofofstakeHybrid = new ProofOfStakeHybrid();
  let proofofstakeAge = new ProofOfStakeAge();

  let nodes = ProofOfStake.setBalanceForNodes(Participants.nodes());
  nodes[0] = proofofstake.createValidator(nodes[0], 200);
  nodes[1] = proofofstake.createValidator(nodes[1], 100);

  // Run the first algorithm (Proof of Stake Coin Age) and record timers
  const timersRandom = await runAlgorithm(
    "Proof of Stake Coin Age",
    blockchainPos,
    proofofstakeRandom,
    nodes
  );

  // Run the second algorithm (Proof of Stake Hybrid) and record timers
  const timersHybrid = await runAlgorithm(
    "Proof of Stake Hybrid",
    blockchainHybrid,
    proofofstakeHybrid,
    nodes
  );

  // Run the third algorithm (Proof of Stake Age) and record timers
  const timersAge = await runAlgorithm(
    "Proof of Stake Age",
    blockchainAge,
    proofofstakeAge,
    nodes
  );

  // Combine all timers
  const allTimers = [...timersRandom, ...timersHybrid, ...timersAge];

  const csvContent =
    "Algorithm,TimerName,Time(ms)\n" +
    allTimers
      .map((timer, index) => {
        let algorithmName;
        if (index < timersRandom.length) {
          algorithmName = "Random";
        } else if (index < timersRandom.length + timersHybrid.length) {
          algorithmName = "Hybrid";
        } else {
          algorithmName = "Age";
        }
        return `${algorithmName},${timer.name},${timer.time.toFixed(3)}`;
      })
      .join("\n");
  fs.writeFileSync("all_timers.csv", csvContent, "utf-8");

  console.log("\nAll timers written to all_timers.csv");

  // Function to run an algorithm and record timers
  async function runAlgorithm(algorithmName, blockchain, proofofstake, nodes) {
    const timers = [];

    // Measure time for creating transactions
    const startTransactionCreationTime = performance.now();
    blockchain.createTransaction(
      new Transaction(
        Participants.accounts()[0][0],
        Participants.accounts()[1][0],
        100
      )
    );
    blockchain.createTransaction(
      new Transaction(
        Participants.accounts()[1][0],
        Participants.accounts()[0][0],
        50
      )
    );
    const endTransactionCreationTime = performance.now();
    const transactionCreationTime =
      endTransactionCreationTime - startTransactionCreationTime;
    console.log(
      `TransactionCreationTime: ${transactionCreationTime.toFixed(3)}ms`
    );
    timers.push({
      name: "TransactionCreationTime",
      time: transactionCreationTime,
    });

    // Generate 100 blocks
    for (let i = 0; i < 1000; i++) {
      console.log("-".repeat(repeat_lines));
      console.log(`Creating Block ${i + 2} using ${algorithmName}...`);

      // Measure time for generating block
      const startBlockGenerationTime = performance.now();
      console.log("\nChoosing validator...");

      let validatorInfo = proofofstake.getValidatorWithMaxStake();
      if (validatorInfo !== null) {
        let validator = validatorInfo[0];
        console.log(`Validator with the highest stake chosen: ${validator}`);
        blockchain.generateBlock(validator);
      } else {
        console.log("No validator found. Skipping block generation.");
      }

      const endBlockGenerationTime = performance.now();
      const blockGenerationTime =
        endBlockGenerationTime - startBlockGenerationTime;
      console.log(`BlockGenerationTime: ${blockGenerationTime.toFixed(3)}ms`);
      timers.push({
        name: `BlockGenerationTime_Block${i + 2}`,
        time: blockGenerationTime,
      });
    }

    // Validation check
    console.log(
      "\n" + "-".repeat(repeat_lines) + "\n" + "-".repeat(repeat_lines)
    );
    console.log("Validation check...");

    // Measure time for validation check
    const startValidationCheckTime = performance.now();
    blockchain.validationCheck();
    const endValidationCheckTime = performance.now();
    const validationCheckTime =
      endValidationCheckTime - startValidationCheckTime;
    console.log(`ValidationCheckTime: ${validationCheckTime.toFixed(3)}ms`);
    timers.push({ name: "ValidationCheckTime", time: validationCheckTime });

    // Print balances
    console.log("\n" + "-".repeat(repeat_lines));
    Participants.nodes().forEach(function (account) {
      console.log(
        `Balance of ${account[0]}:\t${blockchain.getBalanceOfAddress(
          account[0]
        )}`
      );
    });

    Participants.accounts().forEach(function (account) {
      console.log(
        `Balance of ${account[0]}:\t${blockchain.getBalanceOfAddress(
          account[0]
        )}`
      );
    });

    // Measure time for printing balances
    const startPrintBalancesTime = performance.now();
    console.time("PrintBalancesTime");

    // Print blockchain
    console.log(
      "\n" + "-".repeat(repeat_lines) + "\n" + "-".repeat(repeat_lines)
    );
    console.log("Blockchain");

    // Measure time for printing blockchain
    const startPrintBlockchainTime = performance.now();
    console.time("PrintBlockchainTime");
    console.log(JSON.stringify(blockchain.chain, "", 4));
    console.timeEnd("PrintBlockchainTime");
    timers.push({
      name: "PrintBalancesTime",
      time: performance.now() - startPrintBalancesTime,
    });
    timers.push({
      name: "PrintBlockchainTime",
      time: performance.now() - startPrintBlockchainTime,
    });

    console.log("-".repeat(repeat_lines));
    console.log("Pending transactions");
    console.log(JSON.stringify(blockchain.pendingTransactions, "", 4));
    console.timeEnd("PrintBalancesTime");
    timers.push({
      name: "PendingTransactions",
      time: performance.now() - startPrintBalancesTime,
    });

    return timers;
  }
}
main();
