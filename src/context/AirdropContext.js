import React, { useState, createContext } from 'react'


const AirdropContext = createContext()

const AirdropProvider = ({ children }) => {

    const localTokenAddress = localStorage.getItem('tokenAddress') ?? ''
    const localSymbol = localStorage.getItem('symbolToken') ?? ''

    const [tokenAddress, setTokenAddress] = useState(localTokenAddress)
    console.log("🚀 ~ file: AirdropContext.js ~ line 9 ~ AirdropProvider ~ tokenAddress", tokenAddress)
    const [symbolToken, setSymbolToken] = useState(localSymbol)
    console.log("🚀 ~ file: AirdropContext.js ~ line 11 ~ AirdropProvider ~ symbolToken", symbolToken)
    


    return (
        <AirdropContext.Provider value={
            {
                tokenAddress,
                setTokenAddress,
                symbolToken,
                setSymbolToken,
                localSymbol,
                localTokenAddress
            }
        }>
            {children}
        </AirdropContext.Provider>
    )
}

export { AirdropContext, AirdropProvider }