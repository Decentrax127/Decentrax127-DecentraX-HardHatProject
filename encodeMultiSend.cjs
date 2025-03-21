const fs = require("fs");
const fetch = require("node-fetch");
const { ethers } = require("ethers");

// Fungsi untuk mengambil data penerima dari API
const getRecipients = async () => {
    try {
        const response = await fetch("https://decentrax.meme/version-test/api/1.1/obj/VestingReturn");
        const data = await response.json();
        console.log("Data dari API:", JSON.stringify(data, null, 2));

        return data.response?.results || []; // Pastikan selalu array
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
};

// Fungsi untuk encoding MultiSend
const encodeMultiSend = async () => {
    const recipients = await getRecipients();
    if (recipients.length === 0) {
        console.log("Tidak ada penerima yang ditemukan.");
        return;
    }

    // Validasi apakah setiap objek memiliki data yang dibutuhkan
    const validRecipients = recipients.filter(rec => rec["Wallet Address"] && rec["Vesting Amount"] !== undefined);
    
    if (validRecipients.length === 0) {
        console.log("Tidak ada penerima valid.");
        return;
    }

    const addresses = validRecipients.map(rec => rec["Wallet Address"]);
    const amounts = validRecipients.map(rec => ethers.parseUnits(rec["Vesting Amount"].toString(), 18));

    console.log("Addresses:", addresses);
    console.log("Amounts:", amounts);

    // ABI fungsi MultiSend (update sesuai dengan ABI sebenarnya)
    const multiSendInterface = new ethers.Interface([
        "function multiSend(address[] calldata recipients, uint256[] calldata amounts)"
    ]);

    // Encoding data untuk transaksi
    const encodedMultiSend = multiSendInterface.encodeFunctionData("multiSend", [addresses, amounts]);

    console.log("Encoded MultiSend Data:", encodedMultiSend);

    // Simpan hasil encoding ke file
    fs.writeFileSync("encodedData.txt", encodedMultiSend, "utf-8");
    console.log("Encoded data telah disimpan di encodedData.txt");
};

// Jalankan encoding
encodeMultiSend();
