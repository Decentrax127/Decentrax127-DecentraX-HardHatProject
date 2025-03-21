const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://arb1.arbitrum.io/rpc"); // RPC jaringan Arbitrum
const walletAddress = "0x6848cC91C87232EcDd41A348af817e5189B78320"; // Ganti dengan alamat pengirim

async function checkBalance() {
    const balance = await provider.getBalance(walletAddress);
    console.log(`Saldo: ${ethers.formatEther(balance)} ETH`);
}

checkBalance();

