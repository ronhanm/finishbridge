"use client";
import React, { useState } from "react";
import { ethers } from "ethers";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory } from './canister_idl';
import bridgeAbi from "./bridgeAbi.json";

export default function Home() {
  const [ethAddress, setEthAddress] = useState("");
  const [icpAddress, setIcpAddress] = useState("");
  const [isEthConnected, setIsEthConnected] = useState(false);
  const [isIcpConnected, setIsIcpConnected] = useState(false);
  const [action, setAction] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const contractAddress = "0x443A852cd8DF39938CE628490195c95E60B12a10";

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

  // Disconnect Ethereum Wallet
  const handleEthDisconnect = () => {
    setEthAddress("");
    setIsEthConnected(false);
  };

  // Connect to Plug Wallet (ICP)
  const handleIcpConnect = async () => {
    if (!window.ic || !window.ic.plug) {
      alert("Please install the Plug Wallet extension!");
      return;
    }
    try {
      const connected = await window.ic.plug.requestConnect({
        whitelist: ["bkyz2-fmaaa-aaaaa-qaaaq-cai"],
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

  // Disconnect ICP Wallet
  const handleIcpDisconnect = () => {
    setIcpAddress("");
    setIsIcpConnected(false);
  };

  // Handle Deposit/Withdrawal
  const handleDepositWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransactionStatus('');
    setLoading(true);
    try {
      if (!isEthConnected || !isIcpConnected) {
        setTransactionStatus("Please connect both Ethereum and ICP wallets.");
        return;
      }
      let tx;
      if (action === "deposit") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();
        if (network.chainId !== 11155111) {
          setTransactionStatus("Please switch to the Sepolia network.");
          return;
        }
        const contract = new ethers.Contract(contractAddress, bridgeAbi, signer);
        const icPrincipal = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(icpAddress));
        tx = await contract.deposit(icPrincipal, { value: ethers.utils.parseEther(amount) });
        await tx.wait();
        setTransactionStatus(`Transaction successful: ${tx.hash}`);
      } else {
        const agent = new HttpAgent({ host: "https://ic0.app" });
        await agent.fetchRootKey();
        const actor = Actor.createActor(idlFactory, {
          agent,
          canisterId: 'bd3sg-teaaa-aaaaa-qaaba-cai',
        });
        const amountToWithdraw = BigInt((parseFloat(amount) * 1_000_000_000).toFixed(0));
        const result = await actor.withdraw({ amount: amountToWithdraw, ethAddress: ethAddress });
        setTransactionStatus(result ? 'Withdrawal successful' : 'Withdrawal failed');
      }
    } catch (error: any) {
      console.error("Transaction error:", error);
      setTransactionStatus(`Transaction failed: ${error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 text-black">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">EtherPortal</h1>
      </header>

      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Connect Wallets</h2>
        <div className="flex space-x-4">
          {!isEthConnected ? (
            <button onClick={handleEthConnect} className="p-2 bg-green-500 text-white rounded">
              Connect MetaMask
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <p className="text-green-700">Connected to Ethereum: {ethAddress}</p>
              <button onClick={handleEthDisconnect} className="p-1 bg-red-500 text-white rounded">
                Disconnect
              </button>
            </div>
          )}
          {!isIcpConnected ? (
            <button onClick={handleIcpConnect} className="p-2 bg-blue-500 text-white rounded">
              Connect Plug Wallet
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <p className="text-blue-700">Connected to ICP: {icpAddress}</p>
              <button onClick={handleIcpDisconnect} className="p-1 bg-red-500 text-white rounded">
                Disconnect
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Transaction</h2>
        <form onSubmit={handleDepositWithdraw} className="space-y-4">
          <div className="flex space-x-4">
            <select value={action} onChange={(e) => setAction(e.target.value)} className="p-2 border rounded w-full">
              <option value="deposit">Deposit ETH</option>
              <option value="withdraw">Withdraw ckETH</option>
            </select>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="p-2 border rounded w-full"
            />
          </div>
          <button type="submit" disabled={!amount || isNaN(Number(amount))} className="w-full bg-green-600 text-white p-2 rounded">
            {loading ? "Processing..." : action === "deposit" ? "Deposit ETH" : "Withdraw ckETH"}
          </button>
        </form>
        <p className={`mt-4 ${transactionStatus.includes('failed') ? 'text-red-500' : 'text-green-500'}`}>
          {transactionStatus}
        </p>
      </section>
    </div>
  );
}
