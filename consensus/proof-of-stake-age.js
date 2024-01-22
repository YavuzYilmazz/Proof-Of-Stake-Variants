const SHA256 = require("crypto-js/sha256");

class ProofOfStakeCoinAge {
  constructor(block) {
    this.block = block;
    this.validators = [];
  }

  /**
   * Only for demonstration purposes.
   * Usually a node has no balance in the beginning.
   */
  static setBalanceForNodes(nodes) {
    nodes.forEach(function (node) {
      node[1] = 1000;
      node[2] = 0; // Set initial coin age to 0
    });
    return nodes;
  }

  /**
   * In PoS, anybody can become a validator by paying a fee
   *
   * @returns {Array} node with reduced balance
   */
  createValidator(node, stake) {
    this.validators.push([node[0], stake, 0]); // Coin age starts at 0
    return [node[0], node[1] - stake, node[2]];
  }

  calculateHash() {
    return SHA256(
      this.block.previousHash +
        this.block.timestamp +
        JSON.stringify(this.block.transactions) +
        this.block.validator
    ).toString();
  }

  getValidatorWithMaxStake() {
    // Select the validator with the maximum coin age
    let maxCoinAge = -1;
    let selectedValidator = null;

    for (const [validator, stake, coinAge] of this.validators) {
      if (coinAge > maxCoinAge) {
        maxCoinAge = coinAge;
        selectedValidator = validator;
      }
    }

    return selectedValidator;
  }

  generateBlock() {
    this.block.hash = this.calculateHash();
    const selectedValidator = this.getValidatorWithMaxStake();
    console.log("Block created by: " + selectedValidator);

    // Update coin age for all validators
    this.validators.forEach(([validator, stake, coinAge], index) => {
      this.validators[index][2] = coinAge + 1;
    });

    return this.block;
  }
}

module.exports = ProofOfStakeCoinAge;
