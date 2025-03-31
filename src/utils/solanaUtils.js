const { Keypair } = require('@solana/web3.js');

function generateSolanaKeyPair() {
    const keypair = Keypair.generate();
    return {
        publicKey: keypair.publicKey.toBase58(),
        privateKey: Buffer.from(keypair.secretKey).toString('base64')
    };
}

module.exports = {
    generateSolanaKeyPair
}; 