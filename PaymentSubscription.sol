// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentSubscription {
    address public owner;

    struct Subscription {
        address user; // user address
        address provider; // payment merchant address
        uint256 amount; // payment amount
        uint256 startTime; // start of subscription, by block timestamp
        uint256 duration; // in seconds
        bool isActive; // is it ongoing
        bool isClaimed; // has the provider claimed the payment
    }

    mapping(uint256 => Subscription) public subscriptions; // list of all subscriptions
    uint256 public subscriptionId; // index of subscriptions

    constructor() {
        owner = msg.sender;
    }

    modifier restricted() {
        require(msg.sender == owner, "Only owner is allowed to call function");
        _;
    }

    // event listeners
    event Subscribed(uint256 indexed subId, address indexed user, address provider, uint256 amount);
    event Cancelled(uint256 indexed subId);
    event Claimed(uint256 indexed subId);

    // subscribe to a service
    function subscribe(address _provider, uint256 _duration) external payable {
        require(msg.value > 0, "Invalid payment amount");

        // create a subscription struct and store in list
        subscriptions[subscriptionId] = Subscription({
            user: msg.sender,
            provider: _provider,
            amount: msg.value,
            startTime: block.timestamp,
            duration: _duration,
            isActive: true,
            isClaimed: false
        });

        // emit event
        emit Subscribed(subscriptionId, msg.sender, _provider, msg.value);
        subscriptionId++;
    }

    // cancelling subscription
    function cancel(uint256 _subId) external {
        Subscription storage subscription = subscriptions[_subId];

        // validity checks
        require(msg.sender == subscription.user, "Not the subscriber");
        require(subscription.isActive, "Subscription inactive");
        require(block.timestamp < subscription.startTime + subscription.duration, "Subscription expired");

        // refund and set subscription to inactive
        subscription.isActive = false;
        payable(subscription.user).transfer(subscription.amount);

        // emit event
        emit Cancelled(_subId);
    }

    // claim payment
    function claim(uint256 _subId) external {
        Subscription storage subscription = subscriptions[_subId];

        // validity checks
        require(msg.sender == subscription.provider, "Not the service provider");
        require(subscription.isActive, "Subscription nactive");
        require(!subscription.isClaimed, "Payment already claimed");
        require(block.timestamp >= subscription.startTime + subscription.duration, "Payment is not due");

        // send payment to service provider
        subscription.isActive = false;
        subscription.isClaimed = true;
        payable(subscription.provider).transfer(subscription.amount);

        // emit event
        emit Claimed(_subId);
    }

    // get list of active user subscriptions
    function getUserSubscriptions(address _user) external view returns (uint256[] memory) {
        
        uint256 count = 0;
        for (uint256 i = 0; i < subscriptionId; i++) {
            if (subscriptions[i].user == _user && subscriptions[i].isActive && block.timestamp < subscriptions[i].startTime + subscriptions[i].duration) {
               count++;
            }
        }
        
        uint256[] memory subs = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < subscriptionId; i++){
            if (subscriptions[i].user == _user && subscriptions[i].isActive && block.timestamp < subscriptions[i].startTime + subscriptions[i].duration){
                subs[index] = i;
                index++;
            }
        }

        return subs;
    }

    // get list of claimable payments
    function getClaimablePayments(address _provider) external view returns (uint256[] memory){

        uint256 count = 0;
        for (uint256 i = 0; i < subscriptionId; i++) {
            if (subscriptions[i].provider == _provider && subscriptions[i].isActive && !subscriptions[i].isClaimed && block.timestamp >= subscriptions[i].startTime + subscriptions[i].duration) {
               count++;
            }
        }

        uint256[] memory payments = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < subscriptionId; i++) {
            if (subscriptions[i].provider == _provider && subscriptions[i].isActive && !subscriptions[i].isClaimed && block.timestamp >= subscriptions[i].startTime + subscriptions[i].duration) {
               payments[index] = i;
               index++;
            }
        }

        return payments;
    }
}