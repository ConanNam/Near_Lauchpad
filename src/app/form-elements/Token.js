import React, { useEffect, useState } from 'react';
import { getTokenLocks, unlockToken, getMyLocks } from '../../utils/lock-contract'
import { Contract } from 'near-api-js'
import { wallet, parseTokenWithDecimals } from '../../utils/near'
import BN from 'bn.js';

const getDatetime = (unix_timestamp) => {
    var now = new Date(unix_timestamp * 1000);
    const hours = `0${now.getHours()}`.slice(-2);
    const minutes = `0${now.getMinutes()}`.slice(-2);
    const month = `0${now.getMonth() + 1}`.slice(-2);
    const day = `0${now.getDate()}`.slice(-2);
    var time = now.getFullYear() + "." + month + "." + day + " " + hours + ":" + minutes + " UTC"
    return time
}
const getDatetime2 = (unix_timestamp) => {
    var now = new Date(unix_timestamp / 1000000);
    const hours = `0${now.getHours()}`.slice(-2);
    const minutes = `0${now.getMinutes()}`.slice(-2);
    const month = `0${now.getMonth() + 1}`.slice(-2);
    const day = `0${now.getDate()}`.slice(-2);
    var time = now.getFullYear() + "." + month + "." + day + " " + hours + ":" + minutes + " UTC"
    return time
}
function toTimestamp(strDate) {
    var datum = Date.parse(strDate);
    return datum / 1000;
}
const TokenLock = ({ tokenLock, handleUnLock }) => {
    const { lock_id, ft_contract_id, owner_id, amount, end_emission, lock_date } = tokenLock
    const [ftmetadata, setFtmetadata] = useState();

    useEffect(() => {
        const ftContract = new Contract(
            wallet.account(),
            ft_contract_id,
            {
                viewMethods: ["ft_metadata", "ft_balance_of", "storage_balance_of"],
                changeMethods: ["ft_transfer", "ft_transfer_call"]
            }
        )

        const getFTMetadata = async () => {
            const metadata = await ftContract.ft_metadata({})
            setFtmetadata(metadata)
        }
        getFTMetadata()
    }, []);
    return (
        <tr key={lock_id}>
            <td>{ft_contract_id}</td>
            <td>{owner_id}</td>
            <td>{ftmetadata ? new BN(amount).div(new BN('10').pow(new BN(ftmetadata.decimals))).toString() : null}</td>
            <td>{getDatetime(end_emission)}</td>
            <td>{getDatetime2(lock_date)}</td>
            <td>
                <button disabled={end_emission <= toTimestamp(new Date()) ? false : true} type="submit" className="btn btn-primary mr-2" onClick={(e) => handleUnLock(e, ft_contract_id, lock_id)}>Unlock</button>
            </td>
        </tr>
    )
}
export default function Token() {
    const [tokens, setTokens] = useState([]);
    const [allTokens, setAllTokens] = useState([]);
    const [all, setAll] = useState(true);
    useEffect(() => {
        const res = getMyLocks();
        res.then(res => {
            setTokens(res)
        })
    }, []);
    useEffect(() => {
        const res = getTokenLocks();
        res.then(res => {
            res = res.map(e => ({...e, amount: new BN(e.amount).div(new BN('10').pow(new BN(24))).toString()}))
            let arr = []
            res.forEach(e => {
                const x = arr.findIndex(i => i.ft_contract_id === e.ft_contract_id)
                if(x >= 0) {
                    arr[x].amount += parseInt(e.amount)
                } else {
                    arr.push({ft_contract_id: e.ft_contract_id, amount: parseInt(e.amount)})
                }
            })
            console.log('arr', arr)
            setAllTokens(arr)
        })
    }, []);
    const handleUnLock = (e, ft_contract_id, lock_id) => {
        e.preventDefault();
        unlockToken(ft_contract_id, lock_id)
        // call unlock
        // update 
        const res = getMyLocks();
        res.then(res => {
            console.log('res', res)
            setTokens(res)
        })
    }
    const renderTableData = () => {
        return tokens.map((tokenLock, index) => {
            return <TokenLock tokenLock={tokenLock} handleUnLock={handleUnLock} />

        })
    }

    const renderTableHeader = () => {
        const header = ["Token", "Wallet address", "Amount", "Time Lock Until", "Lock Date", ""]
        return (
            header.map((key, index) => <th key={index}>{key.toUpperCase()}</th>)
        )
    }
    const renderTableDataAll = () => {
        return allTokens.map((tokenLock, index) => {
            const {ft_contract_id, amount } = tokenLock
            return (
                <tr key={index}>
                    <td className="col-md-6">{ft_contract_id}</td>
                    <td className="col-md-6">{amount}</td>
                </tr>
            )

        })
    }

    const renderTableHeaderAll = () => {
        const header = ["Token Address", "Total lock", ""]
        return (
            header.map((key, index) => <th key={index}>{key.toUpperCase()}</th>)
        )
    }
    return (
        <div>
            <div className=" ml-3">
                <div className={`page-title btn ${all? 'text-success': 'text-white'}`} onClick={() => { setAll(true) }}> All  </div>
                <div className={`btn ml-5 ${!all? 'text-success': 'text-white'}`} onClick={() => { setAll(false) }}> My locks </div>
            </div>
            <div className="table col-12">
                {
                    all ?
                        <table>
                            <tbody>
                                <tr>{renderTableHeaderAll()}</tr>
                                {renderTableDataAll()}
                            </tbody>
                        </table>
                        :
                        <table>
                            <tbody>
                                <tr>{renderTableHeader()}</tr>
                                {renderTableData()}
                            </tbody>
                        </table>
                }

            </div>
        </div>
    )

}

