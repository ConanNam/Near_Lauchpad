import React, { useState, useEffect } from 'react'
import { airdropFactoryContract, getAllAirdrop } from 'utils/airdropFactory-contract'
import { config, wallet } from 'utils/near'
import { useHistory} from "react-router-dom"

const ListAirdrops = () => {
    let history = useHistory();
    const [listAirdrop, setListAirdrop] = useState([])
    const [info, setInfo] = useState({})
    console.log("🚀 ~ file: ListAirdrops.js ~ line 9 ~ ListAirdrops ~ info", info)

    useEffect(() => {
        const getInfo = async (fromIndex, limit) => {
            const listAirdrop = await airdropFactoryContract.get_all_airdrops({
                from_index: fromIndex,
                limit
            })
            console.log("🚀 ~ file: ListAirdrops.js ~ line 17 ~ getInfo ~ listAirdrop", listAirdrop)

            const info = await airdropFactoryContract.get_airdrop_factory_info({})
            setInfo(info)
            listAirdrop.reverse()
            setListAirdrop(listAirdrop)

        }

        getInfo(0, 100)


    }, [wallet.account(), wallet.getAccountId()])

    const handleViewDetail = (airdrop_id,tokenAddress,symbol,total) => {
        const airdropContract = airdrop_id+'.'+config.AIRDROP_FACTORY_CONTRACT
        history.push(`/airdop/details/${airdropContract}`)
    }

    return (
        <div>
            <h1>Airdrop</h1>
            <div className='card'>
                <div className='card-body row'>
                    <div className='col-sm-6'>
                        <small>AIRDROP LAUNCHED</small>
                        <h3>{info.airdrop_launched}</h3>
                    </div>
                    <div className='col-sm-6'>
                        <small>PARTICIPANTS IN ALL-TIME</small>
                        <h3>126</h3>
                    </div>
                </div>
            </div>
            <div className='row mt-5 p-3'>
                {listAirdrop?.map((item, index) => {
                    return (
                        <div className='card mr-3 mb-3'
                            key={item.airdrop_id + index}
                           >
                            <div className='card-body'>
                                <img src={item.logo_url}
                                    width={42}
                                    height={42}
                                    style={{ borderRadius: 25, objectFit: 'cover' }} />
                                <h2 className='mt-3' style={{width:300}}>{item.airdrop_title}</h2>
                                <div className='d-flex justify-content-between p-3'>
                                    <p>Token</p>
                                    <p>{item.symbol}</p>
                                </div>
                                <div className='d-flex justify-content-between p-3'>
                                    <p>Total Token</p>
                                    <p>{item.total_token_airdrop}</p>
                                </div>
                                <div className='d-flex justify-content-between p-3'>
                                    <p>Participants</p>
                                    <p>{Object.keys(item.participents).length}</p>
                                </div>
                                <button type="button" className="btn btn-info btn-fw p-3"
                                onClick={() => handleViewDetail(item.airdrop_id)}>View Airdrop</button>
                            </div>
                           
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ListAirdrops