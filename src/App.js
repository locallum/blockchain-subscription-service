import React, { useState, useEffect } from "react";
import { Contract, BrowserProvider, parseEther, formatEther } from "ethers";

const contractAddress = "0x33c42a6165BbBA4F3f035f31587c2c55eaFcD2d4";

const providers = [
  { name: "Netflix", address: "0x12eE580cBE99f9c66e4A1cA602e2a1E4A93b900e" },
  { name: "Spotify (Not Working Yet)", address: "SPOTIFY-ADDRESS" },
  { name: "Disney+ (Not Working Yet)", address: "DISNEY-ADDRESS" }
];

// Contract ABI
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

const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: '20px'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    color: 'white'
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: '800',
    margin: '0 0 10px 0',
    background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    fontSize: '1.2rem',
    opacity: '0.9',
    margin: '0'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '32px',
    marginBottom: '24px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  connectCard: {
    maxWidth: '400px',
    margin: '0 auto',
    textAlign: 'center'
  },
  connectIcon: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
    margin: '0 auto 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem'
  },
  connectTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px'
  },
  connectDesc: {
    color: '#6b7280',
    marginBottom: '24px',
    fontSize: '1.1rem'
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    padding: '16px 32px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
  },
  buttonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 28px rgba(102, 126, 234, 0.4)'
  },
  buttonDisabled: {
    opacity: '0.6',
    cursor: 'not-allowed'
  },
  buttonFull: {
    width: '100%'
  },
  accountInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 0'
  },
  accountLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  accountIcon: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '50%',
    marginRight: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '1.2rem'
  },
  accountText: {
    margin: '0',
    color: '#6b7280',
    fontSize: '0.9rem'
  },
  accountAddress: {
    margin: '4px 0 0 0',
    fontFamily: 'monospace',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  statusConnected: {
    display: 'flex',
    alignItems: 'center',
    color: '#10b981',
    fontWeight: '600'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    background: '#10b981',
    borderRadius: '50%',
    marginRight: '8px',
    animation: 'pulse 2s infinite'
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center'
  },
  sectionIcon: {
    marginRight: '12px',
    fontSize: '1.8rem'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  inputFocus: {
    borderColor: '#667eea',
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
  },
  select: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '1rem',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  subscriptionCard: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '16px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease'
  },
  subscriptionCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)'
  },
  subscriptionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  subscriptionLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  subscriptionIcon: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    marginRight: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
    fontSize: '1.1rem'
  },
  subscriptionInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  subscriptionName: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 4px 0'
  },
  subscriptionAmount: {
    fontSize: '1.1rem',
    color: '#6b7280',
    margin: '0'
  },
  subscriptionMeta: {
    display: 'flex',
    gap: '24px',
    fontSize: '0.9rem',
    color: '#6b7280'
  },
  statusActive: {
    display: 'flex',
    alignItems: 'center',
    color: '#10b981',
    fontWeight: '600'
  },
  statusInactive: {
    display: 'flex',
    alignItems: 'center',
    color: '#ef4444',
    fontWeight: '600'
  },
  buttonCancel: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  buttonClaim: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280'
  },
  emptyIcon: {
    fontSize: '4rem',
    opacity: '0.3',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '1.3rem',
    fontWeight: '600',
    marginBottom: '8px'
  },
  emptyDesc: {
    fontSize: '1rem',
    opacity: '0.8'
  },
  claimCard: {
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '16px',
    border: '1px solid #bbf7d0'
  },
  claimAmount: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#10b981',
    margin: '8px 0 0 0'
  },
  spinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid #ffffff',
    borderRadius: '50%',
    borderTopColor: 'transparent',
    animation: 'spin 1s ease-in-out infinite',
    marginRight: '8px'
  }
};

