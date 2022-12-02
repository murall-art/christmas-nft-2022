// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ERC1155WithTransferAmountTracking.sol";

contract ChristmasCardErc1155 is
    ERC1155WithTransferAmountTracking,
    Ownable,
    AccessControl
{
    bytes32 private constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");

    using SafeMath for uint256;
    using ERC165Checker for address;

    address[] public fundingTokens;
    address public donationAddress;
    uint256 public dollarFundingAmount;
    /** @dev Checks if sender address has admin role
     */
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Does not have admin role");
        _;
    }

    /** @dev Checks if sender address has minter role
     */
    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, msg.sender), "Does not have minter role");
        _;
    }

    constructor(
        string memory uri,
        address[] memory _fundingTokens,
        address[] memory admins,
        address _donationAddress,
        uint256 _dollarFundingAmount
    ) ERC1155WithTransferAmountTracking(uri) {
        for (uint256 i = 0; i < admins.length; ++i) {
            _setupRole(ADMIN_ROLE, admins[i]);
        }
        for (uint256 i = 0; i < admins.length; ++i) {
            _setupRole(MINTER_ROLE, admins[i]);
        }
        donationAddress = _donationAddress;
        dollarFundingAmount = _dollarFundingAmount;

        // loop through and check if funding tokens are erc20 using erc165
        for (uint256 i = 0; i < _fundingTokens.length; ++i) {
            if (_fundingTokens[i].supportsInterface(type(IERC20).interfaceId)) {
                fundingTokens.push(_fundingTokens[i]);
            }
        }
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(AccessControl, ERC1155WithTransferAmountTracking)
        returns (bool)
    {
        return
            interfaceId == type(IAccessControl).interfaceId ||
            interfaceId == type(IERC1155).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function mint(address _to, uint256 _id, uint256 _amount) public onlyMinter {
        _mint(_to, _id, _amount, "");
    }

    function mintBatch(
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts
    ) public onlyMinter {
        _mintBatch(_to, _ids, _amounts, "");
    }

    function mintMultiple(
        address[] memory _to,
        uint256[] memory _ids,
        uint256[] memory _amounts
    ) public onlyMinter {
        require(
            _ids.length == _amounts.length,
            "ERC1155: ids and amounts length mismatch"
        );
        require(
            _to.length == _amounts.length,
            "ERC1155: addresses and amounts length mismatch"
        );
        for (uint256 i = 0; i < _ids.length; i++) {
            _mint(_to[i], _ids[i], _amounts[i], "");
        }
    }

    function setURI(string memory newuri) public onlyAdmin {
        _setURI(newuri);
    }

    function _afterSafeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        uint256 totalAmount,
        bytes memory data
    ) internal virtual override {
        uint256 dollarsToTransfer = totalAmount.mul(dollarFundingAmount);
        donateErc20IfAllowed(msg.sender, dollarsToTransfer);
    }

    function donateErc20IfAllowed(
        address from,
        uint256 amountInDollars
    ) public {
        // loop through funding tokens and attempt to donate

        for (uint256 i = 0; i < fundingTokens.length; ++i) {
            IERC20 token = IERC20(fundingTokens[i]);
            uint256 tokenDecimals = 18;
            if (
                fundingTokens[i].supportsInterface(
                    type(IERC20Metadata).interfaceId
                )
            ) {
                tokenDecimals = IERC20Metadata(fundingTokens[i]).decimals();
            }
            uint256 dollarAmountCorrectedToDp = amountInDollars.mul(
                10 ** tokenDecimals
            );

            // check allowance and if it is less than the amount to transfer, use the allowance
            uint256 allowance = token.allowance(from, address(this));
            if (allowance > 0) {
                if (allowance < dollarAmountCorrectedToDp) {
                    token.transferFrom(msg.sender, donationAddress, allowance);
                    break;
                } else {
                    token.transferFrom(
                        msg.sender,
                        donationAddress,
                        dollarAmountCorrectedToDp
                    );
                    break;
                }
            }
        }
    }
}
