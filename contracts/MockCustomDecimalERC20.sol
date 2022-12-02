pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCustomDecimalERC20 is ERC20 {

    uint8 private _customDecimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 _supply,
        uint8 _decimals
    ) public ERC20(name, symbol) {
        _customDecimals = _decimals;
        _mint(msg.sender, _supply * (10**uint256(_decimals)));
    }

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return _customDecimals;
    }
}