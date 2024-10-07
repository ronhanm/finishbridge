"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory } from './canister_idl'; // Placeholder for your canister interface
import bridgeAbi from "./bridgeAbi"; // Import ABI for your contract

// Extend the Window interface to include ethereum and ic (Plug wallet) properties
declare global {
  interface Window {
    ethereum?: any;
    ic?: any;
  }
}

export default function Home() {
  const [ethAddress, setEthAddress] = useState("");
  const [icpAddress, setIcpAddress] = useState("");
  const [isEthConnected, setIsEthConnected] = useState(false);
  const [isIcpConnected, setIsIcpConnected] = useState(false);
  const [action, setAction] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const contractAddress = "0x2aF5dd55B3543335f530a6860BB6410dd494Ef42"; // Placeholder bridge address

  // Connect to Ethereum Wallet (MetaMask)
  const handleEthConnect = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setIsEthConnected(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setEthAddress(address);
    } catch (error) {
      console.error(error);
    }
  };

  // Connect to Plug Wallet (ICP)
  const handleIcpConnect = async () => {
    if (!window.ic || !window.ic.plug) {
      alert("Please install the Plug Wallet extension!");
      return;
    }

    try {
      const connected = await window.ic.plug.requestConnect({
        whitelist: ["bkyz2-fmaaa-aaaaa-qaaaq-cai"], // Correct Bridge canister ID
        host: "https://ic0.app",
      });

      if (connected) {
        setIsIcpConnected(true);
        const principal = await window.ic.plug.getPrincipal();
        setIcpAddress(principal.toText());
      } else {
        alert("Plug Wallet connection failed.");
      }
    } catch (error) {
      console.error("Error connecting to Plug wallet:", error);
    }
  };

  // Handle Deposit/Withdrawal
  const handleDepositWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransactionStatus('');
    setLoading(true);

    try {
      let tx;

      if (action === "deposit") {
        // Deposit logic for Ethereum using the deposit function
        if (!window.ethereum) {
          setTransactionStatus("Please install MetaMask or another Ethereum wallet provider.");
          return;
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();

        if (network.chainId !== 11155111) {
          setTransactionStatus("Please switch to the Sepolia network.");
          return;
        }

        // Create the contract instance and call the deposit function
        const contract = new ethers.Contract(contractAddress, bridgeAbi, signer);
        const icPrincipal = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(icpAddress));  // Hash ICP principal to bytes32

        try {
          tx = await contract.deposit(icPrincipal, {
            value: ethers.utils.parseEther(amount),
          });

          // Wait for transaction confirmation
          await tx.wait();

          if (tx.hash) {
            setTransactionStatus(`Transaction successful: ${tx.hash}`);
          }
        } catch (error) {
          console.error(error);
          setTransactionStatus("Transaction failed: " + (error?.message || "Unknown error"));
        }

      } else {
        // ICP Withdrawal logic
        const agent = new HttpAgent({ host: "https://ic0.app" });
        await agent.fetchRootKey(); // Fetch the root key before making the call

        const actor = Actor.createActor(idlFactory, {
          agent,
          canisterId: 'bd3sg-teaaa-aaaaa-qaaba-cai', // Backend canister ID
        });

        try {
          const amountToWithdraw = BigInt((parseFloat(amount) * 1_000_000_000).toFixed(0));
          const result = await actor.withdraw(amountToWithdraw);

          if (result) {
            setTransactionStatus('Withdrawal successful');
          } else {
            setTransactionStatus('Withdrawal failed');
          }
        } catch (error: any) {
          console.error("Withdrawal error:", error);
          const errorMessage = error?.message || "Withdrawal failed.";
          setTransactionStatus("Withdrawal failed: " + errorMessage);
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message || "Transaction failed. Please check the console for details.";
      setTransactionStatus(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <h1 className="text-3xl font-bold">ETH to ckETH Bridge</h1>

      {/* Dark Mode Toggle */}
      <button onClick={() => setDarkMode(!darkMode)} className="mt-4 bg-blue-500 text-white p-2 rounded">
        Toggle Dark Mode
      </button>

      {/* Connect Ethereum Wallet */}
      <button onClick={handleEthConnect} className={`mt-4 ${isEthConnected ? 'bg-red-500' : 'bg-green-500'} text-white p-2 rounded`}>
        {isEthConnected ? "Disconnect MetaMask" : "Connect MetaMask"}
      </button>
      {isEthConnected && <p>Connected to Ethereum: {ethAddress}</p>}

      {/* Connect ICP Wallet */}
      <button onClick={handleIcpConnect} className={`mt-4 ${isIcpConnected ? 'bg-red-500' : 'bg-blue-500'} text-white p-2 rounded`}>
        {isIcpConnected ? "Disconnect Plug" : "Connect Plug Wallet"}
      </button>
      {isIcpConnected && <p>Connected to ICP: {icpAddress}</p>}

      {/* Action Dropdown */}
      <select value={action} onChange={(e) => setAction(e.target.value)} className="mt-4 p-2 border">
        <option value="deposit">Deposit</option>
        <option value="withdraw">Withdraw</option>
      </select>

      {/* Transaction Form */}
      <form onSubmit={handleDepositWithdraw} className="mt-4">
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="p-2 border"
        />
        <button type="submit" disabled={!amount || isNaN(Number(amount))} className="mt-4 bg-green-500 text-white p-2 rounded">
          {action === "deposit" ? "Deposit ETH" : "Withdraw ckETH"}
        </button>
      </form>

      {/* Transaction Status */}
      {loading && <div className="loader">Loading...</div>}
      <p className={`mt-4 ${transactionStatus.includes('failed') ? 'text-red-500' : 'text-green-500'}`}>
        {transactionStatus}
      </p>

      {/* Deployment Summary */}
      <div className="mt-6 p-4 border rounded bg-gray-100">
        <h2 className="text-xl font-bold">Deployment Summary:</h2>
        <h3 className="font-semibold">Canisters Created:</h3>
        <ul>
          <li>Bridge Canister ID: <strong>br5f7-7uaaa-aaaaa-qaaca-cai</strong></li>
          <li>Backend Canister ID: <strong>bkyz2-fmaaa-aaaaa-qaaaq-cai</strong></li>
          <li>Frontend Canister ID: <strong>bd3sg-teaaa-aaaaa-qaaba-cai</strong></li>
        </ul>
        <h3 className="font-semibold">Accessing Your Canisters:</h3>
        <ul>
          <li>Frontend Canister: <a href="http://127.0.0.1:4943/?canisterId=bd3sg-teaaa-aaaaa-qaaba-cai" target="_blank" rel="noopener noreferrer">http://127.0.0.1:4943/?canisterId=bd3sg-teaaa-aaaaa-qaaba-cai</a></li>
          <li>Backend Canister (Candid Interface): <a href="http://127.0.0.1:4943/?canisterId=be2us-64aaa-aaaaa-qaabq-cai&id=bkyz2-fmaaa-aaaaa-qaaaq-cai" target="_blank" rel="noopener noreferrer">http://127.0.0.1:4943/?canisterId=be2us-64aaa-aaaaa-qaabq-cai&id=bkyz2-fmaaa-aaaaa-qaaaq-cai</a></li>
        </ul>
      </div>
    </div>
  );
}
