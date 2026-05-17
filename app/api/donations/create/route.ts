import { NextRequest, NextResponse } from 'next/server';
import {
  createDonationTransaction,
  getWalletBalance,
  requestDevnetSol,
} from '@/lib/solana-donation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderAddress, amount, charityAddress, charityName, charityId } =
      body;

    if (!senderAddress || !amount || !charityAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check wallet balance
    const balance = await getWalletBalance(senderAddress);

    if (balance < amount) {
      // Request airdrop if insufficient funds
      try {
        await requestDevnetSol(senderAddress);
      } catch (error) {
        console.error('Airdrop failed:', error);
      }
    }

    // Create the transaction
    const transaction = await createDonationTransaction({
      sender: senderAddress,
      recipient: charityAddress,
      amount,
      charityName: charityName || 'Unknown Charity',
      charityId: charityId || 'unknown',
    });

    // Convert transaction to base64 for frontend to sign
    const serialized = transaction.serialize({ requireAllSignatures: false });
    const transactionBase64 = serialized.toString('base64');

    return NextResponse.json({
      success: true,
      transaction: transactionBase64,
      balance,
      amount,
      charityName,
      message: 'Transaction ready to sign',
    });
  } catch (error) {
    console.error('Donation creation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create donation',
      },
      { status: 500 }
    );
  }
}
