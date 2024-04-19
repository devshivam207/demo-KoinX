const express = require("express");
const mongoose = require("mongoose");
const { transactionSchema, ethPriceSchema } = require("./schemas");
const { fetchPriceInINR } = require("./utils");
const routes = require("./route");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://shivam24092003:rcSv34QK8II6NJUZ@koinxdemo.az7ztxd.mongodb.net/transaction",
  {}
);

const db = mongoose.connection;

// Wait for MongoDB connection to establish
db.once("open", async () => {
  try {
    console.log("Connected to MongoDB");

    // Define ETHPrice models
    const ETHPrice = mongoose.model("ETHPrice", ethPriceSchema);

    // Function to periodically fetch price and store in MongoDB
    async function fetchAndStoreETHPrice() {
      try {
        const priceInINR = await fetchPriceInINR();
        const ethPriceData = new ETHPrice({ priceInINR });
        await ethPriceData.save();
        console.log("ETH price saved:", priceInINR);
      } catch (error) {
        console.error("Error fetching and storing ETH price:", error);
      }
    }

    // Fetch and store ETH price initially
    fetchAndStoreETHPrice();

    // Fetch and store ETH price every 10 mins
    setInterval(fetchAndStoreETHPrice, 10 * 1000 * 60);

    // Add routes
    app.use("/api", routes);

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
});

// Handle MongoDB connection errors
db.on("error", console.error.bind(console, "MongoDB connection error:"));
