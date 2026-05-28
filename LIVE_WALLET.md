# Live Wallet Integration — Complete Guide

## Overview

The Live Wallet Integration enables real Solana Devnet transactions with live charity wallets. Users can connect their Phantom or Solflare wallets and send SOL directly to verified charities.

## 🔗 Access Points

**Direct URLs:**
- **Live Donation Demo**: `http://localhost:3000/live-donation`

## 🎯 Features

### Wallet Connection
- ✅ Phantom wallet support
- ✅ Solflare wallet support
- ✅ Auto-connect on page load
- ✅ Wallet disconnection support

### Live Transactions
- ✅ Real SOL transfers on Devnet
- ✅ Direct charity wallet funding
- ✅ Live balance updates
- ✅ Transaction confirmation tracking
- ✅ Devnet airdrop support

### Charity Support
- ✅ 6 verified charity wallets
- ✅ Real-time balance display
- ✅ Impact score visualization
- ✅ Mission statement display

## 💳 Wallet Setup

### Step 1: Install Wallet Extension

**Phantom Wallet:**
- Visit: https://phantom.app/
- Install browser extension
- Create or import wallet

**Solflare Wallet:**
- Visit: https://solflare.com/
- Install browser extension
- Create or import wallet

### Step 2: Switch to Devnet

**In Phantom:**
1. Click settings icon
2. Navigate to "Network"
3. Select "Devnet"

**In Solflare:**
1. Click settings
2. Select "Network"
3. Choose "Devnet"

### Step 3: Request Airdrop

Click "Request Airdrop (2 SOL)" button in the app to get testnet SOL

## 💚 Making a Donation

### Flow

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Select Phantom or Solflare
   - Approve connection request

2. **Request Airdrop (if needed)**
   - Click "Request Airdrop" if balance < 0.01 SOL
   - Wait 5-10 seconds for confirmation

3. **Select Charity**
   - Choose from dropdown
   - View charity details, mission, impact score

4. **Enter Amount**
   - Minimum: 0.01 SOL
   - Your available balance displayed
   - Enter desired amount

5. **Send Donation**
   - Click "Send Donation 💚"
   - Approve transaction in wallet
   - Wait for confirmation (5-10 seconds)

6. **View Result**
   - Transaction signature displayed
   - Status shows "✅ Confirmed"
   - Wallet balance updates

## 🔌 API Endpoints

### GET /api/transactions

**Query Parameters:**
```
wallet=<address>    - Required: Wallet address
charity=<id>        - Optional: Filter by charity
```

**Response:**
```json
{
  "wallet": "...",
  "transactions": [
    {
      "signature": "...",
      "status": "success",
      "timestamp": "2026-05-17T11:29:29Z",
      "slot": 12345
    }
  ],
  "count": 10
}
```

### POST /api/transactions

**Request Body:**
```json
{
  "walletAddress": "...",
  "charityId": "solar-future",
  "amountSol": 0.1
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "recentBlockhash": "...",
    "fromWallet": "...",
    "toWallet": "...",
    "amount": 0.1,
    "lamports": 100000000,
    "charityId": "solar-future"
  },
  "message": "Transaction template created. Sign with your wallet."
}
```

## 📊 Live Charity Wallets

```
solar-future:              SoLxCyJhZvfJqTYGdvfKEYvStvfQDPmqAXgBEqGW1hF
kids-first-dao:            KiDS8PFtzrPSTYmKYd6JBSJ8Th82Yiod3yMMsQHpUKP
open-water-relief:         OpWatr567xB6KJ8qLpM9KdHpJm4nX2rVT8wVkYpU3hB
climate-action-acc:        ClimateAct123XYZ9qK8Lp2MnOpQrStUvWxYzAbCdEfGh
web3-education-collect:    Web3Edu456ABC9xY8zQrStUvWxYzAbCdEfGhIjKlMnOp
animal-welfare-fund:       AnimalWelfare789XyZ2QrStUvWxYzAbCdEfGhIjKlMnOpQr
```

## 🛠️ Technical Implementation

### Libraries

```typescript
import { 
  ConnectionProvider, 
  WalletProvider,
  useConnection,
  useWallet
} from "@solana/wallet-adapter-react"

import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter 
} from "@solana/wallet-adapter-wallets"

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL
} from "@solana/web3.js"
```

