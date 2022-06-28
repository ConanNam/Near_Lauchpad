import React, { useEffect, useState } from 'react'
import {
    useParams
} from "react-router-dom";
import { getGas, ONE_YOCTO_NEAR, toReadableNumberString, wallet, executeMultipleTransactions, FT_STORAGE_AMOUNT } from 'utils/near';
import { Contract, utils } from "near-api-js";
import { parseNearAmount } from 'near-api-js/lib/utils/format';
import BN from 'bn.js';


const ViewDetail = () => {

    const search = useParams();
    console.log('search', search)
    const [airdropContractId, setAirdropContractId] = useState(search.id)
    const [aidropInfo, setAirdropInfo] = useState({})
    const [accountDetail, setAccountDetail] = useState({})
    console.log("🚀 ~ file: ViewDetail.js ~ line 16 ~ ViewDetail ~ accountDetail", accountDetail)
    console.log("🚀 ~ file: ViewDetail.js ~ line 15 ~ ViewDetail ~ aidropInfo", aidropInfo)
    const [ftMetadata, setFtmetadata] = useState({})

    const ftContract = new Contract(
        wallet.account(),
        aidropInfo.ft_contract_id,
        {
            viewMethods: ["ft_metadata", "ft_balance_of", "storage_balance_of"],
            changeMethods: ["ft_transfer", "ft_transfer_call"]
        }
    )

    const getFTMetadata = async () => {
        const metadata = await ftContract.ft_metadata({})
        console.log("🚀 ~ file: CreateAirdrop.js ~ line 50 ~ getFTMetadata ~ metadata", metadata)
        setFtmetadata(metadata)
    }


    const airdropContract = new Contract(
        wallet.account(),
        airdropContractId,
        {
            viewMethods: ["get_all_partacipents", "get_account_detail", "get_airdrop_info"],
            changeMethods: ["get_status_airdrop", "add_participents", "claim_token"]
        }

    )

    const getAirdropInfo = async () => {
        const data = await airdropContract.get_airdrop_info({})
        setAirdropInfo(data)
    }

    const getAccountDetail = async () => {
        const data = await airdropContract.get_account_detail({ account_id: wallet.getAccountId() })
        setAccountDetail(data)
    }

    useEffect(() => {

        const rs = new BN('550000').div(new BN(100000)).toString()
        console.log("🚀 ~ file: ViewDetail.js ~ line 45 ~ useEffect ~ rs", rs)

        Promise.all([
            getAirdropInfo(),
            getAccountDetail()
        ])

    }, [wallet.account(), wallet.getAccountId(), airdropContractId])

    useEffect(() => {
        getFTMetadata()
    }, [aidropInfo])

    const handleClaimToken = async () => {
       // await airdropContract.claim_token({}, getGas(), parseNearAmount(ONE_YOCTO_NEAR))
        let ftTransferCall = {
            receiverId: aidropInfo.ft_contract_id,
            functionCalls: [
                {
                    methodName: "storage_deposit",
                    args: {
                        account_id: wallet.getAccountId(),
                    },
                    gas: "10000000000000",
                    amount: FT_STORAGE_AMOUNT
                },
                
            ]
        }

        
        let claimToken = {
            receiverId: airdropContractId,
            functionCalls: [
                {
                    methodName: "claim_token",
                    args: {
                    },
                    gas: getGas()
                }
            ]
        }
        let transactions = [ftTransferCall,claimToken]
        await executeMultipleTransactions(transactions)
    }

    return (
        <div>
            <div className='row'>
                <div className='col-6'>
                    <div className='card mr-3'
                    //key={item.airdrop_id + index}
                    >
                        <div className='card-body'>
                            <div className='row'>
                                <img src={aidropInfo.logo_url}
                                    width={42}
                                    height={42}

                                    style={{ borderRadius: 25, objectFit: 'cover' }} />
                                <h3 style={{ width: 300, marginLeft: 20 }}>{aidropInfo.airdrop_title}</h3>
                            </div>
                            <div className='d-flex justify-content-between p-3'>
                                <p>Airdrop Address</p>
                                <p>{airdropContractId}</p>
                            </div>
                            <div className='d-flex justify-content-between p-3'>
                                <p>Token Address</p>
                                <p>{aidropInfo.ft_contract_id}</p>
                            </div>
                            <div className='d-flex justify-content-between p-3'>
                                <p>Total Tokens airdrop</p>
                                <p>{toReadableNumberString(ftMetadata.decimals, aidropInfo.total_token_airdrop)}</p>
                            </div>
                            <div className='d-flex justify-content-between p-3'>
                                <p>Total Tokens airdrop claimed</p>
                                <p>{toReadableNumberString(ftMetadata.decimals, aidropInfo?.total_claimed)}</p>
                            </div>
                        </div>

                    </div>
                </div>
                <div className='col-4'>
                    <div className='card'
                    //key={item.airdrop_id + index}
                    >
                        <div className='card-body'>
                            <h5 style={{ width: 300 }}>{aidropInfo.airdrop_title}</h5>
                            <div className="progress progress-md portfolio-progress mt-3 mb-3">
                                <div className="progress-bar bg-success" role="progressbar" style={{ width: `${Math.round(parseFloat(aidropInfo.total_claimed) / parseFloat(aidropInfo.total_token_airdrop)) * 100}%` }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div className='d-flex justify-content-between border-bottom border-white'
                            >
                                <p>{toReadableNumberString(ftMetadata.decimals, aidropInfo.total_claimed)}</p>
                                <p>{toReadableNumberString(ftMetadata.decimals, aidropInfo.total_token_airdrop)}</p>
                            </div>

                            <div style={{ borderWidth: 1, borderColor: 'white', height: 3, width: '100%' }} />
                            <div className='d-flex justify-content-between mt-3'>
                                <p>Start time</p>
                                <p>{`${new Date(aidropInfo.time_start / 1000000).toLocaleDateString()}`}</p>
                            </div>
                            <div className='d-flex justify-content-between'>
                                <p>Your Allocation</p>
                                <p>{accountDetail ? toReadableNumberString(ftMetadata.decimals, accountDetail?.total_reward) : '0'}</p>
                            </div>
                            <div className='d-flex justify-content-between'>
                                <p>Your Claimed</p>
                                <p>{accountDetail ? toReadableNumberString(ftMetadata.decimals, accountDetail?.pre_reward) : '0'}</p>
                            </div>
                            {accountDetail &&
                                <button type="button" className="btn btn-info btn-fw p-3"
                                    onClick={() => handleClaimToken()}>Claim</button>}
                        </div>

                    </div>
                </div>
            </div>
            <div >
                <div className='card'
                    //key={item.airdrop_id + index}
                    style={{ marginTop: 50 }}
                >
                    <div className='card-body'>
                        <h5 className='border-bottom border-white pb-3' style={{ width: 300 }}>Allocations ({aidropInfo.participents?.length}) </h5>
                        {aidropInfo.participents?.map((item, index) => {
                            return (
                                <div className='d-flex justify-content-between' key={index}>
                                    <p>{item.account_id}</p>
                                    <p>{toReadableNumberString(ftMetadata.decimals,item.total_reward)}</p>
                                </div>
                            )
                        })}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default ViewDetail