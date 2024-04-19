const axios = require("axios");
const { COINGECKO_API_URL } = require("./constants");

async function fetchPriceInINR() {
  const response = await axios.get(COINGECKO_API_URL);
  const ethPriceInINR = response.data.ethereum.inr;
  return parseFloat(ethPriceInINR);
}

module.exports = {
  fetchPriceInINR,
};
