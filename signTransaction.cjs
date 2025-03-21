require("dotenv").config();
const Web3 = require('web3').default;

// 🔹 Ganti dengan RPC URL Arbitrum
const web3 = new Web3("https://arb-mainnet.g.alchemy.com/v2/FcmYpFPs6pB_hcMa4cRP6eAxPsJz3qFM");

// 🔹 Private key pengirim (JANGAN simpan di kode produksi!)
const privateKey = process.env.PRIVATE_KEY;

// 🔹 Alamat MultiSend Contract dan ABI yang benar
const contractAddress = "0xDD9a14aA190A9E41bE65a0Aa7BcEbA6a83E5875E";
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            { "internalType": "contract IERC20", "name": "token", "type": "address" },
            { "internalType": "address[]", "name": "recipients", "type": "address[]" },
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "name": "multiSendERC20",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address[]", "name": "recipients", "type": "address[]" },
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "name": "multiSendETH",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "contract IERC20", "name": "token", "type": "address" }
        ],
        "name": "withdrawERC20",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdrawETH",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const contract = new web3.eth.Contract(contractABI, contractAddress);

// 🔹 Data transaksi
const sender = "0x6848cC91C87232EcDd41A348af817e5189B78320";
const tokenAddress = "0x09199d9A5F4448D0848e4395D065e1ad9c4a1F74";
const recipients = [
    "0xA6318024e630B19aa75645e6c370Df4a2cEfe360", 
    "0xf2f4C8F4214C60a7be44B7A41e44C618D2FbA5F3", 
    "0x73cB8EBf55d0EB6f61eb215819B2944a19918DC1"
];

// Jumlah token yang ingin dikirim, dikonversi ke Wei (sesuaikan dengan desimal token)
const amounts = [
    web3.utils.toWei("1.5", "ether"),  // Misalnya token dengan 18 desimal
    web3.utils.toWei("2.0", "ether"),
    web3.utils.toWei("1.5", "ether")
];

async function signTransaction() {
    // 🔹 Encode function call
    const encodedData = contract.methods.multiSendERC20(tokenAddress, recipients, amounts).encodeABI();

    // 🔹 Ambil gas price & nonce
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(sender, "latest");

    // 🔹 Buat transaksi
    const tx = {
        from: sender,
        to: contractAddress,
        data: encodedData,
        gas: web3.utils.toHex(3000000),  // Tentukan gas limit sesuai kebutuhan
        gasPrice: web3.utils.toHex(gasPrice),
        nonce: nonce,
        chainId: 42161  // Arbitrum One
    };

    // 🔹 Tanda tangani transaksi
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    console.log("Signed Transaction:", signedTx.rawTransaction);
}

signTransaction().catch(console.error);
