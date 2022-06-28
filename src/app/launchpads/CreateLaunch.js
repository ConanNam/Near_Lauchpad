import React, { useState, useEffect } from 'react'
import { Form } from 'react-bootstrap';
import { Contract, utils, providers } from "near-api-js";
import { parseTokenWithDecimals } from '../utils';
import DatePicker from "react-datepicker";
import bsCustomFileInput from 'bs-custom-file-input';
import { async } from 'regenerator-runtime';
import { parseNearAmount } from 'near-api-js/lib/utils/format';
import { FT_STORAGE_AMOUNT, ONE_YOCTO_NEAR, executeMultipleTransactions, config } from 'utils/near';
import BN from 'bn.js';

const GAS = '300000000000000'

const VerifyToken = ({ tokenAddress, setTokenAddress, tokenMetaData, setTokenMetaData, onNext }) => {

    const [balance, setBalance] = useState("0")
    const [tokenError, setTokenError] = useState(false)

    const handleTokenAddressChange = (event) => {
        setTokenAddress(event.target.value)
    }

    useEffect(() => {
        if (tokenAddress) {
            getTokenBalance()
        }
    }, [tokenAddress])

    const getTokenBalance = async () => {
        try {
            const ftContract = new Contract(
                window.walletConnection.account(),
                tokenAddress,
                {
                    viewMethods: ["ft_metadata", "ft_balance_of", "storage_balance_of"],
                    changeMethods: ["ft_transfer", "ft_transfer_call"]
                }
            )
            let balance = "0";
            if (window.walletConnection.isSignedIn()) {
                //@ts-ignore
                balance = await ftContract.ft_balance_of({ account_id: window.walletConnection.getAccountId() });
                const metadata = await ftContract.ft_metadata()
                if (metadata && balance) {
                    setTokenError(false)
                    setTokenMetaData(metadata)
                    setBalance(parseTokenWithDecimals(parseInt(balance), metadata.decimals))
                }
            }
        } catch (error) {
            setBalance(0)
            setTokenMetaData(null)
            setTokenError(true)
        }
    }

    return (
        <div>
            <p className="text-danger">(*) is required field.</p>
            <Form.Group>
                <h6 htmlFor="tokenAddress">Token address <sub className="text-danger">*</sub></h6>
                <Form.Control type="text" className="form-control" id="tokenAddress" placeholder="Ex: nearlaunch.near" onChange={handleTokenAddressChange} />
                {tokenError && <p className="text-danger">Token address is wrong, please change this</p>}
            </Form.Group>
            <p className="text-primary">Create pool fee: 10 NEAR</p>
            {tokenMetaData &&
                <div>
                    <p>Name: {tokenMetaData.name}</p>
                    <p>Symbol: {tokenMetaData.symbol}</p>
                    <p>Decimals: {tokenMetaData.decimals}</p>
                    <p>Balance: {balance}</p>
                </div>}
            <h6>Currency</h6>
            <Form.Group>
                <div className="form-check">
                    <label className="form-check-label">
                        <input type="radio" className="form-check-input" name="optionsRadios" id="optionsRadios2" value="option2" defaultChecked />
                        <i className="input-helper"></i>
                        NEAR
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        <input type="radio" className="form-check-input" name="optionsRadios" id="optionsRadios1" value="" />
                        <i className="input-helper"></i>
                        USDT
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        <input type="radio" className="form-check-input" name="optionsRadios" id="optionsRadios1" value="" />
                        <i className="input-helper"></i>
                        USDC
                    </label>
                </div>
            </Form.Group>
            <p className="text-primary">Users will pay with NEAR for your token</p>
            <p>Disclaimer: The information provided shall not in any way constitute a recommendation as to whether you should invest in any product discussed. We accept no liability for any loss occasioned to any person acting or refraining from action as a result of any material provided or published.</p>
            {tokenAddress && !tokenError ?
                <button type="button" className="btn btn-primary btn-fw" onClick={onNext}>Next</button> :
                <button type="button" className="btn btn-outline-light btn-fw" disabled={true}>Next</button>}
        </div>
    )
}

