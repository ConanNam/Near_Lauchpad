use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, ext_contract, near_bindgen, setup_alloc, AccountId, Balance, BorshStorageKey, Gas,
    PanicOnDefault, Promise, PromiseOrValue, PromiseResult, Timestamp,
};

setup_alloc!();

pub const DEPOSIT_ONE_YOCTO: Balance = 1;
pub const FT_TRANSFER_GAS: Gas = 10_000_000_000_000;
pub const FT_CALLBACK_GAS: Gas = 10_000_000_000_000;

#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    AirdropKey,
}

pub trait FungibleTokenReceiver {
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128>;
}

#[ext_contract(ext_adf_contract)]
pub trait AirdropFactory {
    fn update_airdrop(
        &mut self,
        airdrop_id: String,
        participents: Vec<Account>,
    );
}

#[ext_contract(ext_ft_contract)]
pub trait FungibleTokenCore {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>);
}

#[ext_contract(ext_self)]
pub trait ExtAirdropContract {
    fn ft_tranfer_callback(
        &mut self,
        amount: U128,
        account_id: AccountId,
        token_can_claimed: U128,
        times_claimed: u64,
    ) -> U128;
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

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct AirdropInfo {
    pub ft_contract_id: AccountId,
    pub status: u8,
    pub vesting_duration: Timestamp,
    pub vesting_interval: Timestamp,
    pub participents: Vec<Account>,
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
pub struct Airdrop {
    pub ft_contract_id: AccountId,
    pub status: u8,
    pub vesting_duration: Timestamp,
    pub vesting_interval: Timestamp,
    pub participents: UnorderedMap<AccountId, Account>,
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
impl Airdrop {
    #[init]
    pub fn new(
        ft_contract_id: AccountId,
        status: u8,
        vesting_duration: Timestamp,
        vesting_interval: Timestamp,
        participents: std::collections::HashMap<AccountId, Account>,
        symbol: String,
        time_start: u64,
        total_token_airdrop: U128,
        total_claimed: U128,
        owner_id: AccountId,
        airdrop_id: AccountId,

        airdrop_title: String,
        logo_url: String,
        website: String,
        facebook: Option<String>,
        twitter: Option<String>,
        github: Option<String>,
        telegram: Option<String>,
        instagram: Option<String>,
        discord: Option<String>,
        description: Option<String>,
    ) -> Self {
        Airdrop {
            ft_contract_id,
            status,
            vesting_duration,
            vesting_interval,
            participents: UnorderedMap::new(StorageKey::AirdropKey),
            symbol,
            time_start,
            airdrop_title,
            logo_url,
            website,
            facebook,
            twitter,
            github,
            telegram,
            instagram,
            discord,
            description,
            total_claimed: U128(0),
            total_token_airdrop: U128(0),
            owner_id,
            airdrop_id,
        }
    }

    pub fn get_status_airdrop(&mut self) -> u8 {
        if self.time_start >= env::block_timestamp()
            && self.total_claimed.0 <= self.total_token_airdrop.0
            && self.status != 0
        {
            self.status = 0;
            self.status
        } else if self.time_start <= env::block_timestamp()
            && self.total_claimed.0 <= self.total_token_airdrop.0
            && self.status != 1
        {
            self.status = 1;
            self.status
        } else {
            if self.status != 2 {
                self.status = 2
            }
            self.status
        }
    }

    pub fn add_participents(&mut self, participents: Vec<Account>) {
        let account_id = env::predecessor_account_id();
        assert_eq!(account_id, self.owner_id, "You dont have permistion!");
        for person in participents {
            assert!(
                self.participents
                    .insert(&person.account_id, &person)
                    .is_none(),
                "Dupplicate patacipent!"
            );
        }
    }

    pub fn get_all_partacipents(&self) -> Vec<Account> {
        let list = self.participents.values_as_vector();
        (0..list.len())
            .filter_map(|index| list.get(index))
            .collect()
    }

    pub fn get_airdrop_info(&self) -> AirdropInfo {
        AirdropInfo {
            ft_contract_id: self.ft_contract_id.clone(),
            status: self.status,
            vesting_duration: self.vesting_duration,
            vesting_interval: self.vesting_interval,
            participents: self.get_all_partacipents(),
            symbol: self.symbol.clone(),
            time_start: self.time_start,
            total_token_airdrop: self.total_token_airdrop,
            total_claimed: self.total_claimed,
            owner_id: self.owner_id.clone(),
            airdrop_id: self.airdrop_id.clone(),
            airdrop_title: self.airdrop_title.clone(),
            logo_url: self.logo_url.clone(),
            website: self.website.clone(),
            facebook: self.facebook.clone(),
            twitter: self.twitter.clone(),
            github: self.github.clone(),
            telegram: self.telegram.clone(),
            instagram: self.instagram.clone(),
            discord: self.discord.clone(),
            description: self.description.clone(),
        }
    }

    #[private]
    pub fn deposit_token(&mut self, amount: U128) -> Promise {
        assert_eq!(
            self.ft_contract_id,
            env::predecessor_account_id(),
            "ERR_INVALID_FT_CONTRACT_ID"
        );
        self.total_token_airdrop = amount;
        let contract_factory = "airdropdev-factory.testnet".to_owned();
        let partacipents = self.participents.values_as_vector();
        ext_adf_contract::update_airdrop(
            self.airdrop_id.clone(),
            (0..partacipents.len())
                .filter_map(|index| partacipents.get(index))
                .collect(),
            &contract_factory,
            0,
            FT_CALLBACK_GAS,
        )
    }

    pub fn get_account_detail(&self, account_id: AccountId) -> Option<Account> {
        self.participents.get(&account_id)
    }

    #[payable]
    pub fn claim_token(&mut self) -> Promise {
        let account_id = env::predecessor_account_id();
        let account = self
            .participents
            .get(&account_id)
            .unwrap_or_else(|| env::panic(b"you don't have permistion claim"));
        assert_ne!(
            account.total_reward, account.pre_reward,
            "Can't claim, you claimed full token!"
        );
        assert!(
            self.time_start <= env::block_timestamp(),
            "Not time start to claim"
        );

        assert!(account.claim_availble, "Not time can claim, please wait");

        let times_can_claim = self.vesting_duration / self.vesting_interval;
        let token_can_claim = account.total_reward.0 / times_can_claim as u128;

        let time_begin_start_to_current = env::block_timestamp() - self.time_start;
        let mut times_claimed = time_begin_start_to_current / self.vesting_interval;
        let mut token_can_claimed = token_can_claim * times_claimed as u128;

        assert!(times_claimed > 0, "ERR_not_enough_vesting_duration");

        if times_claimed >= times_can_claim {
            times_claimed = times_can_claim;
            token_can_claimed = token_can_claim * times_claimed as u128;
            token_can_claimed +=
                account.total_reward.0 - (times_can_claim) as u128 * token_can_claim;
        }

        assert!(token_can_claimed > 0, "Claimed token must > 0");
        env::log(String::from(token_can_claimed.to_string() + "token can claimed").as_bytes());

        ext_ft_contract::ft_transfer(
            account.account_id.clone(),
            U128(token_can_claimed),
            Some("claimed token".to_string()),
            &self.ft_contract_id,
            DEPOSIT_ONE_YOCTO,
            FT_TRANSFER_GAS,
        )
        .then(ext_self::ft_tranfer_callback(
            U128(token_can_claimed),
            account_id.clone(),
            U128(token_can_claimed),
            times_claimed,
            &env::current_account_id(),
            0,
            FT_CALLBACK_GAS,
        ))
    }

    #[private]
    pub fn ft_tranfer_callback(
        &mut self,
        amount: U128,
        account_id: AccountId,
        token_can_claimed: U128,
        times_claimed: u64,
    ) -> U128 {
        assert_eq!(env::promise_results_count(), 1, "ERR_TOO_MANY_RESULT");

        match env::promise_result(0) {
            PromiseResult::NotReady => unreachable!(),
            PromiseResult::Failed => env::panic(b"ERR_CALLBACK"),
            PromiseResult::Successful(_value) => {
                let account = self.participents.get(&account_id).unwrap();
                let new_account = Account {
                    account_id,
                    total_reward: account.total_reward,
                    pre_reward: U128(account.pre_reward.0 + token_can_claimed.0),
                    last_time_claim: env::block_timestamp(),
                    time_can_claim: env::block_timestamp()
                        + (times_claimed + 1) * self.vesting_interval,
                    claim_availble: env::block_timestamp()
                        >= env::block_timestamp() + (times_claimed + 1) * self.vesting_interval,
                    times_claimed,
                };
                self.participents.insert(&account.account_id, &new_account);
                self.status = self.get_status_airdrop();
                self.total_claimed = U128(self.total_claimed.0 + amount.0);
                amount
            }
        }
    }
}

#[near_bindgen]
impl FungibleTokenReceiver for Airdrop {
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        self.deposit_token(amount);

        PromiseOrValue::Value(U128(0))
    }
}

// #[cfg(test)]
// mod tests {
//     #[test]
//     fn it_works() {
//         let result = 2 + 2;
//         assert_eq!(result, 4);
//     }
// }
