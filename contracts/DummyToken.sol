//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20, Ownable {
    constructor(address _funder1, address _funder2) ERC20("TEST", "TEST") {
        uint256 SUPPLY = 2000000 * 10**decimals();
        _mint(_funder1, SUPPLY / 2);
        _mint(_funder2, SUPPLY / 2);
        //_mint(msg.sender, SUPPLY - (SUPPLY / 10));
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        console.log("REENTRANT INCOMING TransfeFrom!");
        (bool success, bytes memory returnedData) = address(msg.sender).call{
            value: 0
        }(
            abi.encodeWithSignature(
                "launchSchedule(address,uint256)",
                0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512,
                10000
            )
        );
        super.transferFrom(sender, recipient, amount);
        return true;
    }

    function transfer(address recipient, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        /*console.log("REENTRANT INCOMING Transfe!");
        (bool success, bytes memory returnedData) = address(msg.sender).call{
            value: 0
        }(
            /*
        bytes memory _signature,
        uint256 _totalAmountAllottedToClient,
        uint256 _maxRoundsForClient,
        uint256 _scheduleCurrentRound,
        address _assetAddress,
        address _funderAddress,
        uint256 _blockNumber
             
            abi.encodeWithSignature(
                "claim(bytes memory,uint256,uint256,uint256,address,address,uint256)",
                0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512,
                10000
            )
        );*/
        super.transfer(recipient, amount);
        return true;
    }
}