const LaunchpadInfo = ({ presaleInfo, onHandlePresaleInfoChange, onNext }) => {

    const [startTime, setStartTime] = useState(null)
    const [endTime, setEndTime] = useState(null)

    useEffect(() => {
        handleStartTime()
    }, [])


    const handleStartTime = async date => {
        setStartTime(date)
        const d = new Date(date);
        onHandlePresaleInfoChange('start_block', d.getTime() * 10 ** 6)
    }

    const handleEndTime = async date => {
        setEndTime(date)
        const d = new Date(date);
        onHandlePresaleInfoChange('end_block', d.getTime() * 10 ** 6)
    }

    return (
        <div>
            <p className="text-danger">(*) is required field.</p>
            <Form.Group>
                <h6 htmlFor="presaleRate">Presale rate <sub className="text-danger">*</sub></h6>
                <Form.Control
                    type="number"
                    className="form-control"
                    id="presaleRate"
                    placeholder="0"
                    value={presaleInfo.token_price}
                    onChange={event => onHandlePresaleInfoChange('token_price', event.target.value)} />
            </Form.Group>
            {/* <p className="text-danger">Presale rate must be positive number</p> */}
            <p className="text-primary">If I spend 1 NEAR how many tokens will I receive?</p>
            <h6>Whitelist</h6>
            <Form.Group className="row">
                <div className="col-sm-4">
                    <div className="form-check">
                        <label className="form-check-label">
                            <input type="radio" className="form-check-input" name="ExampleRadio4" id="membershipRadios1" defaultChecked />Disable<i className="input-helper"></i>
                        </label>
                    </div>
                </div>
                <div className="col-sm-5">
                    <div className="form-check">
                        <label className="form-check-label">
                            <input type="radio" className="form-check-input" name="ExampleRadio4" id="membershipRadios2" />Enable<i className="input-helper"></i>
                        </label>
                    </div>
                </div>
            </Form.Group>
            <p className="text-primary">You can enable/disable whitelist anytime</p>
            <div className="row">
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Softcap (NEAR)</h6>
                        <Form.Control type="number" onChange={event => onHandlePresaleInfoChange('soft_cap', event.target.value)} />
                    </Form.Group>
                </div>
                <div className="col-md-6">
                    <Form.Group>
                        <h6>HardCap (NEAR)</h6>
                        <Form.Control type="number" onChange={event => onHandlePresaleInfoChange('hard_cap', event.target.value)} />
                    </Form.Group>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Minimum buy (NEAR)</h6>
                        <Form.Control type="number" />
                    </Form.Group>
                </div>
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Maximum buy (NEAR)</h6>
                        <Form.Control type="number" onChange={event => onHandlePresaleInfoChange('max_spend_per_buyer', event.target.value)} />
                    </Form.Group>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Refund type</h6>
                        <select className="form-control">
                            <option>Refund</option>
                            <option>Burn</option>
                        </select>
                    </Form.Group>
                </div>
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Router</h6>
                        <select className="form-control">
                            <option>Ref finance</option>
                            <option>Binance</option>
                        </select>
                    </Form.Group>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Liquidity (%)</h6>
                        <Form.Control type="number" onChange={event => onHandlePresaleInfoChange('liquidity_percent', event.target.value)} />
                    </Form.Group>
                </div>
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Listing rate</h6>
                        <Form.Control type="number" onChange={event => onHandlePresaleInfoChange('listing_rate', event.target.value)} />
                    </Form.Group>
                </div>
            </div>
            <p className="text-primary">
                Enter the percentage of raised funds that should be allocated to Liquidity on (Min 51%, Max 100%)
                <br></br>
                If I spend 1 BNB on how many tokens will I receive? Usually this amount is lower than presale rate to allow for a higher listing price on
            </p>
            <h6>Select start time & end time (UTC)</h6>
            <div className="row">
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Start time (UTC)</h6>
                        <DatePicker className="form-control w-100"
                            showTimeSelect
                            selected={startTime}
                            onChange={handleStartTime}
                        />
                    </Form.Group>
                </div>
                <div className="col-md-6">
                    <Form.Group>
                        <h6>End time (UTC)</h6>
                        <DatePicker className="form-control w-100"
                            selected={endTime}
                            showTimeSelect
                            onChange={handleEndTime}
                        />
                    </Form.Group>
                </div>
            </div>
            <Form.Group>
                <h6 htmlFor="tokenAddress">Liquidity lockup (minutes) <sub className="text-danger">*</sub></h6>
                <Form.Control type="text" className="form-control" id="tokenAddress" placeholder="Ex: nearlaunch.near" onChange={event => onHandlePresaleInfoChange('lock_period', event.target.value)} />
            </Form.Group>

            <p>Need {presaleInfo.token_price * presaleInfo.hard_cap} DRV to create launchpad.</p>
            <div className="row">
                <div className="col-md-3">
                    <button type="button" className="btn btn-outline-light btn-fw" disabled={true}>Back</button>
                </div>
                <div className="col-md-3">
                    {true ?
                        <button type="button" className="btn btn-primary btn-fw" onClick={onNext}>Next</button> :
                        <button type="button" className="btn btn-outline-light btn-fw" disabled={true}>Next</button>}
                </div>
            </div>
        </div>
    )
}