// Add keyframes for animations
const keyframes = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [claimablePayments, setClaimablePayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Connect wallet and initialize contract
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  // Subscribe to a provider with duration and ETH amount
  async function subscribe(providerAddress, durationMonths, amountEth) {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }
    try {
      setLoading(true);
      const secondsInMonth = 30 * 24 * 60 * 60;
      const durationSeconds = durationMonths * secondsInMonth;

      const tx = await contract.subscribe(
        providerAddress,
        durationSeconds,
        { value: parseEther(amountEth) }
      );
      await tx.wait();
      alert("Subscribed successfully!");
      loadSubscriptions();
    } catch (err) {
      alert("Subscription failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load active user subscriptions
  async function loadSubscriptions() {
    if (!contract || !account) return;
    try {
      const subIds = await contract.getUserSubscriptions(account);
      const subs = [];

      for (let i = 0; i < subIds.length; i++) {
        const id = Number(subIds[i]);
        const subRaw = await contract.subscriptions(id);

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

      setSubscriptions(subs);
    } catch (err) {
      console.error("Error loading subscriptions:", err);
    }
  }

  // Cancel subscription by ID
  async function cancelSubscription(id) {
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.cancel(id);
      await tx.wait();
      alert("Subscription cancelled successfully");
      loadSubscriptions();
    } catch (err) {
      alert("Cancel failed: " + err.message);
    } finally {
      setLoading(false);
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
      setLoading(true);
      const tx = await contract.claim(id);
      await tx.wait();
      alert("Payment claimed successfully");
      loadClaimablePayments();
    } catch (err) {
      alert("Claim failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Refresh subscriptions and claimable payments when contract or account changes
  useEffect(() => {
    if (contract && account) {
      loadSubscriptions();
      loadClaimablePayments();
    }
  }, [contract, account]);

  const getProviderName = (address) => {
    const provider = providers.find(p => p.address === address);
    return provider ? provider.name : `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div style={styles.app}>
      <style>{keyframes}</style>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Trillionaire Grindset</h1>
          <p style={styles.subtitle}>Decentralized Subscription Management</p>
        </div>

        {!account ? (
          <div style={{...styles.card, ...styles.connectCard}}>
            <div style={styles.connectIcon}>⚡</div>
            <h2 style={styles.connectTitle}>Connect Your Wallet</h2>
            <p style={styles.connectDesc}>Connect your MetaMask wallet to start managing subscriptions</p>
            <button
              onClick={connectWallet}
              disabled={loading}
              style={{
                ...styles.button,
                ...styles.buttonFull,
                ...(loading ? styles.buttonDisabled : {})
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  Connecting...
                </>
              ) : (
                "Connect Wallet"
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Account Info */}
            <div style={styles.card}>
              <div style={styles.accountInfo}>
                <div style={styles.accountLeft}>
                  <div style={styles.accountIcon}>👤</div>
                  <div>
                    <p style={styles.accountText}>Connected Wallet</p>
                    <p style={styles.accountAddress}>
                      {account.substring(0, 6)}...{account.substring(account.length - 4)}
                    </p>
                  </div>
                </div>
                <div style={styles.statusConnected}>
                  <div style={styles.statusDot}></div>
                  Connected
                </div>
              </div>
            </div>

            {/* Subscribe Section */}
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionIcon}>➕</span>
                New Subscription
              </h2>
              <SubscribeForm onSubscribe={subscribe} loading={loading} />
            </div>

            {/* Active Subscriptions */}
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionIcon}>📋</span>
                Your Subscriptions
              </h2>
              
              {subscriptions.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📄</div>
                  <p style={styles.emptyTitle}>No active subscriptions</p>
                  <p style={styles.emptyDesc}>Subscribe to a service to get started!</p>
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div key={sub.id} style={styles.subscriptionCard}>
                    <div style={styles.subscriptionHeader}>
                      <div style={styles.subscriptionLeft}>
                        <div style={styles.subscriptionIcon}>#{sub.id}</div>
                        <div style={styles.subscriptionInfo}>
                          <h3 style={styles.subscriptionName}>{getProviderName(sub.provider)}</h3>
                          <p style={styles.subscriptionAmount}>{formatEther(sub.amount)} ETH</p>
                        </div>
                      </div>
                      <button
                        onClick={() => cancelSubscription(sub.id)}
                        disabled={loading || !sub.isActive}
                        style={{
                          ...styles.buttonCancel,
                          ...(loading || !sub.isActive ? styles.buttonDisabled : {})
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    <div style={styles.subscriptionMeta}>
                      <span>⏱️ Duration: {Math.round(sub.duration / (30 * 24 * 60 * 60))} months</span>
                      <span style={sub.isActive ? styles.statusActive : styles.statusInactive}>
                        <span style={{...styles.statusDot, background: sub.isActive ? '#10b981' : '#ef4444'}}></span>
                        {sub.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Claimable Payments */}
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionIcon}>💰</span>
                Claimable Payments
              </h2>
              
              {claimablePayments.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>💳</div>
                  <p style={styles.emptyTitle}>No claimable payments</p>
                  <p style={styles.emptyDesc}>Payments will appear here when users subscribe to your services</p>
                </div>
              ) : (
                claimablePayments.map((payment) => (
                  <div key={payment.id} style={styles.claimCard}>
                    <div style={styles.subscriptionHeader}>
                      <div style={styles.subscriptionLeft}>
                        <div style={{...styles.subscriptionIcon, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>💸</div>
                        <div style={styles.subscriptionInfo}>
                          <h3 style={styles.subscriptionName}>Payment #{payment.id}</h3>
                          <p style={styles.subscriptionAmount}>From: {payment.user?.substring(0, 10)}...</p>
                          <p style={styles.claimAmount}>{formatEther(payment.amount)} ETH</p>
                        </div>
                      </div>
                      <button
                        onClick={() => claimPayment(payment.id)}
                        disabled={loading}
                        style={{
                          ...styles.buttonClaim,
                          ...(loading ? styles.buttonDisabled : {})
                        }}
                      >
                        Claim
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SubscribeForm({ onSubscribe, loading }) {
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
    <div>
      <div style={styles.formGrid}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Service Provider</label>
          <select
            value={providerIndex}
            onChange={(e) => setProviderIndex(e.target.value)}
            style={styles.select}
            required
          >
            <option value="">Select Provider</option>
            {providers.map((p, index) => (
              <option key={p.address} value={index}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Duration (months)</label>
          <input
            type="number"
            placeholder="e.g., 1"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            style={styles.input}
            min="1"
            required
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Amount (ETH)</label>
          <input
            type="text"
            placeholder="e.g., 0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
            required
          />
        </div>
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          ...styles.button,
          ...styles.buttonFull,
          ...(loading ? styles.buttonDisabled : {})
        }}
      >
        {loading ? (
          <>
            <span style={styles.spinner}></span>
            Processing...
          </>
        ) : (
          "Subscribe Now"
        )}
      </button>
    </div>
  );
}

export default App;