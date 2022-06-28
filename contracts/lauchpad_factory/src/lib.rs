use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap};
use near_sdk::env::STORAGE_PRICE_PER_BYTE;
use near_sdk::json_types::{ValidAccountId, U128};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::serde_json;
use near_sdk::{
    env, near_bindgen, AccountId, Balance, BlockHeight, BorshStorageKey, Gas, PanicOnDefault,
    Promise,
};

near_sdk::setup_alloc!();

const FT_WASM_CODE: &[u8] =
    include_bytes!("../../lauchpad_contract/out/launchpad_contract.wasm");

const EXTRA_BYTES: usize = 10000;
const GAS: Gas = 50_000_000_000_000;
type TokenId = String;

pub fn is_valid_token_id(token_id: &TokenId) -> bool {
    for c in token_id.as_bytes() {
        match c {
            b'0'..=b'9' | b'a'..=b'z' => (),
            _ => return false,
        }
    }
    true
}

#[derive(BorshSerialize, BorshStorageKey)]
enum StorageKey {
    AccountId,
    StorageDeposits,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct PresaleInfo {
    presale_account_id: AccountId,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct TokenFactory {
    pub presales: UnorderedMap<AccountId, PresaleInfo>,
    pub storage_deposits: LookupMap<AccountId, Balance>,
    pub storage_balance_cost: Balance,
    pub num_projects: u128,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct LaunchArgs {
    /// ======================= Presale Info =======================
    /// owner account id.
    pub presale_owner_account_id: AccountId,

    /// sale token.
    pub token_sale_account_id: AccountId,

    /// base token // usually wNEAR (NEAR).
    pub token_base_account_id: AccountId,

    /// 1 base token = ? s_tokens, fixed price
    pub token_price: u128,

    /// 1 base token = ? s_tokens, fixed price
    pub max_spend_per_buyer: u128,

    /// the amount of presale tokens up for presale
    pub amount: u128,

    pub hard_cap: u128,
    pub soft_cap: u128,

    /// divided by 1000
    pub liquidity_percent: u16,

    /// divided by 1000
    pub listing_rate: u128,

    pub start_block: BlockHeight,
    pub end_block: BlockHeight,

    /// unix timestamp -> e.g. 2 weeks
    pub lock_period: u128,
    //additional_info
    pub logo_url: String,
    pub website: String,
    pub facebook: String,
    pub twitter: String,
    pub github: String,
    pub telegram: String,
    pub instagram: String,
    pub discord: String,
    pub reddit: String,
    pub description: String,
}

#[near_bindgen]
impl TokenFactory {
    #[init]
    pub fn new() -> Self {
        let mut storage_deposits = LookupMap::new(StorageKey::StorageDeposits);

        let initial_storage_usage = env::storage_usage();
        let tmp_account_id = "a".repeat(64);
        storage_deposits.insert(&tmp_account_id, &0);
        let storage_balance_cost =
            Balance::from(env::storage_usage() - initial_storage_usage) * STORAGE_PRICE_PER_BYTE;
        storage_deposits.remove(&tmp_account_id);

        Self {
            presales: UnorderedMap::new(StorageKey::AccountId),
            storage_deposits,
            storage_balance_cost,
            num_projects: 0,
        }
    }

    fn get_min_attached_balance(&self, args: &LaunchArgs) -> u128 {
        ((FT_WASM_CODE.len() + EXTRA_BYTES + args.try_to_vec().unwrap().len() * 2) as Balance
            * STORAGE_PRICE_PER_BYTE)
            .into()
    }

    fn get_min_new_attached_balance(&self, args: &LaunchArgs) -> u128 {
        ((FT_WASM_CODE.len() + EXTRA_BYTES + args.try_to_vec().unwrap().len() * 2) as Balance
            * STORAGE_PRICE_PER_BYTE)
            .into()
    }

    pub fn get_required_deposit(&self, args: LaunchArgs, account_id: ValidAccountId) -> U128 {
        let args_deposit = self.get_min_attached_balance(&args);
        if let Some(previous_balance) = self.storage_deposits.get(account_id.as_ref()) {
            args_deposit.saturating_sub(previous_balance).into()
        } else {
            (self.storage_balance_cost + args_deposit).into()
        }
    }

    #[payable]
    pub fn storage_deposit(&mut self) {
        let account_id = env::predecessor_account_id();
        let deposit = env::attached_deposit();
        if let Some(previous_balance) = self.storage_deposits.get(&account_id) {
            self.storage_deposits
                .insert(&account_id, &(previous_balance + deposit));
        } else {
            assert!(deposit >= self.storage_balance_cost, "Deposit is too low");
            self.storage_deposits
                .insert(&account_id, &(deposit - self.storage_balance_cost));
        }
    }

    pub fn get_number_of_presales(&self) -> u64 {
        self.presales.len()
    }

    pub fn get_presales(&self, from_index: u64, limit: u64) -> Vec<PresaleInfo> {
        let presales = self.presales.values_as_vector();
        (from_index..std::cmp::min(from_index + limit, presales.len()))
            .filter_map(|index| presales.get(index))
            .collect()
    }

    pub fn get_presale(&self, token_id: TokenId) -> Option<PresaleInfo> {
        self.presales.get(&token_id)
    }

    #[payable]
    pub fn create_launch(&mut self, args: LaunchArgs, symbol: String) -> Promise {
        if env::attached_deposit() > 0 {
            // self.storage_deposit();
        }
        assert!(
            env::is_valid_account_id(args.presale_owner_account_id.as_bytes()),
            "The owner account ID is invalid"
        );
        assert!(
            env::is_valid_account_id(args.token_sale_account_id.as_bytes()),
            "The token sale account ID is invalid"
        );
        let required_balance = self.get_min_new_attached_balance(&args);
        let token_id = symbol.to_ascii_lowercase();
        let token_account_id = format!(
            "{}launchpad.{}",
            token_id,
            env::current_account_id()
        );
        self.num_projects += 1;
        let presale_info = PresaleInfo {
            presale_account_id: token_account_id.to_ascii_lowercase(),
        };
        assert!(
            self.presales
                .insert(&token_account_id, &presale_info)
                .is_none(),
            "Token ID is already taken"
        );
        Promise::new(token_account_id)
            .create_account()
            .add_full_access_key(env::signer_account_pk())
            .transfer(required_balance)
            .deploy_contract(FT_WASM_CODE.to_vec())
            .function_call(b"init".to_vec(), serde_json::to_vec(&args).unwrap(), 0, GAS)
    }
}
