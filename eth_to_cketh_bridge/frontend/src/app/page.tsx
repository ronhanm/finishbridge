"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory } from './canister_idl'; // Placeholder for your canister interface

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
        whitelist: ["rrkah-fqaaa-aaaaa-aaaaq-cai"], // Placeholder canister
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
        // Deposit logic for Ethereum
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

        try {
          tx = await signer.sendTransaction({
            to: "0x0000000000000000000000000000000000000000", // Placeholder bridge address
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
          canisterId: 'rrkah-fqaaa-aaaaa-aaaaq-cai', // Your canister ID
        });

        try {
          const amountToWithdraw = BigInt((parseFloat(amount) * 1_000_000_000).toFixed(0));
          const result = await actor.withdraw(amountToWithdraw);

          console.log("Withdrawal result:", result);
          if (result) {
            setTransactionStatus('Withdrawal successful');
          } else {
            setTransactionStatus('Withdrawal failed');
          }
        } catch (error: any) {
          console.error("Withdrawal error:", error);
          const errorMessage = error?.message || "Withdrawal failed."; // Handling error message
          setTransactionStatus("Withdrawal failed: " + errorMessage);
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message || "Transaction failed. Please check the console for details."; // Handling error message
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
    </div>
  );
}
