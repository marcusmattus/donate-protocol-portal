import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

const DEVNET_CONNECTION = new Connection(
  'https://api.devnet.solana.com',
  'confirmed'
);

export interface DonationTransaction {
  sender: string;
  recipient: string;
  amount: number; // in SOL
  charityName: string;
  charityId: string;
}

export async function createDonationTransaction(
  data: DonationTransaction
): Promise<Transaction> {
  const senderPublicKey = new PublicKey(data.sender);
  const recipientPublicKey = new PublicKey(data.recipient);

  const lamports = data.amount * LAMPORTS_PER_SOL;

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: senderPublicKey,
      toPubkey: recipientPublicKey,
      lamports,
    })
  );

  const blockHash = await DEVNET_CONNECTION.getLatestBlockhash();
  transaction.recentBlockhash = blockHash.blockhash;
  transaction.feePayer = senderPublicKey;

  return transaction;
}

export async function sendDonationTransaction(
  signedTransaction: Transaction
): Promise<string> {
  const signature = await DEVNET_CONNECTION.sendRawTransaction(
    signedTransaction.serialize(),
    {
      skipPreflight: false,
      maxRetries: 5,
    }
  );

  await DEVNET_CONNECTION.confirmTransaction(signature, 'finalized');

  return signature;
}

export async function getTransactionStatus(signature: string) {
  const status = await DEVNET_CONNECTION.getSignatureStatus(signature);
  return status;
}

export async function getWalletBalance(address: string): Promise<number> {
  const publicKey = new PublicKey(address);
  const balance = await DEVNET_CONNECTION.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

export async function requestDevnetSol(address: string): Promise<string> {
  const publicKey = new PublicKey(address);
  const signature = await DEVNET_CONNECTION.requestAirdrop(
    publicKey,
    2 * LAMPORTS_PER_SOL
  );

  await DEVNET_CONNECTION.confirmTransaction(signature, 'finalized');

  return signature;
}
