use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedMap;
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, near_bindgen, setup_alloc, AccountId, Balance, Gas, PanicOnDefault, Promise,
    PromiseOrValue, Timestamp, ext_contract, PromiseResult
};

pub const DEPOSIT_ONE_YOCTO: Balance = 1;
pub const NO_DEPOSIT: Balance = 0;
pub const FT_TRANSFER_GAS: Gas = 10_000_000_000_000;
pub const FT_HARVEST_CALLBACK_GAS: Gas = 10_000_000_000_000;

near_sdk::setup_alloc!();

#[ext_contract(ext_ft_contract)]
pub trait FungibleToken {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>);
}

#[ext_contract(ext_self)]
pub trait ExtStakingContract {
    fn ft_withdraw_callback(&mut self, lock: LockParams);
}

#[derive(Serialize, Deserialize, Clone, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct LockParams {
    pub lock_id: String,
    pub owner_id: AccountId,
    pub ft_contract_id: AccountId,
    pub amount: U128,
    pub end_emission: Timestamp,
    pub lock_date: Timestamp
}

#[derive(BorshDeserialize, BorshSerialize)]
#[near_bindgen]
pub struct LockContract {
    lock_params: UnorderedMap<AccountId, Vec<LockParams>>,
    token_locks: UnorderedMap<AccountId, u128>,
}

impl Default for LockContract {
    fn default() -> Self {
        Self {
            lock_params: UnorderedMap::new(b"td".to_vec()),
            token_locks: UnorderedMap::new(b"vd".to_vec()),
        }
    }
}

#[near_bindgen]
impl LockContract {
    pub fn get_locks_by_account(&self, account_id: AccountId) -> Vec<LockParams> {
        match self.lock_params.get(&account_id) {
            Some(lock_params) => lock_params,
            None => vec![],
        }
    }
    pub fn get_all_locks(&self) -> Vec<LockParams> {
        let vec = self.lock_params.values();
        let mut result = Vec::new();
        for v in vec {
            for i in v {
                result.push(i);
            }
        }
        result
    }

    #[payable]
    pub fn create_lock(
        &mut self,
        owner_id: AccountId,
        ft_contract_id: AccountId,
        amount: U128,
        end_emission: Timestamp,
    ) {
        let owner_id_tmp = owner_id.clone();
        let ft_contract_id_tmp = ft_contract_id.clone();
        let amount_tmp = amount.clone();
        // add vector
        let lock_id = bs58::encode(env::sha256(&env::random_seed())).into_string();
        let lock_param = LockParams {
            lock_id,
            owner_id,
            ft_contract_id,
            amount,
            end_emission,
            lock_date: env::block_timestamp()
        };
        match self.lock_params.get(&owner_id_tmp) {
            Some(mut lock_params) => {
                lock_params.push(lock_param);
                self.lock_params.insert(&owner_id_tmp, &lock_params);
            }
            None => {
                let mut vec = Vec::new();
                vec.push(lock_param);
                self.lock_params.insert(&owner_id_tmp, &vec);
            }
        }
        //
        match self.token_locks.get(&ft_contract_id_tmp) {
            Some(mut token_locks) => {
                token_locks += &amount_tmp.0;
            }
            None => {
                self.token_locks.insert(&ft_contract_id_tmp, &amount_tmp.0);
            }
        }
    }

    #[payable]
    pub fn unlock_token(&mut self, owner_id: AccountId, ft_contract_id: AccountId, lock_id: String) -> bool {
        // get lock by owner_id
        //update total lock of token
        //update list of token lock of account
        let account_id = env::predecessor_account_id();
        let ft_contract_id_tmp = ft_contract_id.clone();
        let mut lock_tmp;
        match self.lock_params.get(&owner_id) {
            Some(mut lock_params) => {
                for lock in lock_params.iter() {
                    if (lock.lock_id == lock_id && lock.end_emission <= env::block_timestamp()) {
                        lock_tmp = lock.clone();
                        ext_ft_contract::ft_transfer(
                            account_id.clone(),
                            lock_tmp.amount,
                            Some("Staking contract withdraw".to_string()), 
                            &ft_contract_id, 
                            DEPOSIT_ONE_YOCTO, 
                            FT_TRANSFER_GAS
                        ).then(ext_self::ft_withdraw_callback(
                            lock_tmp.clone(),
                            &env::current_account_id(), 
                            NO_DEPOSIT, 
                            FT_HARVEST_CALLBACK_GAS)
                        );
                    }
                }
                lock_params.retain(|x| x.lock_id != lock_id);
                self.lock_params.insert(&owner_id, &lock_params);
                
                
                true
                // let the_vocabulary: Vec<LockParams> = lock_params
                //     .iter()
                //     .filter(|voc| voc.lock_id == lock_id)
                //     .cloned()
                //     .collect();
                // let lock = the_vocabulary.get(0);
                // match lock {
                //     Some(lock) => {
                //         // check time
                //         assert!(
                //             lock.end_emission <= env::block_timestamp(),
                //             "ERR_NOT_YET_BE_UNLOCK"
                //         );

                //         // remove
                //         lock_params.retain(|x| x.lock_id != lock_id);
                //         self.lock_params.insert(&owner_id, &lock_params);

                //         // update token total lock
                //         match self.token_locks.get(&ft_contract_id_tmp) {
                //             Some(mut token_locks) => {
                //                 token_locks -= &lock.amount;
                //                 // ext_ft_contract::ft_transfer(
                //                 //     account_id.clone(),
                //                 //     U128(lock.amount),
                //                 //     Some("Staking contract withdraw".to_string()), 
                //                 //     &ft_contract_id, 
                //                 //     DEPOSIT_ONE_YOCTO, 
                //                 //     FT_TRANSFER_GAS
                //                 // ).then(ext_self::ft_withdraw_callback(
                //                 //     lock.clone(),
                //                 //     &env::current_account_id(), 
                //                 //     NO_DEPOSIT, 
                //                 //     FT_HARVEST_CALLBACK_GAS)
                //                 // );
                //                 true
                //             }
                //             None => false,
                //         }
                //         // transfer token from lockcontract to owner_id
                        
                //     }
                //     None => false,
                // }
            }
            None => false,
        }
    }

    // #[private]
    // #[init(ignore_state)]
    // pub fn migrate() -> Self {
    //     let contract_v1: LockParamsV1 = env::state_read().expect("Can not read state data");

    //     let contract_v2 = LockParams {
    //         owner_id: contract_v1.owner_id,
    //         ft_contract_id: contract_v1.ft_contract_id,
    //         amount: contract_v1.amount,
    //         end_emission: contract_v1.end_emission,
    //     }
    // }
    pub fn ft_withdraw_callback(&mut self, lock: LockParams) -> U128 {

        match env::promise_result(0) {
            PromiseResult::NotReady => unreachable!(),
            PromiseResult::Successful(_value) => {
                lock.amount
            },
            PromiseResult::Failed => {
                // handle rollback data

                U128(0)
            }
        }
    }
}


pub trait FungibleTokenReceiver {
    fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> PromiseOrValue<U128>;
}

#[near_bindgen]
impl FungibleTokenReceiver for LockContract {
    fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> PromiseOrValue<U128> {
        
        PromiseOrValue::Value(U128(0))
    }
}
