import React, { useEffect, useState, useContext } from 'react'
import { Form } from 'react-bootstrap';
import { AirdropContext } from '../../context/AirdropContext'
import { getAirdropFactoryInfo, airdropFactoryContract, createAirdrop } from 'utils/airdropFactory-contract';
import DatePicker from "react-datepicker";
import { Contract, utils } from "near-api-js";
import { wallet, config, executeMultipleTransactions, getGas, ONE_YOCTO_NEAR, FT_STORAGE_AMOUNT } from 'utils/near'
import BN from 'bn.js';



const CreateAirdrop = () => {
    const { tokenAddress,
        setTokenAddress,
        symbolToken,
        setSymbolToken,
        localSymbol,
        localTokenAddress
    } = useContext(AirdropContext)

    console.log('tokenAddress', tokenAddress)
    console.log('symbolToken', symbolToken)

    const [airdropTitle, setAirdropTile] = useState('')
    const [logoUrl, setLogoUrl] = useState('')
    const [discordUrl, setDiscordUrl] = useState('')
    const [description, setDescription] = useState('')
    const [websiteUrl, setWebsiteUrl] = useState('')
    const [startTime, setStartTime] = useState(new Date())
    const [vestingDuaration, setVestingDuration] = useState(1)
    const [vestingInterval, setVestingInterval] = useState(1)
    const [rawPartacipents, setRawPartacipents] = useState('')
    const [ftMetadata, setFtmetadata] = useState({})



    useEffect(() => {

        const ftContract = new Contract(
            wallet.account(),
            tokenAddress,
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

        getFTMetadata()


    }, [tokenAddress])

    const handleCreateAirdrop = async (e) => {
        e.preventDefault()
        console.log('comehere')
        let args = {
            ft_contract_id: tokenAddress,
            status: 0,
            vesting_duration: parseInt(vestingDuaration),
            vesting_interval: parseInt(vestingInterval),
            participents: {},
            symbol: ftMetadata.symbol,
            time_start: new Date().getTime() * 1000000,
            total_token_airdrop: '0',
            total_claimed: '0',
            owner_id: wallet.getAccountId(),
            airdrop_id: ftMetadata.symbol.toLocaleLowerCase(),
            airdrop_title: airdropTitle,
            logo_url: logoUrl,
            website: websiteUrl,
            discord: discordUrl,
            description: description
        }
        localStorage.setItem('symbolToken', ftMetadata.symbol)
        localStorage.setItem('tokenAddress', tokenAddress)
        console.log("🚀 ~ file: CreateAirdrop.js ~ line 47 ~ handleCreateAirdrop ~ args", args)
        const rs = await createAirdrop(args)

    }

    const handleAddPartacipents = async (e) => {
        e.preventDefault()
        const raw = rawPartacipents.split("\n")
        console.log("🚀 ~ file: CreateAirdrop.js ~ line 63 ~ handleAddPartacipents ~ raw", raw)
        const patacipents = []
        let totalToken = 0
        for (let i = 0; i < raw.length; i++) {
            const dataRaw = raw[i].split(',')
            totalToken += parseInt(dataRaw[1])
            patacipents.push({
                account_id: dataRaw[0],
                total_reward: new BN(dataRaw[1]).mul(new BN('10').pow(new BN(ftMetadata.decimals))).toString(),
                pre_reward: '0',
                last_time_claim: 0,
                time_can_claim: 0,
                claim_availble: true,
                times_claimed: 0
            })
        }
        console.log('partacipents', patacipents)

        let ftTransferCall = {
            receiverId: tokenAddress,
            functionCalls: [
                {
                    methodName: "storage_deposit",
                    args: {
                        account_id: symbolToken.toLocaleLowerCase() + "." + config.AIRDROP_FACTORY_CONTRACT,
                    },
                    gas: "10000000000000",
                    amount: FT_STORAGE_AMOUNT
                },
                {
                    methodName: "ft_transfer_call",
                    args: {
                        receiver_id: symbolToken.toLocaleLowerCase() + "." + config.AIRDROP_FACTORY_CONTRACT,
                        amount: new BN(totalToken).mul(new BN('10').pow(new BN(ftMetadata.decimals))).toString(),
                        msg: ""
                    },
                    gas: "60000000000000",
                    amount: ONE_YOCTO_NEAR
                }
            ]
        }

        let transactions = [ftTransferCall]
        let airdropDeposit = {
            receiverId: symbolToken.toLocaleLowerCase() + "." + config.AIRDROP_FACTORY_CONTRACT,
            functionCalls: [
                {
                    methodName: "add_participents",
                    args: {
                        participents: patacipents
                    },
                    gas: "10000000000000",
                    //amount: ONE_YOCTO_NEAR
                }
            ]
        }
        transactions.unshift(airdropDeposit)
        localStorage.removeItem('symbolToken')
        localStorage.removeItem('tokenAddress')
        await executeMultipleTransactions(transactions)

    }

    return (
        <div>
            <h1>Create New Airdrop</h1>
            <div className="col-12 grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        {(localSymbol && localTokenAddress) ?
                            <div>
                                <Form.Group>
                                    <label htmlFor="AddPartacipents">Add Partacipents</label>
                                    <textarea className="form-control" id="AddPartacipents" rows="6"
                                        onChange={(e) => setRawPartacipents(e.target.value)} ></textarea>
                                    <button type="submit" className="btn btn-primary mr-2 mt-3"
                                        onClick={handleAddPartacipents}>Add</button>
                                </Form.Group>
                            </div> :
                            <form className="forms-sample">
                                <Form.Group>
                                    <label htmlFor="tokenAddressInput">Token address*</label>
                                    <Form.Control type="text" className="form-control" id="tokenAddressInput" placeholder="Token address" required
                                        onChange={(e) => setTokenAddress(e.target.value)} />
                                    <small>Create airdrop fee: 5N</small>
                                </Form.Group>
                                {
                                    ftMetadata && tokenAddress &&
                                    <Form.Group>
                                        <label htmlFor="symbolInput">Symbol Token</label>
                                        <p className='form-control'>{ftMetadata.symbol}</p>
                                    </Form.Group>
                                }
                                <Form.Group>
                                    <label htmlFor="airdropTitleInput">Airdrop Title*</label>
                                    <Form.Control type="text" className="form-control" id="airdropTitleInput" placeholder="Airdrop Title" required
                                        onChange={(e) => setAirdropTile(e.target.value)} />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="logoUrlInput">Logo URL*</label>
                                    <Form.Control type="text" className="form-control" id="logoUrlInput" placeholder="Logo URL*" required
                                        onChange={(e) => setLogoUrl(e.target.value)} />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="websiteInput">website*</label>
                                    <Form.Control type="text" className="form-control" id="websiteInput" placeholder="website*" required
                                        onChange={(e) => setWebsiteUrl(e.target.value)} />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="disInput">Discord</label>
                                    <Form.Control type="text" className="form-control" id="disInput" placeholder="Discord"
                                        onChange={(e) => setDiscordUrl(e.target.value)} />
                                </Form.Group>
                                <Form.Group>
                                    <label htmlFor="Description">Description</label>
                                    <textarea className="form-control" id="Description" rows="6"
                                        onChange={(e) => setDescription(e.target.value)} ></textarea>
                                </Form.Group>
                                <Form.Group className="row">
                                    <label className="col-sm-3 col-form-label">Time to start</label>
                                    <div className="col-sm-9">
                                        <DatePicker className="form-control w-100"
                                            selected={startTime}
                                            onChange={(e) => setStartTime(e)}
                                        />
                                    </div>
                                </Form.Group>
                                <Form.Group className="row">
                                    <label className="col-sm-3 col-form-label">Vesting duration (days)</label>
                                    <div className="col-sm-9 mb-3">
                                        <Form.Control type="number" className="form-control" id="vestinhDurationInput" placeholder="Vesting duration" required
                                            onChange={(e) => setVestingDuration(e.target.value * 24 * 3600 * 1000000000)} />
                                    </div>
                                    <label className="col-sm-3 col-form-label">Vesting interval (days)</label>
                                    <div className="col-sm-9">
                                        <Form.Control type='number' className="form-control" id="vestingIntervalInput" placeholder="Vesting interval" required
                                            onChange={(e) => setVestingInterval(e.target.value * 24 * 3600 * 1000000000)} />
                                    </div>

                                </Form.Group>
                                <button type="submit" className="btn btn-primary mr-2"
                                    onClick={handleCreateAirdrop}>Create New Airdrop</button>
                                <button className="btn btn-dark">Cancel</button>
                            </form>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateAirdrop