use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedMap;
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::serde_json;
use near_sdk::{
    env, ext_contract, near_bindgen, setup_alloc, AccountId, Balance, BorshStorageKey, Gas,
    PanicOnDefault, Promise, PromiseResult, Timestamp,
};
use std::collections::HashMap;

setup_alloc!();

type AirDropId = String;

const DEPLOY_FEE: u128 = 5_000_000_000_000_000_000_000_000;
const COVER_AIRDROP_FEE: u128 = 3_000_000_000_000_000_000_000_000;
const GAS: Gas = 50_000_000_000_000;
const AD_WASM_CODE: &[u8] = include_bytes!("../../airdrop_contract/out/airdrop-contract.wasm");

#[ext_contract(ext_self)]
pub trait ExtAirdropContract {
    fn airdrop_deploy_callback(
        &mut self,
        airdrop_id: AccountId,
        args: AirdropArgs,
        airdrop_contract_id: AccountId,
    ) -> bool;
    //fn ft_withdraw_callback(&mut self, account_id:AccountId, old_account:Account);
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Account {
    pub account_id: AccountId,
    pub total_reward: U128,
    pub pre_reward: U128,
    pub last_time_claim: u64,
    pub time_can_claim: u64,
    pub claim_availble: bool,
    pub times_claimed: u64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct AirdropInfo {
    owner_id: AccountId,
    pub airdrop_launched: u64,
    pub participents_alltime: u64,
}

#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    AirdropKey,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct AirdropArgs {
    pub ft_contract_id: AccountId,
    pub status: u8,
    pub vesting_duration: Timestamp,
    pub vesting_interval: Timestamp,
    pub participents: HashMap<AccountId, Account>,
    pub symbol: String,
    pub time_start: u64,
    pub total_token_airdrop: U128,
    pub total_claimed: U128,
    pub owner_id: AccountId,
    pub airdrop_id: AccountId,

    pub airdrop_title: String,
    pub logo_url: String,
    pub website: String,
    pub facebook: Option<String>,
    pub twitter: Option<String>,
    pub github: Option<String>,
    pub telegram: Option<String>,
    pub instagram: Option<String>,
    pub discord: Option<String>,
    pub description: Option<String>,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct AirDropFactory {
    pub owner_id: AccountId,
    pub airdrop_launched: u64,
    pub participents_alltime: u64,
    pub airdrops: UnorderedMap<AirDropId, AirdropArgs>,
    pub address_airdrops: UnorderedMap<AirDropId, AccountId>,
}

#[near_bindgen]
impl AirDropFactory {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        AirDropFactory {
            owner_id,
            airdrop_launched: 0,
            participents_alltime: 0,
            airdrops: UnorderedMap::new(StorageKey::AirdropKey),
            address_airdrops: UnorderedMap::new(b"ada".to_vec()),
        }
    }

    pub fn get_airdrop_factory_info(&self) -> AirdropInfo {
        AirdropInfo {
            owner_id: self.owner_id.clone(),
            airdrop_launched: self.airdrop_launched,
            participents_alltime: self.participents_alltime,
        }
    }

    pub fn get_all_airdrops(&self, from_index: u64, limit: u64) -> Vec<AirdropArgs> {
        let list_airdrops = self.airdrops.values_as_vector();
        (from_index..std::cmp::min(from_index + limit, list_airdrops.len()))
            .filter_map(|index| list_airdrops.get(index))
            .collect()
    }

    pub fn get_airdrop(&self, airdrop_id: AirDropId) -> Option<AirdropArgs> {
        self.airdrops.get(&airdrop_id)
    }

    pub fn get_airdrop_contract_id(&self, airdrop_id: AccountId) -> AccountId {
        self.address_airdrops.get(&airdrop_id).unwrap()
    }

    #[payable]
    pub fn create_airdrop(&mut self, args: AirdropArgs) -> Promise {
        let deposit = env::attached_deposit();
        assert_eq!(deposit, DEPLOY_FEE, "Not enough deploy fee!");
        let airdrop_id = args.symbol.to_ascii_lowercase();
        let airdrop_account_id =
            format!("{}.{}", &airdrop_id, &env::current_account_id()).to_string();
        // assert!(
        //     self.airdrops.insert(&airdrop_id, &args).is_none(),
        //     "Airdrop is already taken"
        // );
        self.airdrops.insert(&airdrop_id, &args);

        Promise::new(airdrop_account_id.clone())
            .create_account()
            .transfer(COVER_AIRDROP_FEE)
            .deploy_contract(AD_WASM_CODE.to_vec())
            .function_call(b"new".to_vec(), serde_json::to_vec(&args).unwrap(), 0, GAS)
            .then(ext_self::airdrop_deploy_callback(
                airdrop_id.clone(),
                args,
                airdrop_account_id.clone(),
                &env::current_account_id(),
                0,
                GAS,
            ))
    }

    pub fn update_airdrop(&mut self, airdrop_id: String, participents: Vec<Account>) {
        let mut airdrop = self
            .airdrops
            .get(&airdrop_id)
            .unwrap_or_else(|| env::panic(b"Invalid airdrop_id"));
        for person in participents {
            airdrop.total_token_airdrop =
                U128(airdrop.total_token_airdrop.0 + person.total_reward.0);
            airdrop
                .participents
                .insert(person.account_id.clone(), person);
        }
        //self.participents_alltime += participents.len();
        self.airdrops.insert(&airdrop_id, &airdrop);
    }

    #[private]
    pub fn airdrop_deploy_callback(
        &mut self,
        airdrop_id: AccountId,
        args: AirdropArgs,
        airdrop_contract_id: AccountId,
    ) -> bool {
        assert_eq!(env::promise_results_count(), 1, "ERR_TOO_MANY_RESULT");
        match env::promise_result(0) {
            PromiseResult::NotReady => unreachable!(),
            PromiseResult::Failed => env::panic(b"ERR_CALLBACK"),
            PromiseResult::Successful(_value) => {
                self.airdrop_launched += 1;
                self.airdrops.insert(&airdrop_id, &args);
                self.address_airdrops
                    .insert(&airdrop_id, &airdrop_contract_id);
                true
            }
        }
    }
}
