const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();

// 🔑 Load environment variables
const { ALCHEMY_API_KEY, PRIVATE_KEY, BUBBLE_DATABASE_URL, BUBBLE_API_KEY } = process.env;

// ✅ Cek jika environment variables kosong
if (!ALCHEMY_API_KEY || !PRIVATE_KEY || !BUBBLE_DATABASE_URL || !BUBBLE_API_KEY) {
  console.error("❌ Error: Missing environment variables. Check your .env file!");
  process.exit(1);
}

// ⚡️ Connect to Alchemy's Arbitrum RPC
const provider = new ethers.JsonRpcProvider(`https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// 🔗 BONK Token Smart Contract
const BONK_TOKEN_ADDRESS = "0x09199d9A5F4448D0848e4395D065e1ad9c4a1F74";
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function decimals() view returns (uint8)"
];

let bonkContract;
try {
  bonkContract = new ethers.Contract(BONK_TOKEN_ADDRESS, ERC20_ABI, wallet);
} catch (error) {
  console.error("❌ Error initializing contract:", error);
  process.exit(1);
}

// 📡 Fetch recipients from Bubble.io database
async function fetchRecipients() {
  try {
    console.log("📡 Fetching recipients from Bubble.io...");
    const response = await axios.get(BUBBLE_DATABASE_URL, {
      headers: {
        "Authorization": `Bearer ${BUBBLE_API_KEY}`
      }
    });

    if (!response.data.response || !response.data.response.results) {
      console.error("❌ Error: Invalid response format from Bubble.io");
      return [];
    }

    return response.data.response.results;
  } catch (error) {
    console.error("❌ Error fetching recipients:", error.response?.data || error.message);
    return [];
  }
}

// 🔄 Function to update transaction hash in Bubble.io with retry
async function updateTransactionHash(recipientId, txHash, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Updating transaction hash for recipient ID ${recipientId}...`);

      await axios.patch(
        `${BUBBLE_DATABASE_URL}/${recipientId}`,
        { Hash: txHash },
        {
          headers: {
            "Authorization": `Bearer ${BUBBLE_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log(`✅ Hash updated for recipient ID ${recipientId}: ${txHash}`);
      return;
    } catch (error) {
      console.error(`❌ Error updating transaction hash (Attempt ${i + 1}):`, error.response?.data || error.message);
      await new Promise(res => setTimeout(res, 2000)); // Tunggu 2 detik sebelum retry
    }
  }
  console.error(`❌ Failed to update hash for recipient ID ${recipientId} after ${retries} retries.`);
}

// 🚀 Function to send tokens with hash check
async function sendMultiSend() {
  const recipients = await fetchRecipients();
  if (recipients.length === 0) {
    console.log("⚠️ Tidak ada penerima yang ditemukan.");
    return;
  }

  try {
    const decimals = await bonkContract.decimals();
    console.log(`🔢 BONK token decimals: ${decimals}`);

    for (const recipient of recipients) {
      const rawAmount = recipient['Profit'];
      const to = recipient['Wallet Address'];
      const recipientId = recipient.id || recipient._id || recipient.unique_id;
      const existingHash = recipient['Hash'];

      console.log("\n📊 Recipient Data:");
      console.log(`🔹 ID: ${recipientId}`);
      console.log(`🔹 Wallet: ${to}`);
      console.log(`🔹 Profit: ${rawAmount}`);
      console.log(`🔹 Existing Hash: '${existingHash}'`);

      if (!recipientId) {
        console.error(`❌ Error: Recipient ID not found for ${to}. Skipping...`);
        continue;
      }

      if (!to || !ethers.isAddress(to)) {
        console.error(`❌ Error: Invalid wallet address for recipient ID ${recipientId}. Skipping...`);
        continue;
      }

      if (!rawAmount || isNaN(rawAmount) || rawAmount <= 0) {
        console.log(`⚠️ Skipping ${to}, invalid profit amount: ${rawAmount}`);
        continue;
      }

      // 🔍 **Perbaikan: Hash Kosong**
      if (existingHash !== undefined && existingHash !== null && String(existingHash).trim() !== "") {
        console.log(`⚠️ Skipping ${to}, transaction already recorded: ${existingHash}`);
        continue;
      }

      const amount = ethers.parseUnits(rawAmount.toString(), decimals);
      console.log(`🚀 Sending ${rawAmount} BONK to ${to} (Recipient ID: ${recipientId})...`);

      try {
        const tx = await bonkContract.transfer(to, amount);
        console.log(`⏳ Transaction sent: ${tx.hash}`);

        await tx.wait();
        console.log(`✅ Transaction confirmed: ${tx.hash}`);

        await updateTransactionHash(recipientId, tx.hash);
      } catch (error) {
        console.error(`❌ Error sending transaction to ${to}:`, error);
      }
    }
  } catch (error) {
    console.error("❌ Error retrieving token decimals:", error);
  }
}

// 🚀 Run the script
console.log("🚀 Running sendMultiSend...");
sendMultiSend();
