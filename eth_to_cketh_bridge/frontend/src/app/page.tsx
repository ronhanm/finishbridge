"use client";
import React, { useState } from "react";
import { ethers } from "ethers";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory } from './canister_idl'; // Ensure this is correctly generated
import bridgeAbi from "./bridgeAbi.json"; // Replace with your actual contract ABI

declare global {
  interface Window {
    ethereum?: any;
    ic?: any;
  }
}

export default function Home() {
  const [ethAddress, setEthAddress] = useState("");
  const [icpAddress, setIcpAddress] = useState(""); // This should be correct
  const [isEthConnected, setIsEthConnected] = useState(false);
  const [isIcpConnected, setIsIcpConnected] = useState(false);
  const [action, setAction] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const contractAddress = "0x083719e1441afe27f86683b1f5288c56989c001d"; // Replace with actual contract address

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
        whitelist: ["bkyz2-fmaaa-aaaaa-qaaaq-cai"], // Replace with actual canister ID
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
      // Ensure both wallets are connected
      if (!isEthConnected || !isIcpConnected) {
        setTransactionStatus("Please connect both Ethereum and ICP wallets.");
        return;
      }

      let tx;

      if (action === "deposit") {
        // Deposit logic for Ethereum
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();

        if (network.chainId !== 11155111) {
          setTransactionStatus("Please switch to the Sepolia network.");
          return;
        }

        const contract = new ethers.Contract(contractAddress, bridgeAbi, signer);
        const icPrincipal = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(icpAddress)); // Hash ICP principal

        tx = await contract.deposit(icPrincipal, {
          value: ethers.utils.parseEther(amount),
        });

        await tx.wait();
        setTransactionStatus(`Transaction successful: ${tx.hash}`);
      } else {
        // ICP Withdrawal logic
        const agent = new HttpAgent({ host: "https://ic0.app" });
        await agent.fetchRootKey();

        const actor = Actor.createActor(idlFactory, {
          agent,
          canisterId: 'bd3sg-teaaa-aaaaa-qaaba-cai', // Replace with your actual canister ID
        });

        // Ensure `amountToWithdraw` is a valid BigInt
        const amountToWithdraw = BigInt((parseFloat(amount) * 1_000_000_000).toFixed(0));

        const result = await actor.withdraw({
          amount: amountToWithdraw,  // Pass as BigInt directly
          ethAddress: ethAddress,    // Ethereum address for the withdrawal
        });

        setTransactionStatus(result ? 'Withdrawal successful' : 'Withdrawal failed');
      }
    } catch (error: any) {
      console.error("Withdrawal error:", error); // Enhanced error logging
      setTransactionStatus(`Transaction failed: ${error?.message || "Unknown error"}`);
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
      {isIcpConnected && <p>Connected to ICP: {icpAddress}</p>} {/* Updated to use icpAddress */}

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

