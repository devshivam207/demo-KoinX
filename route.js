const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const { ETHERSCAN_API_KEY } = require("./constants");
const { fetchPriceInINR } = require("./utils");
const { transactionSchema } = require("./schemas");
const { ethers } = require("ethers");

const router = express.Router();

// Add endpoint to fetch the balance of a user's address
router.get("/balance-of-user", async (req, res) => {
  try {
    const address = req.query.address;
    const CustomTransaction = mongoose.model(
      "Transaction",
      transactionSchema,
      address.toLowerCase()
    );
    const transactions = await CustomTransaction.find({
      $or: [{ from: address }, { to: address }],
    });

    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "First Fetch Transaction Details" });
    }

    let balance = ethers.BigNumber.from(0);

    transactions.forEach((tx) => {
      if (tx.from.toLowerCase() === address) {
        balance = balance.sub(ethers.BigNumber.from(tx.value));
        balance = balance.sub(
          ethers.BigNumber.from(tx.gasUsed).mul(
            ethers.BigNumber.from(tx.gasPrice)
          )
        );
      } else {
        balance = balance.add(ethers.BigNumber.from(tx.value));
      }
    });

    const balanceInEther = ethers.utils.formatEther(balance);
    const inrBalance = parseFloat(balanceInEther) * (await fetchPriceInINR());

    res.json({ address, balance: balanceInEther, inrBalance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ error: "Error fetching balance" });
  }
});

// Add endpoint to fetch transactions for a specific address and store them in MongoDB
router.get("/get-transactions", async (req, res) => {
  try {
    const address = req.query.address.toString();
    const response = await axios.get(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );

    const transactions = response.data.result;
    const newTransactions = [];
    const CustomTransaction = mongoose.model(
      "Transaction",
      transactionSchema,
      address.toLowerCase()
    );

    for (const tx of transactions) {
      const existingTransaction = await CustomTransaction.findOne({
        hash: tx.hash,
      });
      if (!existingTransaction) {
        const transaction = new CustomTransaction(tx);
        newTransactions.push(transaction);
      }
    }

    if (newTransactions.length > 0) {
      await CustomTransaction.insertMany(newTransactions);
    }

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching and saving transactions:", error);
    res.status(500).json({ error: "Error fetching and saving transactions" });
  }
});

module.exports = router;
