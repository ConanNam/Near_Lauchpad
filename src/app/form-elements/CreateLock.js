import React, { Component, useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import bsCustomFileInput from 'bs-custom-file-input';
import { createLock } from '../../utils/lock-contract'
import DatePicker from "react-datepicker";
import { Contract } from 'near-api-js'
import { wallet, parseTokenWithDecimals } from '../../utils/near'
import BN from 'bn.js';

function toTimestamp(strDate) {
    var datum = Date.parse(strDate);
    return datum / 1000;
}
const getNow = (unix_timestamp) => {
    var now = new Date(unix_timestamp * 1000);
    const hours = `0${now.getHours()}`.slice(-2);
    const minutes = `0${now.getMinutes()}`.slice(-2);
    const month = `0${now.getMonth()}`.slice(-2);
    const day = `0${now.getDate()}`.slice(-2);
    var time = now.getFullYear() + "." + month + "." + day + " " + hours + ":" + minutes + "UTC"
    return time
}

export default function CreateLock() {
    const [token, setToken] = useState();
    const [amount, setAmount] = useState();
    const [endDate, setEndDate] = useState(new Date());
    const [ftmetadata, setFtmetadata] = useState();
    const [balance, setBalance] = useState(0);
    const handleCreateLock = (e) => {
        e.preventDefault()
        const time = toTimestamp(endDate);
        console.log(time);
        const amountTmp = new BN(amount).mul(new BN('10').pow(new BN(ftmetadata.decimals))).toString()
        createLock(token, amountTmp, time);
    }
    useEffect(() => {
        const ftContract = new Contract(
            wallet.account(),
            token,
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
        const getBalance = async () => {
            let balance = "0"
            balance = await ftContract.ft_balance_of({ account_id: wallet.getAccountId() });

            setBalance(parseTokenWithDecimals(parseInt(balance), 24))
        }
        getFTMetadata()
        getBalance()
        console.log(balance);
    }, [token]);
    return (
        <div>
            <div className="col-12 grid-margin stretch-card">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Create your lock</h4>
                        <form className="forms-sample">
                            <Form.Group>
                                <label htmlFor="token">Token or LP Token address*</label>
                                <Form.Control type="text" className="form-control" id="exampleInputName1" placeholder="Enter token or LP token address" value={token} onChange={(e) => setToken(e.target.value)} />
                            </Form.Group>
                            {
                                ftmetadata && token && (
                                    <Form.Group className="ml-5">
                                        <label htmlFor="token">Name</label>
                                        <p className="form-control">{ftmetadata.name}</p>
                                        <label htmlFor="token">Symbol</label>
                                        <p className="form-control">{ftmetadata.symbol}</p>
                                        <label htmlFor="token">Decimals</label>
                                        <p className="form-control">{ftmetadata.decimals}</p>
                                    </Form.Group>
                                )
                            }
                            <Form.Group>
                                <label htmlFor="amount">Amount*</label>
                                <Form.Control type="text" className="form-control" id="exampleInputName2" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                {ftmetadata && token && <label htmlFor="amount" className="mt-3">Balance: {balance}</label>}
                            </Form.Group>
                            <Form.Group >
                                <label className="col-form-label">Lock until (UTC time)*</label>
                                <div>
                                    <DatePicker className="form-control"
                                        selected={endDate}
                                        onChange={setEndDate}
                                        minDate={new Date()}
                                        showTimeSelect
                                        dateFormat="Pp"
                                    />
                                </div>
                            </Form.Group>
                            <div>
                                <button disabled={ftmetadata && token && amount <= balance ? false : true} type="submit" className="btn btn-primary mr-2 mt-2" onClick={(e) => handleCreateLock(e)}>Lock</button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

