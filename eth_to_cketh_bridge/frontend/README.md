# Ethereum to ckETH Bridge

## Overview
The Ethereum to ckETH Bridge is a decentralized application that facilitates the transfer of Ethereum (ETH) to ckETH, a wrapped version of ETH on the Internet Computer Protocol (ICP). This project aims to create a seamless bridge between Ethereum and ICP, allowing users to deposit ETH and withdraw ckETH through a user-friendly interface.

## Technologies Used
- **Frontend**: 
  - Next.js
  - Tailwind CSS
  - TypeScript
  - Ethers.js for Ethereum interactions
  - @dfinity/agent for ICP integration

- **Smart Contracts**:
  - OpenZeppelin for secure contract implementations
  - Hardhat for Ethereum contract development and testing
  - Motoko for developing canisters on the Internet Computer

## Features Implemented
- **Wallet Connections**: 
  - Users can connect their Ethereum wallets (e.g., MetaMask) to facilitate transactions.
  - Users can also connect to the Plug wallet for ICP transactions.

- **Deposit Functionality**:
  - Successfully implemented ETH deposits to a placeholder bridge contract.
  - Users can specify the amount of ETH to deposit.

- **Withdrawal Functionality**:
  - Initiated the process to withdraw ckETH from the bridge.
  - Currently, a placeholder for the ICP canister is used, and error handling for withdrawal has been set up.

## Current Issues
- **Withdrawal Method Not Found**: The current implementation faces an issue where the withdrawal call to the ICP canister fails due to a missing update method. This will be resolved by implementing the appropriate canister smart contract.

## Next Steps
1. **Smart Contract Development**:
   - Develop the Ethereum smart contract to handle deposits and manage wrapped tokens.
   - Implement the ICP canister smart contract for handling withdrawals of ckETH.

2. **Integration and Testing**:
   - Integrate the smart contracts with the frontend.
   - Conduct thorough testing on both Ethereum and ICP networks to ensure functionality and security.

3. **User Interface Enhancements**:
   - Improve the user interface to provide better user feedback and interactions.
   - Implement transaction history and loading states for better user experience.

4. **Documentation and Deployment**:
   - Write comprehensive documentation for both the smart contracts and the frontend application.
   - Deploy the contracts to the respective networks and update the frontend with live contract addresses.

## Contributing
Contributions are welcome! If you have suggestions or improvements, feel free to create an issue or submit a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.