const AdditionalInfo = ({ additionalInfo, onChangeAdditionalInfo, onNext }) => {
    return (
        <div>
            <p className="text-danger">(*) is required field.</p>
            <div className="row">
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Logo URL <sub className="text-danger">*</sub></h6>
                        <Form.Control
                            onChange={event => onChangeAdditionalInfo('logo_url', event.target.value)}
                            value={additionalInfo.logo_url}
                            placeholder={'Ex: https://...'} />
                    </Form.Group>
                </div>
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Website <sub className="text-danger">*</sub></h6>
                        <Form.Control
                            onChange={event => onChangeAdditionalInfo('website', event.target.value)}
                            value={additionalInfo.website}
                            placeholder={'Ex: https://...'} />
                    </Form.Group>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Facebook</h6>
                        <Form.Control
                            onChange={event => onChangeAdditionalInfo('facebook', event.target.value)}
                            value={additionalInfo.facebook}
                            placeholder={'Ex: https://facebook.com/...'} />
                    </Form.Group>
                </div>
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Twitter</h6>
                        <Form.Control
                            onChange={event => onChangeAdditionalInfo('twitter', event.target.value)}
                            value={additionalInfo.twitter}
                            placeholder={'Ex: https://twitter.com/...'} />
                    </Form.Group>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Github</h6>
                        <Form.Control
                            onChange={event => onChangeAdditionalInfo('github', event.target.value)}
                            value={additionalInfo.github}
                            placeholder={'Ex: https://github.com/...'} />
                    </Form.Group>
                </div>
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Telegram</h6>
                        <Form.Control
                            onChange={event => onChangeAdditionalInfo('telegram', event.target.value)}
                            value={additionalInfo.telegram}
                            placeholder={'Ex: https://t.me/...'} />
                    </Form.Group>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Instagram</h6>
                        <Form.Control
                            onChange={event => onChangeAdditionalInfo('instagram', event.target.value)}
                            value={additionalInfo.instagram}
                            placeholder={'Ex: https://instagram.com/...'} />
                    </Form.Group>
                </div>
                <div className="col-md-6">
                    <Form.Group>
                        <h6>Discord</h6>
                        <Form.Control
                            onChange={event => onChangeAdditionalInfo('discord', event.target.value)}
                            value={additionalInfo.discord}
                            placeholder={'Ex: https://discord.com/...'} />
                    </Form.Group>
                </div>
            </div>
            <div className="row">
                <div className="col-md-12">
                    <Form.Group>
                        <h6>Reddit</h6>
                        <Form.Control
                            onChange={event => onChangeAdditionalInfo('reddit', event.target.value)}
                            value={additionalInfo.reddit}
                            placeholder={'Ex: https://reddit.com/...'} />
                    </Form.Group>
                </div>
            </div>
            <div className="row">
                <div className="col-md-12">
                    <Form.Group>
                        <h6 htmlFor="exampleTextarea1">Description</h6>
                        <textarea
                            className="form-control"
                            id="exampleTextarea1"
                            rows="4"
                            onChange={event => onChangeAdditionalInfo('description', event.target.value)}
                            value={additionalInfo.description}
                            placeholder={'Ex: This is the best project...'}></textarea>
                    </Form.Group>
                </div>
            </div>
            <div className="row">
                <div className="col-md-3">
                    <button type="button" className="btn btn-outline-light btn-fw" disabled={true}>Back</button>
                </div>
                <div className="col-md-3">
                    {true ?
                        <button type="button" className="btn btn-primary btn-fw" onClick={onNext}>Next</button> :
                        <button type="button" className="btn btn-outline-light btn-fw" disabled={true}>Next</button>}
                </div>
            </div>
        </div>
    )
}

