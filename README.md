## Project Overview

This project is a **cross-chain bridge** that allows users to transfer assets between **Ethereum (ETH)** and **Internet Computer (ICP - ckETH)**. The bridge comprises a **frontend interface**, an **Ethereum smart contract**, an **ICP canister**, and a **backend service** that seamlessly coordinates asset transfers between the two blockchains.

---

## Technology Stack

### 1. **Frontend**
- **Tech Stack**: Built with **Next.js** and styled using **Tailwind CSS**.
- **Libraries**:
  - **ethers.js**: For interaction with Ethereum, connects to **MetaMask**.
  - **@dfinity/agent**: For interaction with ICP, connects to **Plug Wallet**.
- **Functionality**: Handles wallet connections (Ethereum and ICP), deposit/withdrawal interactions, and displays transaction statuses.

### 2. **Ethereum Smart Contract**
- **Language**: Written in **Solidity**.
- **Deployed on**: **Sepolia testnet**.
- **Functionality**: Manages ETH deposits/withdrawals, locks ETH during deposits, and handles the release of ETH upon withdrawals. It emits `Deposit` and `Withdrawal` events for backend processing.

### 3. **ICP Canister**
- **Language**: Written in **Motoko**.
- **Functionality**: Manages the minting of ckETH on ICP, processes deposits from Ethereum (ETH), and tracks user balances.

### 4. **Backend**
- **Tech Stack**: Built with **Node.js**.
- **Functionality**: Serves as the bridge between Ethereum and ICP. It listens to Ethereum deposit events and notifies the ICP canister to mint ckETH. Additionally, it handles ICP withdrawal requests and triggers ETH releases on Ethereum.

---

## Features

### 1. **Frontend**
- **User Interface**: Connects MetaMask (Ethereum) and Plug Wallet (ICP).
- **Deposit/Withdrawal**: Facilitates deposits of ETH on Ethereum and withdrawals of ckETH on ICP.
- **Transaction Statuses**: Real-time updates on deposit and withdrawal status.

### 2. **Ethereum Smart Contract**
- Deployed on **Sepolia testnet**, handling:
  - **ETH Deposits**: Locks ETH and emits a `Deposit` event.
  - **ETH Withdrawals**: Releases ETH upon valid withdrawal requests.
  - Events emitted help synchronize the bridge logic between the two networks.

### 3. **ICP Canister**
- Mints **ckETH** for users after receiving deposits from Ethereum.
- Logs and processes **withdrawal requests** by reducing user balances and coordinating with Ethereum to release ETH.

### 4. **Backend Service**
- Listens for **Ethereum Deposit Events**: Triggers minting of ckETH on ICP.
- Monitors **ICP Withdrawal Requests**: Calls the Ethereum smart contract to release ETH.

---

## Workflow

### 1. **Deposit ETH (Ethereum to ICP)**
1. User deposits ETH into the Ethereum smart contract.
2. The Ethereum contract locks the ETH and emits a `Deposit` event.
3. The backend listens for the event and notifies the ICP canister.
4. The ICP canister mints ckETH for the user’s account on ICP.

### 2. **Withdraw ckETH (ICP to Ethereum)**
1. User requests withdrawal of ckETH on ICP.
2. The ICP canister logs the request and holds the ckETH.
3. The backend detects the request and triggers the Ethereum smart contract to release ETH.
4. ETH is released to the user's Ethereum address, completing the transfer.

---

## Installation and Setup

### Prerequisites
- **Node.js**: Ensure Node.js is installed.
- **Ethereum Wallet**: Use MetaMask for connecting to Ethereum (Sepolia testnet).
- **ICP Wallet**: Use Plug Wallet for connecting to ICP.

### Steps to Run the Project

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ronhanm/finishbridge.git

   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file with the following:
   ```bash
   INFURA_API_KEY=your_infura_key
   CANISTER_ID=your_canister_id
   ```

4. **Run the frontend**:
   ```bash
   npm run dev
   ```

5. **Deploy the smart contract**:
   Use **Hardhat** to deploy the Solidity smart contract on Sepolia:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

6. **Run the backend service**:
   The backend listens to both Ethereum and ICP events.
   ```bash
   node backend/index.js
   ```

---

## Key Technologies

- **Next.js** (Frontend)
- **Tailwind CSS** (Styling)
- **ethers.js** (Ethereum interaction)
- **@dfinity/agent** (ICP interaction)
- **Solidity** (Ethereum smart contract)
- **Motoko** (ICP canister)
- **Node.js** (Backend service)

---

## Deployment

1. **Frontend**: Deployed using **Vercel** for Next.js applications.
2. **Smart Contract**: Deployed on **Sepolia testnet**.
3. **ICP Canister**: Deployed on the **ICP Mainnet**.

---

## Future Improvements

1. **Enhance Frontend**:
   - Add transaction history for both Ethereum and ICP transactions.
   - Improve error handling and add loading indicators during transactions.

2. **Backend**:
   - Synchronize transfers more efficiently by listening for pending withdrawal requests from the ICP canister and Ethereum deposits.

3. **Move to Mainnet**:
   - Migrate the Ethereum smart contract from Sepolia testnet to Ethereum Mainnet after thorough testing.

---

## Conclusion

This project provides a robust and secure solution for cross-chain asset transfers between **Ethereum (ETH)** and **ICP (ckETH)**. By leveraging a well-structured **frontend**, **Ethereum smart contract**, **ICP canister**, and **backend service**, users can seamlessly deposit and withdraw assets across these two blockchains.

