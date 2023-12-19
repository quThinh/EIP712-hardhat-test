//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract EIP712_Example is Initializable, UUPSUpgradeable, EIP712Upgradeable {
    /// @dev For this contract it should always be keccak256("Ticket(string eventName,uint256 price,address signedBy)")
    /// @dev but we are assigning the value in the constructor for the sake of learning

    function initialize(
        string memory domainName,
        string memory signatureVersion
    ) external initializer {
        EIP712Upgradeable.__EIP712_init(domainName, signatureVersion);
    }

    function _authorizeUpgrade(address newImplementation) internal override {}

    struct ClaimRequest {
        string requestId; // An ID for the staking reward claim request
        address beneficiary; // The address of the beneficiary of the staking reward
        address stakeToken; // The address of the stake token of the staking pool
        uint256 claimAmount; // The amount of reward tokens to be claimed
    }

    function getSigner(
        string calldata _requestId,
        address _beneficiary,
        address _stakeToken,
        uint256 _claimAmount,
        bytes memory _signature
    ) public view returns (address) {
        ClaimRequest memory claimRequest = ClaimRequest(
            _requestId,
            _beneficiary,
            _stakeToken,
            _claimAmount
        );
        address signer = verifyClaimRequest(claimRequest, _signature);
        return signer;
    }

    function getDomainSeperator() public view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Verify the staking reward claim or the cancellation claim request with signature
     *
     * @param _claimRequest An ID for the staking reward claim or the cancelation claim
     * @param _signature The signature to validate the claim
     */
    function verifyClaimRequest(
        ClaimRequest memory _claimRequest,
        bytes memory _signature
    ) internal view returns (address) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "ClaimRequest(string requestId,address beneficiary,address stakeToken,uint256 claimAmount)"
                    ),
                    keccak256(bytes(_claimRequest.requestId)),
                    _claimRequest.beneficiary,
                    _claimRequest.stakeToken,
                    _claimRequest.claimAmount
                )
            )
        );
        return ECDSA.recover(digest, _signature);
    }

}