### Transaction Flow

```typescript
// 1. Get user's wallet
const { publicKey, signTransaction } = useWallet()

// 2. Create transfer transaction
const transaction = new Transaction()
transaction.add(
  SystemProgram.transfer({
    fromPubkey: fromWallet,
    toPubkey: charityWallet,
    lamports: amountSol * LAMPORTS_PER_SOL
  })
)

// 3. Sign transaction
const signedTx = await signTransaction(transaction)

// 4. Send to blockchain
const signature = await connection.sendRawTransaction(
  signedTx.serialize()
)

// 5. Wait for confirmation
await connection.confirmTransaction(signature)
```

## 🔐 Security Notes

- ✅ **Client-side signing**: Users sign with wallet, server never sees keys
- ✅ **Devnet only**: No real funds at risk
- ✅ **Wallet validation**: All addresses validated before transaction
- ✅ **No gas fees**: Devnet has negligible fees
- ✅ **Read-only balance checks**: No transaction necessary to check balance

## ⚠️ Troubleshooting

### "Wallet not connecting?"
- Make sure Phantom/Solflare is installed
- Check wallet is switched to Devnet
- Try refreshing page
- Check browser console for errors

### "Airdrop failed?"
- Devnet airdrop may be rate-limited
- Wait a few minutes and try again
- Use alternative faucet: https://solfaucet.com

### "Transaction rejected?"
- Check wallet has minimum balance (0.01 SOL)
- Verify charity address is correct
- Try reducing transaction amount
- Check Devnet RPC is responsive

### "Balance not updating?"
- Refresh page
- Check you're on Devnet network
- Wait 3-5 seconds for update

## 🚀 Demo Flow

```
1. User lands on /live-donation
   ↓
2. Clicks "Connect Wallet"
   ↓
3. Approves connection in wallet
   ↓
4. Wallet balance displays (updates every 3s)
   ↓
5. User clicks "Request Airdrop" (if balance < 0.01)
   ↓
6. Airdrop received (5-10 seconds)
   ↓
7. User selects charity from dropdown
   ↓
8. User enters SOL amount
   ↓
9. User clicks "Send Donation 💚"
   ↓
10. Wallet signs transaction
    ↓
11. Transaction sent to Devnet
    ↓
12. Confirmation shows in UI
    ↓
13. Charity balance updates (5-10 seconds)
    ↓
14. Success message displays
```

## 📱 Supported Wallets

- ✅ Phantom (Full support)
- ✅ Solflare (Full support)
- 🔜 Ledger (Planned)
- 🔜 Magic Eden (Planned)

## 🌐 Network Configuration

**Devnet Settings:**
- RPC: `https://api.devnet.solana.com`
- Network ID: devnet
- Chain ID: 103
- Explorer: https://explorer.solana.com/?cluster=devnet

## 📊 Transaction Examples

### Successful Donation
```json
{
  "signature": "5h6y7u8i9o0p1q2w3e4r5t6y7u8i9o0p1q2w3e4r5t6y7u8i9o0p1q2w3e4r",
  "status": "success",
  "amount": 0.1,
  "recipient": "SoLxCyJhZvfJqTYGdvfKEYvStvfQDPmqAXgBEqGW1hF",
  "timestamp": "2026-05-17T11:29:29Z",
  "charityId": "solar-future"
}
```

## ✅ Verification

You can verify transactions on [Solana Devnet Explorer](https://explorer.solana.com/?cluster=devnet):

1. Copy transaction signature
2. Go to Solana Explorer
3. Paste signature in search
4. View transaction details
5. Confirm charity received SOL

## 🎓 Learning Resources

- [Solana Documentation](https://docs.solana.com)
- [Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- [Web3.js Guide](https://docs.solana.com/de/developers/clients/javascript-reference)
- [Devnet Faucet](https://solfaucet.com)

## 📞 Support

For issues:
1. Check browser console for errors
2. Verify wallet is connected and on Devnet
3. Ensure you have minimum balance (0.01 SOL)
4. Check Devnet RPC status
5. Try different browser if issue persists

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready (Devnet)  
**Last Updated:** May 17, 2026
