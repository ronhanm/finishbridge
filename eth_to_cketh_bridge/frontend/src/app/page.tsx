"use client";
import React, { useState } from "react";
import { ethers } from "ethers";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory } from './canister_idl';  // Canister's IDL
import bridgeAbi from "./bridgeAbi.json";  // Ethereum smart contract ABI

const contractAddress = "0xe9ec9588cd461a7db2b34051ec74a92098fa8afc";  // Ethereum contract address
const icCanisterId = "hs5lq-nqaaa-aaaak-qln7a-cai";  // ICP canister ID
const icWhitelistCanister = "r62qs-diaaa-aaaak-qlofq-cai";  // ICP whitelist canister
const icHost = "https://ic0.app";  // ICP host URL for local testing

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

  // Handle Ethereum wallet connection
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
      console.error("Error connecting to Ethereum:", (error as Error).message);
    }
  };

  // Handle ICP Plug Wallet connection
  const handleIcpConnect = async () => {
    if (!window.ic || !window.ic.plug) {
      alert("Please install the Plug Wallet extension!");
      return;
    }
    try {
      const connected = await window.ic.plug.requestConnect({
        whitelist: [icWhitelistCanister],
        host: icHost,
      });

      if (connected) {
        const principal = await window.ic.plug.getPrincipal();
        setIcpAddress(principal.toText());
        setIsIcpConnected(true);
      } else {
        throw new Error("Plug Wallet connection failed.");
      }
    } catch (error) {
      console.error("Error connecting to Plug wallet:", (error as Error).message);
      setTransactionStatus(`Error connecting to Plug wallet: ${(error as Error).message}`);
    }
  };

  // Handle deposit or withdrawal based on selected action
  const handleDepositWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransactionStatus('');
    setLoading(true);

    try {
      if (!isEthConnected || !isIcpConnected) {
        setTransactionStatus("Please connect both Ethereum and ICP wallets.");
        setLoading(false);
        return;
      }

      if (action === "deposit") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();

        if (network.chainId !== 11155111) {  // Sepolia test network chainId
          setTransactionStatus("Please switch to the Sepolia network.");
          setLoading(false);
          return;
        }

        const contract = new ethers.Contract(contractAddress, bridgeAbi, signer);
        const icPrincipal = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(icpAddress));

        // Convert input ETH amount (which can be decimal) to wei (BigInt)
        const ethAmountInWei = ethers.utils.parseEther(amount);  // Converts decimal ETH to wei

        const tx = await contract.deposit(icPrincipal, {
          value: ethAmountInWei,  // Pass as wei, BigInt compatible
        });

        await tx.wait();
        setTransactionStatus(`Transaction successful: ${tx.hash}`);
      } else {
        const agent = new HttpAgent({ host: icHost });
        await agent.fetchRootKey();  // Fetch root key for local testing

        const actor = Actor.createActor(idlFactory, {
          agent,
          canisterId: icCanisterId,
        });

        // Ensure the amount is passed as BigInt in atomic units (ckETH doesn't have decimals)
        const parsedAmount = BigInt(Math.round(Number(amount) * 1_000_000_000)); // Multiply for conversion to BigInt

        console.log("Parsed Amount as BigInt: ", parsedAmount);

        const result = await actor.withdraw({
          amount: parsedAmount,  // Pass BigInt directly
          ethAddress: ethAddress,
        });

        setTransactionStatus(result ? 'Withdrawal successful' : 'Withdrawal failed');
      }
    } catch (error) {
      console.error("Transaction error:", (error as Error).message);
      setTransactionStatus(`Transaction failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-6">ETH to ckETH Bridge</h1>

        <button onClick={handleEthConnect} className={`mb-4 w-full py-3 px-4 rounded-lg text-white transition ${isEthConnected ? 'bg-red-500' : 'bg-green-500'}`}>
          {isEthConnected ? "Disconnect MetaMask" : "Connect MetaMask"}
        </button>
        {isEthConnected && <p className="text-center text-sm mb-4">Connected to Ethereum: {ethAddress}</p>}

        <button onClick={handleIcpConnect} className={`mb-4 w-full py-3 px-4 rounded-lg text-white transition ${isIcpConnected ? 'bg-red-500' : 'bg-blue-500'}`}>
          {isIcpConnected ? "Disconnect Plug" : "Connect Plug Wallet"}
        </button>
        {isIcpConnected && <p className="text-center text-sm mb-4">Connected to ICP: {icpAddress}</p>}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-center">Select Action</label>
          <select value={action} onChange={(e) => setAction(e.target.value)} className="p-3 border rounded w-full text-center">
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdraw</option>
          </select>
        </div>

        <form onSubmit={handleDepositWithdraw} className="mb-4">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="p-3 border rounded w-full mb-4"
          />
          <button type="submit" disabled={!amount || isNaN(Number(amount))} className="w-full bg-blue-500 text-white py-3 rounded-lg disabled:opacity-50">
            {action === "deposit" ? "Deposit ETH" : "Withdraw ckETH"}
          </button>
        </form>

        {loading && <div className="loader mt-4 mx-auto"></div>}
        <p className={`mt-4 text-center ${transactionStatus.includes('failed') ? 'text-red-500' : 'text-green-500'}`}>
          {transactionStatus}
        </p>
      </div>
    </div>
  );
}
