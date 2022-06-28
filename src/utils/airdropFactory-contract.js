import { Contract, utils } from "near-api-js";
import {wallet,config,executeMultipleTransactions,getGas, ONE_YOCTO_NEAR} from './near'


const airdropFactoryContract = new Contract(
    wallet.account(),
    config.AIRDROP_FACTORY_CONTRACT,
    {
        viewMethods:['get_airdrop_factory_info','get_all_airdrops','get_airdrop','get_airdrop_contract_id'],
        changeMethods:['create_airdrop','update_airdrop']
    }
)

const getAirdropFactoryInfo = async() => {
    await airdropFactoryContract.get_airdrop_factory_info({})
}

const getAllAirdrop = async(fromIndex, limit) => {
    await airdropFactoryContract.get_all_airdrops({
        from_index:fromIndex,
        limit
    })
}

const getAirdrop = async(airdropId) => {
    await airdropFactoryContract.get_airdrop({airdrop_id:airdropId})
}

const getAirdropContractAddress = async(airdropId) => {
    await airdropFactoryContract.get_airdrop_contract_id({airdrop_id:airdropId})
}


const createAirdrop = async(args) => {
    await airdropFactoryContract.create_airdrop({args},getGas(),utils.format.parseNearAmount('5'))
}


export {
    airdropFactoryContract,
    getAirdrop,
    getAirdropContractAddress,
    getAirdropFactoryInfo,
    getAllAirdrop,
    createAirdrop
}