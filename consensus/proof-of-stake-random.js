const SHA256 = require("crypto-js/sha256");

class ProofOfStakeRandom {
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
    });
    return nodes;
  }

  /**
   * In PoS, anybody can become a validator by paying a fee
   *
   * @returns {Array} node with reduced balance
   */
  createValidator(node, stake) {
    this.validators.push([node[0], stake]);
    return [node[0], node[1] - stake];
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
    // Randomize the selection based on stake
    const totalStake = this.validators.reduce(
      (total, [, stake]) => total + stake,
      0
    );
    let randomNumber = Math.random() * totalStake;

    let selectedValidator = null;
    for (const [validator, stake] of this.validators) {
      if (randomNumber < stake) {
        selectedValidator = validator;
        break;
      }
      randomNumber -= stake;
    }

    return selectedValidator;
  }

  generateBlock() {
    this.block.hash = this.calculateHash();
    const selectedValidator = this.getValidatorWithMaxStake();
    console.log("Block created by: " + selectedValidator);
    return this.block;
  }
}

module.exports = ProofOfStakeRandom;
