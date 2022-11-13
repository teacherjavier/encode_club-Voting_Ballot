import { ethers, utils, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { Ballot__factory } from "../typechain-types";
import { env } from "process";

dotenv.config();

const PROPOSALS = ["Rock", "Paper", "Scissors"];
let bytes32Array: any[] = [];

function convertStringArrayToBytes32() {
  PROPOSALS.forEach((proposal) => {
    bytes32Array.push(ethers.utils.formatBytes32String(proposal));
  });
  return bytes32Array;
}

async function main() {
  // CREATING PROVIDERS
  const provider = ethers.getDefaultProvider(
    "goerli",
    process.env.ALCHEMY_API_KEY
  );
  const provider2 = ethers.getDefaultProvider(
    "goerli",
    process.env.ALCHEMY_API_KEY
  );
  const provider3 = ethers.getDefaultProvider(
    "goerli",
    process.env.INFURA_API_KEY
  );
  // CREATING WALLETS
  const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC ?? "");
  const wallet2 = ethers.Wallet.fromMnemonic(process.env.MNEMONIC2 ?? "");
  const wallet3 = ethers.Wallet.fromMnemonic(process.env.MNEMONIC3 ?? "");
  
  // CHECK WALLET BALANCES
  console.log(`Using address ${wallet.address}`);
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enouth ether");
  }

  console.log(`Using address ${wallet2}`);
  const signer2 = wallet2.connect(provider2);
  const balanceBN2 = await signer2.getBalance();
  const balance2 = Number(ethers.utils.formatEther(balanceBN2));
  console.log(`Wallet2 balance ${balance2}`);
  if (balance2 < 0.01) {
    throw new Error("Not enouth ether");
  }

  console.log(`Using address ${wallet3.address}`);
  const signer3 = wallet3.connect(provider3);
  const balanceBN3 = await signer3.getBalance();
  const balance3 = Number(ethers.utils.formatEther(balanceBN3));
  console.log(`Wallet3 balance ${balance3}`);
  if (balance3 < 0.01) {
    throw new Error("Not enouth ether");
  }
  //============================================
  //DEPLOYING BALLOT CONTRACT
  console.log("Deploying Ballot contract");
  console.log("Proposals: ");
  PROPOSALS.forEach((element, index) => {
    console.log(`Proposal N. ${index + 1}: ${element}`);
  });
  const ballotFactory = new Ballot__factory(signer);
  const ballotContract = await ballotFactory.deploy(
    convertStringArrayToBytes32()
  );
  await ballotContract.deployed();
  for (let index = 0; index < PROPOSALS.length; index++) {
    const proposal = await ballotContract.proposals(index);
    const name = ethers.utils.parseBytes32String(proposal.name);
    const VoteCounter =  Number(ethers.utils.formatEther(proposal.voteCount));
    console.log({ index, name, VoteCounter });
  }

  //CHAIRPERSON
  const chairperson = await ballotContract.chairperson();
  console.log({ chairperson });

  // GIVING RIGHT TO VOTE
  console.log("Giving right to vote to signer2");
  const giveRightToVoterTx = await ballotContract.giveRightToVote(
    signer2.address
  );
  const giveRightToVoterTxReceipt2 = await giveRightToVoterTx.wait();
  console.log(giveRightToVoterTxReceipt2);
  console.log("Giving rights to vote to signer3");
  const giveRightToVoteTx3 = await ballotContract.giveRightToVote(
    signer3.address
  );
  const giveRightToVoterTxReceipt3 = await giveRightToVoteTx3.wait();
  console.log(giveRightToVoterTxReceipt3);

  // DALEGATE
  console.log("Delegating Votes signer2 to signer3");
  const delegateTx = await ballotContract
    .connect(signer2)
    .delegate(signer3.address);
  const delegateTxReceipt = await delegateTx.wait();
  console.log({ delegateTxReceipt });

  //  VOTE
  console.log("Using selected Voter to cast a vote for proposal 0");
  const castVoteTx = await ballotContract.connect(signer3).vote(0);
  const castVoteTxReceipt = await castVoteTx.wait();
  console.log({ castVoteTxReceipt });
  const proposal = await ballotContract.proposals(0);
  const name = ethers.utils.parseBytes32String(proposal.name);
  console.log({ index: 0, name, proposal });

  const winningProposal = await ballotContract.winningProposal();
  console.log({ winningProposal });

  const winner_Name = await ballotContract.winnerName();
  console.log({ winner_Name });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
