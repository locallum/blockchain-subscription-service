import React, { useState, useEffect } from "react";
import { Contract, BrowserProvider, parseEther, formatEther } from "ethers";

const contractAddress = "0x33c42a6165BbBA4F3f035f31587c2c55eaFcD2d4";

const providers = [
  { name: "Netflix", address: "0x12eE580cBE99f9c66e4A1cA602e2a1E4A93b900e" },
  { name: "Spotify (Not Working Yet)", address: "SPOTIFY-ADDRESS" },
  { name: "Disney+ (Not Working Yet)", address: "DISNEY-ADDRESS" }
];

// Paste your contract ABI here:
const contractABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_subId",
        "type": "uint256"
      }
    ],
    "name": "cancel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_subId",
        "type": "uint256"
      }
    ],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_provider",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_duration",
        "type": "uint256"
      }
    ],
    "name": "subscribe",
    "outputs": [],
    "stateMutability": "payable",
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
        "internalType": "uint256",
        "name": "subId",
        "type": "uint256"
      }
    ],
    "name": "Cancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "subId",
        "type": "uint256"
      }
    ],
    "name": "Claimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "subId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
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
    "name": "Subscribed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_provider",
        "type": "address"
      }
    ],
    "name": "getClaimablePayments",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getUserSubscriptions",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
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
  },
  {
    "inputs": [],
    "name": "subscriptionId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "subscriptions",
    "outputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "provider",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isClaimed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function App() {
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

      const tx = await contract.subscribe(
        providerAddress,
        durationSeconds,
        { value: parseEther(amountEth) }
      );
      await tx.wait();
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
      const subIds = await contract.getUserSubscriptions(account);
      console.log(subIds);
      const subs = [];

      for (let i = 0; i < subIds.length; i++) {
        const id = Number(subIds[i]);

        const subRaw = await contract.subscriptions(id);

        // Clean mapping
        const sub = {
          id,
          user: subRaw.user,
          provider: subRaw.provider,
          amount: subRaw.amount,
          startTime: subRaw.startTime.toNumber ? subRaw.startTime.toNumber() : subRaw.startTime,
          duration: subRaw.duration.toNumber ? subRaw.duration.toNumber() : subRaw.duration,
          isActive: subRaw.isActive,
          isClaimed: subRaw.isClaimed,
        };

        subs.push(sub);
      }

      console.log("Loaded subscriptions:", subs);
      setSubscriptions(subs);
    } catch (err) {
      console.error("Error loading subscriptions:", err);
    }
  }

  // Cancel subscription by ID
  async function cancelSubscription(id) {
    if (!contract) return;
    try {
      const tx = await contract.cancel(id);
      await tx.wait();
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
      const claimIds = await contract.getClaimablePayments(account);
      const claims = [];

      for (let i = 0; i < claimIds.length; i++) {
        const id = claimIds[i].toNumber();
        const sub = await contract.subscriptions(id);
        claims.push({ id, ...sub });
      }
      setClaimablePayments(claims);
    } catch (err) {
      console.error("Error loading claimable payments:", err);
    }
  }

  // Claim payment by ID
  async function claimPayment(id) {
    if (!contract) return;
    try {
      const tx = await contract.claim(id);
      await tx.wait();
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
                <b>Amount:</b> {formatEther(sub.amount)} ETH |{" "}
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
                <b>Amount:</b> {formatEther(sub.amount)} ETH
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

export default App;