const ReviewInfomation = ({ tokenMetaData, presaleInfo, additionalInfo, onSubmit }) => {
    return (
        <div>
            <p>Total token: <span className="text-primary">{presaleInfo.amount} {tokenMetaData?.symbol}</span></p>
            <p>Token name: <span className="text-primary">{tokenMetaData?.name}</span></p>
            <p>Token symbol: <span className="text-primary">{tokenMetaData?.symbol}</span></p>
            <p>Token decimals: <span className="text-primary">{tokenMetaData?.decimals}</span></p>
            <p>Presale rate: <span className="text-primary">{presaleInfo.token_price}</span></p>
            <p>Listing rate: <span className="text-primary">{presaleInfo.listing_rate}</span></p>
            <p>Sale method: <span className="text-primary">Public</span></p>
            <p>Softcap: <span className="text-primary">{presaleInfo.soft_cap}</span></p>
            <p>Hardcap: <span className="text-primary">{presaleInfo.hard_cap}</span></p>
            <p>Unsold tokens: <span className="text-primary">Burn</span></p>
            {/* <p>Minimum buy: <span className="text-primary">1000000 DRV</span></p> */}
            <p>Maximum buy: <span className="text-primary">{presaleInfo.max_spend_per_buyer}</span></p>
            <p>Liquidity: <span className="text-primary">{presaleInfo.liquidity_percent}</span></p>
            <p>Start time: <span className="text-primary">{presaleInfo.start_block}</span></p>
            <p>End time: <span className="text-primary">{presaleInfo.end_block}</span></p>
            <p>Liquidity lockup time: <span className="text-primary">{presaleInfo.lock_period}</span></p>
            <p>Website: <span className="text-primary">{additionalInfo.website}</span></p>
            <p>Using Team Vesting ?: <span className="text-primary">No</span></p>
            <div className="row">
                <div className="col-md-3">
                    <button type="button" className="btn btn-outline-light btn-fw" disabled={true}>Back</button>
                </div>
                <div className="col-md-3">
                    {true ?
                        <button type="button" className="btn btn-primary btn-fw" onClick={onSubmit}>Submit</button> :
                        <button type="button" className="btn btn-outline-light btn-fw" disabled={true}>Submit</button>}
                </div>
            </div>
        </div>
    )
}

