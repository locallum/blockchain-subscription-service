const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 4000;
const DATA_FILE = 'subscriptions.json';


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


app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});