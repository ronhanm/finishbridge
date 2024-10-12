// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EthToCkEthBridge {
    address public owner;

    // Events for deposit and withdrawal
    event Deposit(address indexed user, uint256 amount, bytes32 icPrincipal);
    event Withdrawal(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender; // Set the owner to the deployer address
    }

    // Deposit function
    function deposit(bytes32 icPrincipal) external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        emit Deposit(msg.sender, msg.value, icPrincipal);
    }

    // Withdrawal function (authorized by the ICP canister)
    function withdraw(address user, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient contract balance");
        payable(user).transfer(amount);
        emit Withdrawal(user, amount);
    }

    // Reject direct ETH transfers not using the deposit function
    receive() external payable {
        revert("Use the deposit function");
    }

    fallback() external payable {
        revert("Function does not exist");
    }
}
