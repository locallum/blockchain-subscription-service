const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 4000;
const DATA_FILE = 'subscriptions.json';
const { ethers } = require('ethers');
const cron = require('node-cron');
require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());

// Load subscriptions from file or initialize with empty array
function loadSubscriptions() {
  try {
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Save subscriptions to file
function saveSubscriptions(subs) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(subs, null, 2));
}

// Get subscriptions for a specific user
app.get('/subscriptions', (req, res) => {
  const user = req.query.user?.toLowerCase();
  const all = loadSubscriptions();
  const userSubs = all.filter(sub => sub.user.toLowerCase() === user);
  res.json(userSubs);
});

// Get claimable payments for a provider
app.get('/claimables', (req, res) => {
  const provider = req.query.provider?.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const all = loadSubscriptions();
  const claimables = all.filter(sub =>
    sub.provider.toLowerCase() === provider &&
    sub.isActive &&
    !sub.isClaimed &&
    (sub.startTime + sub.duration <= now)
  );
  res.json(claimables);
});

// Create a new subscription
app.post('/subscriptions', (req, res) => {
  const subs = loadSubscriptions();
  const newSub = {
    id: subs.length,
    user: req.body.user,
    provider: req.body.provider,
    amount: req.body.amount,
    startTime: req.body.startTime,
    duration: req.body.duration,
    isActive: true,
    isClaimed: false
  };
  subs.push(newSub);
  saveSubscriptions(subs);
  res.status(201).json(newSub);
});

// Update subscription by ID
app.patch('/subscriptions/:id', (req, res) => {
  const subs = loadSubscriptions();
  const id = parseInt(req.params.id);
  const sub = subs.find(s => s.id === id);
  if (!sub) return res.status(404).send('Subscription not found');

  Object.assign(sub, req.body);
  saveSubscriptions(subs);
  res.json(sub);
});

// log function
function logToFile(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync('scheduler.log', `[${timestamp}] ${message}\n`);
}

// define ABI
const contractABI = [
  "function claim(address provider, uint256 amount) public",
  "function subscribe(address provider, bytes metadata) public payable"
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

  const subscriptions = loadSubscriptions();
  const now = Math.floor(Date.now() / 1000);
  const newSubscriptions = [...subscriptions];
  let maxId = subscriptions.length > 0 ? Math.max(...subscriptions.map(s => s.id)) : 0;

  for (const sub of subscriptions){

    // automate claiming of payments (for providers)
    if (sub.isActive && !sub.isClaimed && now >= sub.startTime + sub.duration){
      try {
        const tx = await contract.claim(sub.provider, ethers.parseEther(sub.amount));
        await tx.wait();

        sub.isActive = false;
        sub.isClaimed = true;
        logToFile(`Claimed sub ${sub.id}, tx: ${tx.hash}`);

        // automatically resubscribe
        const metadata = ethers.toUtf8Bytes(JSON.stringify({
          duration: sub.duration,
          timestamp: now
        }));

        const tx_resubscribe = await contract.subscribe(sub.provider, metadata, {
          value: ethers.parseEther(sub.amount)
        });

        await tx_resubscribe.wait();

        // create new subscription object with updated start time
        const newSubscription = {
          id: ++maxId,
          user: sub.user,
          provider: sub.provider,
          amount: sub.amount,
          startTime: now,
          duration: sub.duration,
          isActive: true,
          isClaimed: false
        };

        newSubscriptions.push(newSubscription);
        logToFile(`Re-subscribed ${newSubscription.id}, tx: ${tx_resubscribe.hash}`);
      }
      catch (err){
        logToFile(`Failed processing sub ${sub.id}: ${err.message}`);
      }
    }
  }
  saveSubscriptions(newSubscriptions);
});


app.listen(PORT, () => {
  console.log(`Backend + Scheduler running at http://localhost:${PORT}`);
});