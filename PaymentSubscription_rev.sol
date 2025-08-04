// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentSubscription {
    address public owner;

    event Subscribed(address indexed user, address indexed provider, uint256 amount, uint256 timestamp, bytes metadata);
    event Cancelled(address indexed user, uint256 amount);
    event Claimed(address indexed provider, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    // Accept ETH and emit metadata to track off-chain
    function subscribe(address provider, bytes calldata metadata) external payable {
        require(msg.value > 0, "No payment sent");
        emit Subscribed(msg.sender, provider, msg.value, block.timestamp, metadata);
    }

    // Cancel (requires off-chain validation), access control through off-chain backend API
    function cancel(address user, uint256 amount) external {
        // TODO: add access control or signature verification
        payable(user).transfer(amount);
        emit Cancelled(user, amount);
    }

    // Claim (requires off-chain validation), access control through off-chain backend API
    function claim(address provider, uint256 amount) external {
        payable(provider).transfer(amount);
        emit Claimed(provider, amount);
    }
}