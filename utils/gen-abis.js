const fs = require("fs");
var archiver = require("archiver");

const NETWORK = process.argv[2];
const CONTRACT_TYPE = process.argv[3];

const CONTRACTS = [
    "./Uniswap/artifacts/contracts/Uniswap/core/UniswapV2Pair",
    "./Uniswap/artifacts/contracts/Uniswap/periphery/UniswapV2Router02",
    "./UsePAY/artifacts/contracts/UsePAY/Storage/Addresses",
    "./UsePAY/artifacts/contracts/UsePAY/Storage/WrapAddresses",
    "./UsePAY/artifacts/contracts/UsePAY/Commander/EmergencyStop",
    "./UsePAY/artifacts/contracts/UsePAY/Commander/CouponCommander",
    "./UsePAY/artifacts/contracts/UsePAY/Commander/SubscriptionCommander",
    "./UsePAY/artifacts/contracts/UsePAY/Commander/TicketCommander",
    "./UsePAY/artifacts/contracts/UsePAY/Pack/CouponPack",
    "./UsePAY/artifacts/contracts/UsePAY/Creator/CouponCreator",
    "./UsePAY/artifacts/contracts/UsePAY/Creator/SubscriptionCreator",
    "./UsePAY/artifacts/contracts/UsePAY/Creator/TicketCreator",
    "./UsePAY/artifacts/contracts/UsePAY/Library/AggregatorV3Interface",
    "./UsePAY/artifacts/contracts/UsePAY/Library/MultiTransfer",
    "./UsePAY/artifacts/contracts/openzeppelin/token/ERC20/presets/ERC20PresetPauser",
];

async function getTargetContracts(contractsList) {
    const outputPath = `./output/abi/`;
    await fs.mkdirSync(outputPath, { recursive: true });
    return { outputPath, contractsList };
}

function getFullPath(path) {
    const pathItems = path.split("/");
    const contractName = pathItems[pathItems.length - 1];
    const fullPath = path + ".sol/" + contractName + ".json";
    return { fullPath, contractName };
}

function zipping(outputPath) {
    const archive = archiver("zip");
    const output = fs.createWriteStream(outputPath + `../abi.zip`);

    archive.on("error", console.log);
    output.on("close", () => console.log("complete."));

    archive.pipe(output);
    archive.directory(outputPath, false);
    archive.directory("subdir/", "new-subdir");
    archive.finalize();
}

async function main() {
    const { contractsList, outputPath } = await getTargetContracts(CONTRACTS);
    for (let i = 0; i < contractsList.length; i++) {
        const { fullPath, contractName } = getFullPath(contractsList[i]);
        const { abi } = JSON.parse(await fs.readFileSync(fullPath, "utf-8"));
        const jsonText = JSON.stringify(abi);
        await fs.writeFileSync(
            outputPath + contractName + ".abi.json",
            jsonText
        );
        console.log(contractName + " done.");
    }

    zipping(outputPath);
}

main();
