import { Contract, utils } from "near-api-js";
import { wallet, config, executeMultipleTransactions, getGas, ONE_YOCTO_NEAR } from './near'


const locktokenContract = new Contract(
    wallet.account(),
    config.LOCKTOKEN_FACTORY_CONTRACT,
    {
        viewMethods: ['get_locks_by_account', 'get_all_locks'],
        changeMethods: ['create_lock', 'unlock_token']
    }
)

const ftContract = new Contract(
    wallet.account(),
    config.FT_CONTRACT,
    {
        viewMethods: ["ft_metadata", "ft_balance_of", "storage_balance_of"],
        changeMethods: ["ft_transfer", "ft_transfer_call"]
    }
)

const createLock = async (token, amount, time) => {
    // ft_transfer -- ft_contract
    // create lock -- lock_contract
    // await ftContract.ft_transfer_call(
    //     { receiver_id: config.LOCKTOKEN_FACTORY_CONTRACT, token_id: token, amount: amount, end_emission: time, msg: "" },
    //     getGas(),
    //     utils.format.parseNearAmount(ONE_YOCTO_NEAR)
    // )

    let ftTransferCall = {
        receiverId: token,
        functionCalls: [
            {
                methodName: "ft_transfer_call",
                args: {
                    receiver_id: config.LOCKTOKEN_FACTORY_CONTRACT,
                    amount: amount,
                    msg: ""
                },
                gas: "60000000000000",
                amount: ONE_YOCTO_NEAR
            }
        ]
    }
    let createLockCall = {
        receiverId: config.LOCKTOKEN_FACTORY_CONTRACT,
        functionCalls: [
            {
                methodName: "create_lock",
                args: {
                    owner_id: window.accountId,
                    ft_contract_id: token,
                    amount: amount,
                    end_emission: time
                },
                gas: "60000000000000",
                amount: ONE_YOCTO_NEAR
            }
        ]
    }

    let transactions = [ftTransferCall, createLockCall];
    // await locktokenContract.create_lock(
    //     { owner_id: window.accountId, ft_contract_id: token, amount: amount, end_emission: time},
    //     getGas(),
    //     utils.format.parseNearAmount(ONE_YOCTO_NEAR)
    // )
    await executeMultipleTransactions(transactions);
}
const unlockToken = async (token, lock_id) => {
    await locktokenContract.unlock_token(
        { owner_id: window.accountId, ft_contract_id: token, lock_id: lock_id},
        getGas(),
        utils.format.parseNearAmount(ONE_YOCTO_NEAR)
    )
}

const getTokenLocks = async () => {
    // let tokenLocks = await locktokenContract.get_locks_by_account({account_id: window.accountId})
    let tokenLocks = await locktokenContract.get_all_locks({})

    return tokenLocks
}
const getMyLocks = async () => {
    let tokenLocks = await locktokenContract.get_locks_by_account({account_id: window.accountId})

    return tokenLocks
}
export {
    createLock,
    getTokenLocks,
    unlockToken,
    getMyLocks
}