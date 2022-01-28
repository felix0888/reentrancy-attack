# Reentrancy Attack

Smart Contract Security Practice | Lv10 Re-entrancy Attack
```
!!! DON'T TRY ON MAINNET !!!
```

## Summary
The goal of this level is for you to steal all the funds from the contract.

### Things that might help:
- Untrusted contracts can execute code where you least expect it
- Another usage of fallback
- Throw/revert bubbling
- Sometimes the best way to attack a contract is with another contract

### What you will learn:
- Re-entrancy
- How to prevent it?

## Smart Contract Code
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import '@openzeppelin/contracts/math/SafeMath.sol';

contract Reentrance {
  
  using SafeMath for uint256;
  mapping(address => uint) public balances;

  function donate(address _to) public payable {
    balances[_to] = balances[_to].add(msg.value);
  }

  function balanceOf(address _who) public view returns (uint balance) {
    return balances[_who];
  }

  function withdraw(uint _amount) public {
    if(balances[msg.sender] >= _amount) {
      (bool result,) = msg.sender.call{value:_amount}("");
      if(result) {
        _amount;
      }
      balances[msg.sender] -= _amount;
    }
  }

  receive() external payable {}
}
```

## Solidity Concepts & Knowledge
- `call` vs `send` vs `transfer`  
  There are three ways to send ether to an address, `call`, `transfer` and `send`.
  - `call`: `addr.call{value: amountInUint("")}` - returns success condition and return data, forwards all available gas, adjustable.
  - `transfer`: `<address payable>.transfer(uint256 amount)` - reverts on failure, forwards 2300 gas stipend, not adjustable.
  - `send`: `<address payable>.send(uint256 amount) returns (bool)` - returns false on failure, forwards 2300 gas stipend, not adjustable
  
  Two other ways send Ether to an address are using `selfdestruct` and contract desinated as recipient for mining rewards.

- `Reenter` is calling back the contract that initiated the transaction and execute the same function again.

- `DAO` and `DAO Attack`
  The DAO(Decentralized Autonomous Organization) launched in 2016 on the Ethereum blockchain raised $150M USD worth of ETH through a token sale.
  Then the DAO was hacked due to vulnerabilities in its code base. The Ethereum blockchain was eventually hard forked to restore the stolen funds, but not all parties agreed with this decision which resulted in the network splitting into two distinct blockchains: Ethereum and Ethereum Classic.
  You can get more information [here](https://www.gemini.com/cryptopedia/the-dao-hack-makerdao).
  
  The above smart contract has such vulnerability as DAO had in the past.

## Security Consideration
### Security risk in the contract
The security pitfall the contract has is that it transfer Ether to the `msg.sender` before updating its balance.
We already have seen the internal transaction which is triggered inside the blockchain, it transfer Ether to the `msg.sender` by using `call`.
If the `msg.sender` is a malicious contract the hacker may be able to try reenter on its `fallback(receive)` function before its balance is updated because the internal transaction holds the next code block until it's completed.
As a result it can call `withdraw` function until the transfer using `call` is failed(when the contract's balance is smaller than the amount required).

The other problem the contract has is that it doesn't treat the underflow here `balances[msg.sender] -= _amount;`, hacker's balance won't be zero.

### How can we improve the contract
- We can reduce the balance of `msg.sender` before sending Ether so that it doesn't send Ether on reenter(CEI pattern explained later).
- We can introduce reentrancy guard variable(`bool locked`, for example) and lock the withdraw function until it finishes to execute.
- It's understood that using `transfer` instead of `call` is better way to prevent reentrancy, but it's not now. It's because gas costs are subject to change([EIP 1884](https://eips.ethereum.org/EIPS/eip-1884))..
  > Smart contracts should not depend on gas costs as it can potentially break the contracts.
  
  `transfer` depends on gas costs (forwards 2300 gas stipend, not adjustable), therefore it's no longer recommended: [Consensys](https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/), [Openzeppelin](https://forum.openzeppelin.com/t/reentrancy-after-istanbul/1742) say.
  If we use `call` instead, as it forwards all the gas, execution of smart contracts won't break.
  But it doesn't limit gas anymore to prevent ourselves from errors caused by running out of gas, we are then exposed to re-entrancy attacks.
  
  As well, we have to use `SafeMath` or higher version of Solidity(^0.8.0) to prevent the underflow on balance decrease).
  
### What we can say
- Follow the CEI([Check Effect Interaction](https://solidity.readthedocs.io/en/v0.6.2/security-considerations.html#use-the-checks-effects-interactions-pattern)) pattern.
  - Perform checks
    - **Check** `msg.sender`, `msg.value` and other conditions.
    - If all the checks are passed, perform **Effects** to state variables.(Like decreasing balance).
    - **Interact** with other contracts or addresses: sending Ether, calling other contract's function
    
- Use re-entrancy guard: a modifier that checks for the value of a locked bool. [OpenZeppelin's ReentrancyGuard](https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard) also works that way.

## Deploy & Test
### Installation
```console
npm install
npx hardhat node
```

### Deployment
```console
npx hardhat run --network [NETWORK-NAME] scripts/deploy.js
```

### Test
You have to see all the funds on `Reentrancy` contract are transfered to `ReentrancyAttack` contract.
```console
npx hardhat test


  Reentrance
    #donate, #balanceOf
      ✓ should set the balance, return balance for given address (147ms)
    #withdraw
      ✓ should do nothing if one tries to withdraw amount more than balance (63ms)
      ✓ should transfer amount and update balance if amount is less than balance (39ms)

  ReentrancyAttack
    ✓ should transfer all the funds on Reentrance to ReentrancyAttack (190ms)
    deployment
      ✓ should set the attacker
    #attack
      ✓ should be reverted if non-attacker tries (38ms)


  6 passing (1s)
  ```
  
  if you're familiar with hardhat console, you can test the `Reentrance` on your local node by using 
  
