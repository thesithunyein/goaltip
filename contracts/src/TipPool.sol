// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * GoalTip TipPool — per-room USDt escrow for watch-party tips (Sepolia).
 *
 * Host deploys one TipPool when creating a shared room (constructor sets host).
 * Fans tip via tip(nationId, amount) which pull-transfers USDt and emits Tip.
 * Plain ERC-20 transfer into the pool still works (legacy); tip() is preferred.
 * Host calls settle(winnerNationId) to lock the match and receive escrowed USDt.
 */
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract TipPool {
    /// Aave v3 Sepolia test USDT (6 decimals).
    address public constant USDT = 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0;

    address public immutable host;
    bool public settled;
    bytes32 public winnerNationId;
    uint256 public settledAmount;

    event Tip(address indexed from, bytes32 indexed nationId, uint256 amount);
    event Settled(address indexed host, bytes32 indexed winnerNationId, uint256 amount);

    error NotHost();
    error AlreadySettled();
    error TransferFailed();
    error ZeroAmount();

    constructor() {
        host = msg.sender;
    }

    /// Preferred tip path: pulls USDt and tags the nation on-chain.
    function tip(bytes32 nationId, uint256 amount) external {
        if (settled) revert AlreadySettled();
        if (amount == 0) revert ZeroAmount();
        bool ok = IERC20(USDT).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
        emit Tip(msg.sender, nationId, amount);
    }

    function settle(bytes32 winnerNationId_) external {
        if (msg.sender != host) revert NotHost();
        if (settled) revert AlreadySettled();

        settled = true;
        winnerNationId = winnerNationId_;

        uint256 bal = IERC20(USDT).balanceOf(address(this));
        settledAmount = bal;
        if (bal > 0) {
            bool ok = IERC20(USDT).transfer(host, bal);
            if (!ok) revert TransferFailed();
        }

        emit Settled(host, winnerNationId_, bal);
    }
}
