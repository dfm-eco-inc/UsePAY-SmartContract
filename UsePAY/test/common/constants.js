module.exports = {
    MANAGERS: [
        {
            address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            privateKey: ''
        },
        {
            address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            privateKey: ''
        },
        {
            address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            privateKey: ''
        },
        {
            address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
            privateKey: ''
        },
        {
            address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
            privateKey: ''
        },
        {
            address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
            privateKey: ''
        },
        {
            address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
            privateKey: ''
        }
    ],
    ADDRESSES: {
        NATIVE_TOKEN: 100,
        WRAPPED_NATIVE_TOKEN: 101,
        PAC_TOKEN: 102,
        UNISWAP_ROUTER: 60000,
        UNISWAP_TOKEN_PAIR: 60001,
        PERCENTAGE: 60100,
        EMERGENCY_STOP: 60101,
        MULTI_TRANSFER: 60102,
        CHAINLINK_DATAFEED: 61000,
        TICKET_COMMANDER: 62000,
        COUPON_COMMANDER: 62001,
        SUBSCR_COMMANDER: 62002,
        TICKET_CREATOR: 62003,
        COUPON_CREATOR: 62004,
        SUBSCR_CREATOR: 62005
    },
    DATABASE: {
        enabled: process.env.TEST_WITH_DB == 'true',
        connectionLimit: 30,
        host: '127.0.0.1',
        port: 3306,
        user: 'usepay_local',
        password: '',
        database: 'usepay_local',
        connectionLimit: 30,
        charset: 'utf8mb4'
    }
}; 