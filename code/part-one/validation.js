'use strict';

const { createHash } = require('crypto');
const signing = require('./signing');
const { Transaction } = require('./blockchain');

/**
 * A simple validation function for transactions. Accepts a transaction
 * and returns true or false. It should reject transactions that:
 *   - have negative amounts
 *   - were improperly signed
 *   - have been modified since signing
 */
const isValidTransaction = transaction => {
  const positive = transaction.amount > 0;

  // signature is made by source (sender)
  const properSig = signing.verify(transaction.source, transaction.message, transaction.signature);
  return positive && properSig;
};

/**
 * Validation function for blocks. Accepts a block and returns true or false.
 * It should reject blocks if:
 *   - their hash or any other properties were altered
 *   - they contain any invalid transactions
 */
const isValidBlock = block => {
  const currentHash = block.hash;
  const validHash = block.calculateHash(block.nonce);
  block.hash = currentHash; // do not want to mutate the BAD BLOCKS !
  if (currentHash !== validHash) {
    return false;
  }

  for (let i = 0; i < block.transactions.length; i++) {
    if (!isValidTransaction(block.transactions[i])) {
      return false;
    }
  }

  return true;
};

/**
 * One more validation function. Accepts a blockchain, and returns true
 * or false. It should reject any blockchain that:
 *   - is a missing genesis block
 *   - has any block besides genesis with a null hash
 *   - has any block besides genesis with a previousHash that does not match
 *     the previous hash
 *   - contains any invalid blocks
 *   - contains any invalid transactions
 */
const isValidChain = blockchain => {

  const hasGenesis = blockchain.getGenesisBlock().previousHash === null;
  if (!hasGenesis) return false;

  for (let b = 0, block = null, prevBlock = null; b < blockchain.blocks.length; b++) {
    block = blockchain.blocks[b];

    // check non-genesis blocks
    if (b > 0) {
      prevBlock = blockchain.blocks[b - 1];

      // check any block has null previousHash
      if (block.previousHash === null) return false;

      // check any block has a previousHash !== prev block's hash?
      if (block.previousHash !== prevBlock.hash) return false;
    }

    if (!isValidBlock(block)) return false;
  }
  return true;
};

/**
 * This last one is just for fun. Become a hacker and tamper with the passed in
 * blockchain, mutating it for your own nefarious purposes. This should
 * (in theory) make the blockchain fail later validation checks;
 */
const breakChain = blockchain => {
  const trans = new Transaction(signing.createPrivateKey(), 'yogi', -100);
  blockchain.addBlock([trans]);
};

module.exports = {
  isValidTransaction,
  isValidBlock,
  isValidChain,
  breakChain
};