export default function CreateLaunch() {
    const [tokenAddress, setTokenAddress] = useState('')
    const [tokenMetaData, setTokenMetaData] = useState(null)
    const [presaleInfo, setPresaleInfo] = useState({
        presale_owner_account_id: '',
        token_sale_account_id: '',
        token_base_account_id: '',
        token_price: 0,
        max_spend_per_buyer: 0,
        amount: 0,
        hard_cap: 0,
        soft_cap: 0,
        liquidity_percent: 0,
        listing_rate: 0,
        start_block: 0,
        end_block: 0,
        lock_period: 0
    })

    const [additionalInfo, setAdditionalInfo] = useState({
        logo_url: '',
        website: '',
        facebook: '',
        twitter: '',
        github: '',
        telegram: '',
        instagram: '',
        discord: '',
        reddit: '',
        description: '',
    })

    const [step, setStep] = useState(1)

    const onStep1Next = () => {
        setStep(2)
    }
    const onStep2Next = () => {
        setStep(3)
    }
    const onStep3Next = () => {
        setStep(4)
    }

    const onSubmit = async () => {
        let submitPresaleInfo = { ...presaleInfo, ...additionalInfo }
       

        submitPresaleInfo.presale_owner_account_id = window.accountId
        submitPresaleInfo.token_sale_account_id = tokenAddress
        submitPresaleInfo.token_base_account_id = 'wrap.near'
        submitPresaleInfo.amount = submitPresaleInfo.token_price * submitPresaleInfo.hard_cap
        submitPresaleInfo.token_price = parseInt(submitPresaleInfo.token_price)
        submitPresaleInfo.max_spend_per_buyer = parseInt(submitPresaleInfo.max_spend_per_buyer)
        submitPresaleInfo.hard_cap = parseInt(submitPresaleInfo.hard_cap)
        submitPresaleInfo.soft_cap = parseInt(submitPresaleInfo.soft_cap)
        submitPresaleInfo.liquidity_percent = parseInt(submitPresaleInfo.liquidity_percent)
        submitPresaleInfo.listing_rate = parseInt(submitPresaleInfo.listing_rate)
        submitPresaleInfo.lock_period = parseInt(submitPresaleInfo.lock_period)

       

        console.log("🚀 ~ file: CreateLaunch.js ~ line 475 ~ onSubmit ~ submitPresaleInfo", submitPresaleInfo)

        let ftTransferCall = {
            receiverId: tokenAddress,
            functionCalls: [
                {
                    methodName: "storage_deposit",
                    args: {
                        account_id: tokenMetaData.symbol.toLocaleLowerCase()+"launchpad"+config.factoryContractName,
                    },
                    gas: "10000000000000",
                    amount: FT_STORAGE_AMOUNT
                },
                {
                    methodName: "ft_transfer_call",
                    args: {
                        receiver_id: tokenMetaData.symbol.toLocaleLowerCase()+"launchpad"+config.factoryContractName,
                        amount: submitPresaleInfo.amount+"",
                        msg: ""
                    },
                    gas: "60000000000000",
                    amount: ONE_YOCTO_NEAR
                }
            ]
        }

        
        // let createLaunch = {
        //     receiverId: config.factoryContractName,
        //     functionCalls: [
        //         {
        //             methodName: "create_launch",
        //             args: {
        //                 args: submitPresaleInfo,
        //                 symbol: tokenMetaData.symbol.toLocaleLowerCase()
        //             },
        //             gas: GAS,
        //             amount: parseNearAmount('8')
        //         }
        //     ]
        // }
        let transactions = [ftTransferCall]
        await window.factoryContract.create_launch({
            args: submitPresaleInfo,
            symbol: tokenMetaData.symbol.toLocaleLowerCase()
        }, GAS, parseNearAmount('8'))
        await executeMultipleTransactions(transactions)
        

    }

    const onHandlePresaleInfoChange = (key, value) => {
        let oldPresaleInfo = { ...presaleInfo }
        oldPresaleInfo[key] = value
        setPresaleInfo(oldPresaleInfo)
    }

    const onChangeAdditionalInfo = (key, value) => {
        let oldAdditionalInfo = { ...additionalInfo }
        oldAdditionalInfo[key] = value
        setAdditionalInfo(oldAdditionalInfo)
    }

    useEffect(() => {
        bsCustomFileInput.init()
    }, [])

    return (
        <div>
            <div className="row">
                <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <div className="row">
                                <div className="col-9">
                                    <div className="d-flex align-items-center align-self-start">
                                        <h3 className="mb-0">1. Verify Token</h3>
                                    </div>
                                </div>
                                <div className="col-3">
                                    {step > 1 ? <div className="icon icon-box-success ">
                                        <span className="mdi mdi-check-all icon-item"></span>
                                    </div> :
                                        step == 1 && <div className="icon icon-box-danger ">
                                            <span className="mdi mdi-progress-clock icon-item"></span>
                                        </div>}
                                </div>
                            </div>
                            <h6 className="text-muted font-weight-normal">Enter the token address and verify</h6>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <div className="row">
                                <div className="col-9">
                                    <div className="d-flex align-items-center align-self-start">
                                        <h3 className="mb-0">2. DeFi Launchpad Info</h3>
                                    </div>
                                </div>
                                <div className="col-3">
                                    {step > 2 ? <div className="icon icon-box-success ">
                                        <span className="mdi mdi-check-all icon-item"></span>
                                    </div> :
                                        step == 2 && <div className="icon icon-box-danger ">
                                            <span className="mdi mdi-progress-clock icon-item"></span>
                                        </div>}
                                </div>
                            </div>
                            <h6 className="text-muted font-weight-normal">Enter the launchpad information that you want to raise , that should be enter all details about your presale</h6>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <div className="row">
                                <div className="col-9">
                                    <div className="d-flex align-items-center align-self-start">
                                        <h3 className="mb-0">3. Add Additional Info</h3>
                                    </div>
                                </div>
                                <div className="col-3">
                                    {step > 3 ? <div className="icon icon-box-success ">
                                        <span className="mdi mdi-check-all icon-item"></span>
                                    </div> :
                                        step == 3 && <div className="icon icon-box-danger ">
                                            <span className="mdi mdi-progress-clock icon-item"></span>
                                        </div>}
                                </div>
                            </div>
                            <h6 className="text-muted font-weight-normal">Let people know who you are</h6>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <div className="row">
                                <div className="col-9">
                                    <div className="d-flex align-items-center align-self-start">
                                        <h3 className="mb-0">4. Finish</h3>
                                    </div>
                                </div>
                                <div className="col-3">
                                    {step > 4 ? <div className="icon icon-box-success ">
                                        <span className="mdi mdi-check-all icon-item"></span>
                                    </div> :
                                        step == 4 && <div className="icon icon-box-danger ">
                                            <span className="mdi mdi-progress-clock icon-item"></span>
                                        </div>}
                                </div>
                            </div>
                            <h6 className="text-muted font-weight-normal">Review your information</h6>
                        </div>
                    </div>
                </div>
            </div>
            {step == 1 && <VerifyToken
                tokenAddress={tokenAddress}
                tokenMetaData={tokenMetaData}
                setTokenMetaData={setTokenMetaData}
                setTokenAddress={setTokenAddress}
                onNext={onStep1Next}
            />}
            {step == 2 && <LaunchpadInfo
                presaleInfo={presaleInfo}
                onHandlePresaleInfoChange={onHandlePresaleInfoChange}
                onNext={onStep2Next}
            />}
            {step == 3 && <AdditionalInfo
                additionalInfo={additionalInfo}
                onChangeAdditionalInfo={onChangeAdditionalInfo}
                onNext={onStep3Next} />}
            {step == 4 && <ReviewInfomation
                tokenMetaData={tokenMetaData}
                presaleInfo={presaleInfo}
                additionalInfo={additionalInfo}
                onSubmit={onSubmit}
            />}
        </div>
    )
}
