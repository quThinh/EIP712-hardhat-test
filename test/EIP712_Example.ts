import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { signTypedData } from "../helpers/EIP712";
import { EIP712Domain, EIP712TypeDefinition } from "../helpers/EIP712.types";
import { Signer, Wallet } from 'ethers';
const hre = require("hardhat");
describe("EIP712_Example", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {

    // Contracts are deployed using the first signer/account by default
    const [otherAccount] = await ethers.getSigners();
    const EIP712_Example = await ethers.getContractFactory("EIP712_Example");

    // Create an EIP712 domainSeparator 
    // https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator
    const domainName = "INDEX_STAKING"  // the user readable name of signing domain, i.e. the name of the DApp or the protocol.
    const signatureVersion = "1" // the current major version of the signing domain. Signatures from different versions are not compatible.
    const chainId = 80001 // the EIP-155 chain id. The user-agent should refuse signing if it does not match the currently active chain.
    // The typeHash is designed to turn into a compile time constant in Solidity. For example:
    // bytes32 constant MAIL_TYPEHASH = keccak256("Mail(address from,address to,string contents)");
    // https://eips.ethereum.org/EIPS/eip-712#rationale-for-typehash
    const typeHash = "ClaimRequest(string requestId,address beneficiary,address stakeToken,uint256 claimAmount)"
    const argumentTypeHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(typeHash)); // convert to byteslike, then hash it 

    // https://eips.ethereum.org/EIPS/eip-712#specification-of-the-eth_signtypeddata-json-rpc
    const types: EIP712TypeDefinition = {
      ClaimRequest: [
        { name: 'requestId', type: 'string' },
        { name: 'beneficiary', type: 'address' },
        { name: 'stakeToken', type: 'address' },
        { name: 'claimAmount', type: 'uint256' },
      ]
    }
    // get an instance of the contract
    const contract = await EIP712_Example.deploy();
    await contract.initialize(domainName, signatureVersion);


    const domain: EIP712Domain = {
      name: domainName,
      version: signatureVersion,
      chainId: chainId,
      verifyingContract: "0xD817395E464BB1A60fE802A21A3E0De509171fA4"
    }

    return { contract, otherAccount, domain, types };
  }

  describe("Signing data", function () {

    it("Should verify that a ticket has been signed by the proper address", async function () {
      const { contract, domain, types } = await loadFixture(deployFixture);
      const provider = hre.ethers.provider;
      const signer_wallet = new Wallet("0x68e3ae826d9130f5b9415da1079dd3cae525baa6d73961a96f4d7547d86d448d");
      console.log(signer_wallet.address);
      const signer = await signer_wallet.connect(provider);
      const ClaimRequest = {
        requestId: "12112",
        beneficiary: "0x6be175D77B1B3f353f65A2E0648E0dDdD3090726",
        stakeToken: "0x0B84acc09875F7a311fC8CeABaCe3eC9553Ed821",
        claimAmount: "13475000000000000000000"
      }

      const signature = await signTypedData(domain, types, ClaimRequest, signer);
      console.log(signature);
      console.log(await contract.getSigner(ClaimRequest.requestId, ClaimRequest.beneficiary, ClaimRequest.stakeToken, ClaimRequest.claimAmount, signature));
    });

  });
});
