#!/bin/bash

# Step 1: Project Name
PROJECT_NAME="eth_to_cketh_bridge"

# Step 2: Create project directory and navigate into it
echo "Creating project directory: $PROJECT_NAME"
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME" || { echo "Failed to enter directory"; exit 1; }

# Step 3: Initialize package.json
if [ ! -f package.json ]; then
    echo "Creating package.json..."
    npm init -y || { echo "Failed to create package.json"; exit 1; }
fi

# Step 4: Create a package-lock.json file
if [ ! -f package-lock.json ]; then
    echo "Creating package-lock.json..."
    npm install --package-lock-only || { echo "Failed to create package-lock.json"; exit 1; }
fi

# Step 5: Initialize a Next.js project if frontend directory doesn't exist
if [ ! -d "frontend" ]; then
    echo "Initializing Next.js app..."
    npx create-next-app@latest frontend --ts --eslint --tailwind --src-dir --app --import-alias "@/*" || { echo "Failed to initialize Next.js app"; exit 1; }
fi

# Step 6: Navigate to the frontend directory
cd frontend || { echo "Frontend directory not found"; exit 1; }

# Step 7: Install necessary packages for interacting with Ethereum, Alchemy SDK, useDapp, and @dfinity/agent
echo "Installing frontend dependencies..."
npm install ethers@5.7.0 @supabase/supabase-js@2.0.0 @mui/material@5.9.3 @usedapp/core@0.5.0 @dfinity/agent alchemy-sdk || { echo "Failed to install frontend dependencies"; exit 1; }

# Step 8: Install Tailwind CSS for styling
echo "Setting up Tailwind CSS..."
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest || { echo "Failed to install Tailwind CSS"; exit 1; }
npx tailwindcss init -p || { echo "Failed to initialize Tailwind CSS"; exit 1; }

# Step 9: Configure Tailwind to work with Next.js
cat <<EOL > tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOL

# Step 10: Add Tailwind directives to global styles
mkdir -p src/styles || { echo "Failed to create styles directory"; exit 1; }
cat <<EOL > src/styles/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOL

# Step 11: Set up wallet connector using ethers.js (removed @usedapp/core usage)
echo "Setting up wallet connector manually with ethers.js..."
mkdir -p src/components || { echo "Failed to create components directory"; exit 1; }
cat <<EOL > src/components/WalletConnection.tsx
"use client";
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';

const WalletConnection = () => {
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Please install MetaMask to connect your wallet.");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  return (
    <div>
      {account ? (
        <>
          <p>Connected: {account}</p>
          <button onClick={disconnectWallet}>Disconnect</button>
        </>
      ) : (
        <button onClick={connectWallet}>Connect MetaMask</button>
      )}
    </div>
  );
};

export default WalletConnection;
EOL

# Step 12: Update layout.tsx to remove useDapp provider (no longer needed)
echo "Updating layout.tsx to remove useDapp provider..."
cat <<EOL > src/app/layout.tsx
import { ReactNode } from 'react';
import WalletConnection from '../components/WalletConnection';
import '../styles/globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <WalletConnection />
    </>
  );
}
EOL

# Step 13: Commenting out ICP related code for now
echo "Commenting out ICP-related code temporarily..."
# mkdir -p src/icp || { echo "Failed to create ICP directory"; exit 1; }
# cat <<EOL > src/icp/icpConnector.ts
# // ICP integration code here (commented out)
# EOL

# Step 14: Update the main page component to handle deposits and withdrawals using ethers.js
echo "Updating main page component..."
cat <<EOL > src/app/page.tsx
"use client";
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import { useState } from 'react';

export default function Home() {
  const { register, handleSubmit } = useForm();
  const [transactionStatus, setTransactionStatus] = useState('');

  const handleDeposit = async (data: { address: string, amount: string }) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to: 'ckETHBridgeContractAddress', // Replace with actual bridge address
        value: ethers.utils.parseEther(data.amount)
      });
      setTransactionStatus(\`Deposit successful: \${tx.hash}\`);
    } catch (error) {
      console.error(error);
      setTransactionStatus('Deposit failed');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold">ETH to ckETH Bridge</h1>
      
      {/* Deposit Form */}
      <form onSubmit={handleSubmit(handleDeposit)} className="mt-4">
        <input
          {...register('address')}
          placeholder="Enter Ethereum address"
          className="p-2 border"
        />
        <input
          {...register('amount')}
          placeholder="Enter amount to deposit"
          className="p-2 border mt-2"
        />
        <button type="submit" className="mt-4 bg-green-500 text-white p-2 rounded">
          Deposit ETH
        </button>
      </form>

      {/* Transaction Status */}
      <p className="mt-4 text-blue-500">{transactionStatus}</p>
    </div>
  );
}
EOL

# Step 15: Run npm audit fix after everything is installed
echo "Automatically fixing vulnerabilities..."
npm audit fix || { echo "npm audit fix failed"; exit 1; }

# Step 16: Force fix vulnerabilities if necessary
echo "Force fixing unresolved vulnerabilities (use with caution)..."
npm audit fix --force || { echo "npm audit fix --force failed"; exit 1; }

# Step 17: Run the development server
echo "Starting Next.js development server..."
npm run dev || { echo "Failed to start Next.js server"; exit 1; }

echo "Project setup complete!"
