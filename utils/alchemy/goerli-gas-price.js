const cancelTx = async () => {
    require("dotenv").config();
    const { API_KEY, PRIVATE_KEY } = process.env;
    const { Network, Alchemy, Wallet } = require("alchemy-sdk");
    const settings = {
        apiKey: API_KEY,
        network: Network.ETH_GOERLI,
    };
    const alchemy = new Alchemy(settings);
    const walletInst = new Wallet(PRIVATE_KEY);
    const nonce = await alchemy.core.getTransactionCount(walletInst.address);

    console.log(await (await alchemy.core.getGasPrice()).toString());
};

cancelTx();
