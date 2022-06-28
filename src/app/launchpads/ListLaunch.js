import React, { useEffect, useState } from 'react'

export default function ListLaunch() {

    const [presaleData, setPresaleData] = useState([])

    useEffect(() => {
        getListPresale()
    }, [])

    const getListPresale = async () => {
        const data = await window.factoryContract.get_presales({
            from_index: 0,
            limit: 10
        })
        console.log('data', data)
        setPresaleData(data)
    }
    return (
        <div>
            <h1>Current Presale</h1>
            <div className="row">
                {presaleData.map((e, i) =>
                    <div className="col-sm-4 grid-margin" key={i.toString()}>
                        <div className="card">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-8 col-sm-12 col-xl-8 my-auto" style={{ alignItems: 'center' }}>
                                        <h3>DRV</h3>
                                        <h3><small className="text-muted">1 NEAR = {e.token_price} DRV</small></h3>
                                    </div>
                                    <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                                        <div className="preview-thumbnail">
                                            <img src={require('../../assets/images/faces/face6.jpg')} style={{ width: 64 }} alt="face" className="rounded-circle" />
                                        </div>
                                    </div>
                                </div>

                                <br />
                                <label>Soft/Hard Cap:</label>
                                <h2 className="mb-0">${e.soft_cap} NEAR - {e.hard_cap} NEAR</h2>
                                <br />
                                <label>Progress (40.00%)</label>
                                <div className="progress progress-md portfolio-progress">
                                    <div className="progress-bar bg-success" role="progressbar" style={{ width: '40%' }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <br />
                                <h6>Liquidity %: <span className="text-muted">75%</span></h6>
                                <h6>Lockup Time: <span className="text-muted">30 minutes</span></h6>
                                <div className=" border-bottom" >
                                    <br />
                                </div>
                                <br />
                                <div className="row" style={{ alignItems: 'center' }} >
                                    <div className="col-8 col-sm-12 col-xl-8 my-auto">
                                        <label>Sale Starts In:</label>
                                        <h6>25:14:38:00</h6>
                                    </div>
                                    <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                                        <button type="button" className="btn btn-primary btn-rounded ml-auto">View Pool</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>)}
            </div>
        </div>
    )
}
