// load environment variables from the .env file
require('dotenv').config();

// import required libraries
const { ethers } = require('ethers');
const cron = require('node-cron');

// define ABI
// can replace this with a full ABI JSON if needed
const contractABI = [
  // this is the function we want to call periodically
  "function checkAndChargeSubscriptions() public"
];

// set up the blockchain provider using the RPC URL from .env
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// create a wallet instance from the private key, connected to the provider
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// create a contract instance using its address, ABI, and the connected wallet
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet
);

// schedule the task to run every 1 minutes 
cron.schedule('*/1 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Scheduler triggered - calling smart contract...`);

  try {
    const tx = await contract.checkAndChargeSubscriptions();

    await tx.wait();

    console.log("Contract function executed successfully. Transaction hash:", tx.hash);
  } catch (error) {
    console.error("Failed to execute contract function:", error.message);
  }
});
