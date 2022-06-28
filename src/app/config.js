const CONTRACT_NAME = process.env.CONTRACT_NAME || 'new-app'
const FACTORY_CONTRACT_NAME = 'launchpad-factoryv1.testnet'

function getConfig(env) {
  switch (env) {
      case 'production':
      case 'mainnet':
          return {
              networkId: 'mainnet',
              nodeUrl: 'https://rpc.mainnet.near.org',
              walletUrl: 'https://wallet.near.org',
              helperUrl: 'https://helper.mainnet.near.org',
              explorerUrl: 'https://explorer.mainnet.near.org',
              AIRDROP_FACTORY_CONTRACT: 'airdropdev-factory.near',
              factoryContractName: FACTORY_CONTRACT_NAME,
          }
      case 'development':
      case 'testnet':
          return {
              networkId: 'testnet',
              nodeUrl: 'https://rpc.testnet.near.org',
              walletUrl: 'https://wallet.testnet.near.org',
              helperUrl: 'https://helper.testnet.near.org',
              explorerUrl: 'https://explorer.testnet.near.org',
              AIRDROP_FACTORY_CONTRACT: 'airdropdev-factory.testnet',
              factoryContractName: FACTORY_CONTRACT_NAME,
              LOCKTOKEN_FACTORY_CONTRACT: 'lock-contract-v1.testnet',
          }
      default:
          throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
  }
}

export default getConfig;
