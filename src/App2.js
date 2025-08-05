import React, { useState, useEffect } from "react";
import { Contract, BrowserProvider, parseEther, formatEther, toUtf8Bytes } from "ethers";

// const contractAddress = "0x33c42a6165BbBA4F3f035f31587c2c55eaFcD2d4";
const contractAddress = "0xa5C4E61FfD37708a5BB8f4F3A745Db0e95C12D9C";

const API_BASE = "http://localhost:4000";

const providers = [
  { name: "Netflix", address: "0x12eE580cBE99f9c66e4A1cA602e2a1E4A93b900e" },
  { name: "Spotify (Not Working Yet)", address: "SPOTIFY-ADDRESS" },
  { name: "Disney+ (Not Working Yet)", address: "DISNEY-ADDRESS" }
];


const contractABI =
    [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "cancel",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Cancelled",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "provider",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "claim",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "provider",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Claimed",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "provider",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "metadata",
				"type": "bytes"
			}
		],
		"name": "subscribe",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "provider",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bytes",
				"name": "metadata",
				"type": "bytes"
			}
		],
		"name": "Subscribed",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];


function App2() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [claimablePayments, setClaimablePayments] = useState([]);

  // Connect wallet and initialize contract
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      const contract = new Contract(contractAddress, contractABI, signer);

      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      setContract(contract);
    } catch (err) {
      console.error("Error connecting wallet:", err);
      alert("Error connecting wallet: " + err.message);
    }
  }

  // Subscribe to a provider with duration and ETH amount
  async function subscribe(providerAddress, durationMonths, amountEth) {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }
    try {
      const secondsInMonth = 30 * 24 * 60 * 60; // approx seconds in one month
      const durationSeconds = durationMonths * secondsInMonth;

      const metadata = toUtf8Bytes(JSON.stringify({
        duration: durationSeconds,
        timestamp: Date.now()
      }));

      const tx = await contract.subscribe(
        providerAddress,
        metadata,
        { value: parseEther(amountEth) }
      );
      await tx.wait();

      // record in backend
      await fetch(`${API_BASE}/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: account,
          provider: providerAddress,
          amount: amountEth,
          startTime: Date.now() / 1000,
          duration: durationSeconds
        })
      });

      alert("Subscribed!");
      loadSubscriptions();
    } catch (err) {
      alert("Subscription failed: " + err.message);
    }
  }

  // Load active user subscriptions
  async function loadSubscriptions() {
    if (!contract || !account) return;
    try {
      // fetch user subscriptions from backend
      const res = await fetch(`${API_BASE}/subscriptions?user=${account}`);
      const data = await res.json();
      const activeSubscriptions = data.filter(sub => sub.isActive);

      setSubscriptions(activeSubscriptions);
    } catch (err) {
      console.error("Error loading subscriptions:", err);
    }
  }

  // Cancel subscription by ID
  async function cancelSubscription(id) {
    if (!contract) return;
    try {
      // call contract to process refund
      const subscription = subscriptions.find(s => s.id === id);
      const tx = await contract.cancel(subscription.user, parseEther(subscription.amount));
      await tx.wait();

      // set subscription inactive on backend
      await fetch(`${API_BASE}/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false })
      });

      alert("Subscription cancelled");
      loadSubscriptions();
    } catch (err) {
      alert("Cancel failed: " + err.message);
    }
  }

  // Load claimable payments for provider
  async function loadClaimablePayments() {
    if (!contract || !account) return;
    try {
      const res = await fetch(`${API_BASE}/claimables?provider=${account}`);
      const data = await res.json();
      const timeNow = Math.floor(Date.now() / 1000);
      const claimable = data.filter(sub => sub.isActive && !sub.isClaimed && timeNow >= (sub.startTime + sub.duration));
      setClaimablePayments(claimable);
    } catch (err) {
      console.error("Error loading claimable payments:", err);
    }
  }

  // Claim payment by ID
  async function claimPayment(id) {
    if (!contract) return;
    try {
      const subscription = claimablePayments.find(s => s.id === id);
      const tx = await contract.claim(subscription.provider, parseEther(subscription.amount));
      await tx.wait();

      // set subscription as claimed, inactive on backend
      await fetch(`${API_BASE}/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isClaimed: true, isActive: false })
      });


      alert("Payment claimed");
      loadClaimablePayments();
    } catch (err) {
      alert("Claim failed: " + err.message);
    }
  }

  // Refresh subscriptions and claimable payments when contract or account changes
  useEffect(() => {
    if (contract && account) {
      loadSubscriptions();
      loadClaimablePayments();
    }
  }, [contract, account]);

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Payment Subscription Demo</h1>

      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <>
          <p>
            Connected as: <b>{account}</b>
          </p>

          <h2>Subscribe</h2>
          <SubscribeForm onSubscribe={subscribe} />

          <h2>Your Active Subscriptions</h2>
          {subscriptions.length === 0 && <p>No active subscriptions</p>}
          {subscriptions.map((sub) => (
            <div key={sub.id} style={{ marginBottom: 10 }}>
              <p>
                <b>Sub ID:</b> {sub.id} | <b>Provider:</b> {sub.provider} |{" "}
                <b>Amount:</b> {sub.amount} ETH |{" "}
                <b>Duration: {sub.durationMonths} months | {" "}</b>
                <b>Active:</b> {sub.isActive ? "Yes" : "No"}
              </p>
              <button onClick={() => cancelSubscription(sub.id)}>Cancel</button>
            </div>
          ))}

          <h2>Your Claimable Payments (if provider)</h2>
          {claimablePayments.length === 0 && <p>No claimable payments</p>}
          {claimablePayments.map((sub) => (
            <div key={sub.id} style={{ marginBottom: 10 }}>
              <p>
                <b>Payment ID:</b> {sub.id} | <b>User:</b> {sub.user} |{" "}
                <b>Amount:</b> {sub.amount} ETH
              </p>
              <button onClick={() => claimPayment(sub.id)}>Claim</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function SubscribeForm({ onSubscribe }) {
  const [providerIndex, setProviderIndex] = useState("");
  const [months, setMonths] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (providerIndex === "" || !months || !amount) {
      alert("Please fill all fields");
      return;
    }
    const providerAddress = providers[providerIndex].address;
    onSubscribe(providerAddress, parseInt(months), amount);
    setProviderIndex("");
    setMonths("");
    setAmount("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
      <select
        value={providerIndex}
        onChange={(e) => setProviderIndex(e.target.value)}
        style={{ marginRight: 10, width: 250 }}
      >
        <option value="">Select Provider</option>
        {providers.map((p, index) => (
          <option key={p.address} value={index}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Duration (months)"
        value={months}
        onChange={(e) => setMonths(e.target.value)}
        style={{ marginRight: 10, width: 150 }}
        min="1"
      />
      <input
        type="text"
        placeholder="Amount in ETH"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ marginRight: 10, width: 150 }}
      />
      <button type="submit">Subscribe</button>
    </form>
  );
}

export default App2;