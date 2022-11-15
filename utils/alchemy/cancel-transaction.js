const cancelTx = async () => {
    require("dotenv").config();

    const { API_KEY, PRIVATE_KEY } = process.env;
    const { Network, Alchemy, Wallet, Utils } = require("alchemy-sdk");
    const settings = { apiKey: API_KEY, network: Network.ETH_GOERLI };
    const alchemy = new Alchemy(settings);
    const walletInst = new Wallet(PRIVATE_KEY);

    for (let i=44; i<53; i++) {
        nonce = i
        console.log(nonce);
        const replacementTx = {
            gasLimit: "30000000",
            maxPriorityFeePerGas: Utils.parseUnits("100", "gwei"),
            maxFeePerGas: Utils.parseUnits("101", "gwei"),
            nonce,
            type: 2,
            chainId: 5,
        };

        try {
            const signedTx = await walletInst.signTransaction(replacementTx);
            const txResult = await alchemy.core.sendTransaction(signedTx);

            console.log(
                "The hash of the transaction we are going to cancel is:",
                txResult.hash
            );
        } catch (error) {
                console.log(
                "Something went wrong while submitting your transactions:",
                error
            );
        }

        console.log('--------------------------------------');
    }
};

cancelTx();