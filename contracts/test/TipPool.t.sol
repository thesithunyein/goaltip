// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TipPool} from "../src/TipPool.sol";

contract MockUSDT {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "bal");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "bal");
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "allow");
        allowance[from][msg.sender] = allowed - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// TipPool hardcodes Sepolia Aave USDT — etch a mock at that address in tests.
contract TipPoolTest is Test {
    address constant USDT = 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0;
    TipPool pool;
    address host;
    address fan;

    function setUp() public {
        host = makeAddr("host");
        fan = makeAddr("fan");
        MockUSDT impl = new MockUSDT();
        vm.etch(USDT, address(impl).code);
        vm.prank(host);
        pool = new TipPool();
        MockUSDT(USDT).mint(fan, 100_000_000);
    }

    function test_tip_and_settle() public {
        bytes32 nation = bytes32("mm");
        vm.startPrank(fan);
        MockUSDT(USDT).approve(address(pool), 5_000_000);
        pool.tip(nation, 5_000_000);
        vm.stopPrank();

        assertEq(MockUSDT(USDT).balanceOf(address(pool)), 5_000_000);

        vm.prank(host);
        pool.settle(nation);

        assertTrue(pool.settled());
        assertEq(pool.winnerNationId(), nation);
        assertEq(pool.settledAmount(), 5_000_000);
        assertEq(MockUSDT(USDT).balanceOf(host), 5_000_000);
        assertEq(MockUSDT(USDT).balanceOf(address(pool)), 0);
    }

    function test_non_host_cannot_settle() public {
        vm.prank(fan);
        vm.expectRevert(TipPool.NotHost.selector);
        pool.settle(bytes32("br"));
    }
}
