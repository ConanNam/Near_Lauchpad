use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::LookupMap;
use near_sdk::json_types::U128;
use near_sdk::{
    env, ext_contract, near_bindgen, AccountId, Balance, BlockHeight, BorshStorageKey, Gas,
    PanicOnDefault, Promise, PromiseOrValue, PromiseResult,
};

near_sdk::setup_alloc!();

pub const DEPOSIT_ONE_YOCTO: Balance = 1;
pub const NO_DEPOSIT: Balance = 0;
pub const FT_TRANSFER_GAS: Gas = 10_000_000_000_000;
pub const FT_HARVEST_CALLBACK_GAS: Gas = 10_000_000_000_000;
pub const NEAR_LAUNCHPAD_ADDRESS: &str = "dragonvu.near";

#[ext_contract(ext_ft_contract)]
pub trait FungibleToken {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: u128, memo: Option<String>);
}

#[ext_contract(ext_self)]
pub trait ExtStakingContract {
    fn ft_withdraw_callback(&mut self, account_id: AccountId);
}

pub trait FungibleTokenReceiver {
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128>;
}

#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    AccountKey,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct NearLaunchpadContract {
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

    pub presale_status: PresaleStatus,

    pub buyer_info: LookupMap<AccountId, BuyerInfo>,

    pub additional_info: AdditionalInfo,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct PresaleStatus {
    /// ======================= Presale Status =======================
    /// final flag required to end a presale and enable withdrawls
    pub lp_generation_complete: bool,

    /// set this flag to force fail the presale
    pub force_failed: bool,
    /// total base currency raised (usually NEAR)
    pub total_base_collected: u128,

    /// total presale tokens sold
    pub total_token_sold: u128,

    /// total tokens withdrawn post successful presale
    pub total_token_withdrawn: u128,

    /// total base tokens withdrawn on presale failure
    pub total_base_withdrawn: u128,

    /// number of unique participants
    pub num_buyers: u16,
    // Set once LP GENERATION is complete.
    // pub presale_end_date: u128,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct BuyerInfo {
    /// total base token (usually NEAR) deposited by user, can be withdrawn on presale failure
    pub base_deposited: u128,

    /// num presale tokens a user is owed, can be withdrawn on presale success
    pub tokens_ownd: u128,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct AdditionalInfo {
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
impl NearLaunchpadContract {
    #[init]
    pub fn init(
        presale_owner_account_id: AccountId,
        token_sale_account_id: AccountId,
        token_base_account_id: AccountId,
        token_price: u128,
        max_spend_per_buyer: u128,
        amount: u128,
        hard_cap: u128,
        soft_cap: u128,
        liquidity_percent: u16,
        listing_rate: u128,
        start_block: BlockHeight,
        end_block: BlockHeight,
        lock_period: u128,

        //additional_info
        logo_url: String,
        website: String,
        facebook: String,
        twitter: String,
        github: String,
        telegram: String,
        instagram: String,
        discord: String,
        reddit: String,
        description: String,
    ) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        assert!(
            env::is_valid_account_id(token_sale_account_id.as_bytes()),
            "The token sale account ID is invalid"
        );
        assert!(
            env::is_valid_account_id(token_base_account_id.as_bytes()),
            "The token base account ID is invalid"
        );
        let presale_status = PresaleStatus {
            lp_generation_complete: false,
            force_failed: false,
            total_base_collected: 0,
            total_token_sold: 0,
            total_token_withdrawn: 0,
            total_base_withdrawn: 0,
            num_buyers: 0,
        };

        let additional_info = AdditionalInfo {
            logo_url,
            website,
            facebook,
            twitter,
            github,
            telegram,
            instagram,
            discord,
            reddit,
            description,
        };
        Self {
            presale_owner_account_id,
            token_sale_account_id,
            token_base_account_id,
            token_price,
            max_spend_per_buyer,
            amount,
            hard_cap,
            soft_cap,
            liquidity_percent,
            listing_rate,
            start_block,
            end_block,
            lock_period,
            presale_status,
            buyer_info: LookupMap::new(StorageKey::AccountKey),
            additional_info,
        }
    }

    // Tranfer owner account ID to new owner account ID.
    // This method can only be called by the owner.
    pub fn tranfer_owner(&mut self, new_owner_account_id: AccountId) -> bool {
        self.assert_called_by_owner();
        assert!(
            env::is_valid_account_id(new_owner_account_id.as_bytes()),
            "The new owner account ID is invalid"
        );
        self.presale_owner_account_id = new_owner_account_id;
        true
    }

    pub fn is_owner(&self, account_id: AccountId) -> bool {
        self.presale_owner_account_id == account_id
    }
    #[result_serializer(borsh)]
    pub fn get_info(self) -> Self {
        self
    }

    pub fn presale_status(&self) -> u8 {
        if self.presale_status.lp_generation_complete {
            4 // FINALIZED - withdraws enabled and markets created
        } else if self.presale_status.force_failed {
            3 // FAILED - force fail
        } else if env::block_index() > self.end_block
            && self.presale_status.total_base_collected < self.soft_cap
        {
            3 // FAILED - softcap not met by end block
        } else if self.presale_status.total_base_collected >= self.hard_cap {
            2 // SUCCESS - hardcap met
        } else if env::block_index() > self.end_block
            && self.presale_status.total_base_collected >= self.soft_cap
        {
            2 // SUCCESS - endblock and soft cap reached
        } else if env::block_index() > self.start_block && env::block_index() <= self.end_block {
            1 // ACTIVE - deposits enabled
        } else {
            0 // QUED - awaiting start block
        }
    }

    #[payable]
    pub fn user_deposit(&mut self) {
        // DETERMINE amount_in
        let account_id = env::predecessor_account_id();
        let mut buyer = self.buyer_info.get(&account_id).unwrap();
        let mut amount_in = env::attached_deposit();
        let mut allowance = self.max_spend_per_buyer - buyer.base_deposited;
        let remaining = self.hard_cap - self.presale_status.total_base_collected;
        if allowance > remaining {
            allowance = remaining
        }
        if amount_in > allowance {
            amount_in = allowance;
        }

        // UPDATE STORAGE
        let tokens_sold = amount_in * self.token_price / (u128::pow(10, 24));
        assert!(tokens_sold > 0, "ZERO TOKENS");
        if buyer.base_deposited == 0 {
            self.presale_status.num_buyers += 1;
        }

        buyer.base_deposited += amount_in;
        buyer.tokens_ownd += tokens_sold;

        // FINAL TRANSFERS OUT AND IN
        // return unused NEAR

        if amount_in < env::attached_deposit() {
            Promise::new(account_id).transfer(env::attached_deposit() - amount_in);
        }
    }

    #[payable]
    pub fn user_withdraw_tokens(&mut self) -> Promise {
        assert_one_yocto();
        assert!(
            self.presale_status.lp_generation_complete,
            "AWAITING LP GENERATION"
        );
        let account_id = env::predecessor_account_id();
        let buyer = self.buyer_info.get(&account_id).unwrap();
        assert!(buyer.tokens_ownd > 0, "NOTHING TO WITHDRAW");

        ext_ft_contract::ft_transfer(
            account_id.clone(),
            buyer.tokens_ownd,
            Some("User Withdraw Tokens".to_string()),
            &self.token_sale_account_id,
            DEPOSIT_ONE_YOCTO,
            FT_TRANSFER_GAS,
        )
        .then(ext_self::ft_withdraw_callback(
            account_id.clone(),
            &env::predecessor_account_id(),
            NO_DEPOSIT,
            FT_HARVEST_CALLBACK_GAS,
        ))
    }

    #[payable]
    pub fn use_withdraw_base_token(&mut self) {
        assert!(self.presale_status() == 3, "NOT FAILED");
        assert_one_yocto();
        let account_id = env::predecessor_account_id();
        let mut buyer = self.buyer_info.get(&account_id).unwrap();
        assert!(buyer.base_deposited > 0, "NOTHING TO WITHDRAW");
        if buyer.base_deposited > 0 {
            self.presale_status.total_base_withdrawn += buyer.base_deposited;
            buyer.base_deposited = 0;
            Promise::new(account_id).transfer(buyer.base_deposited);
        }
    }

    #[payable]
    pub fn owner_withdraw_tokens(&mut self) {
        self.assert_called_by_owner();
        assert!(self.presale_status() == 3);
        assert_one_yocto();
        ext_ft_contract::ft_transfer(
            self.presale_owner_account_id.clone(),
            self.amount - self.presale_status.total_base_withdrawn,
            Some("Owner Withdraw Tokens".to_string()),
            &self.token_sale_account_id,
            DEPOSIT_ONE_YOCTO,
            FT_TRANSFER_GAS,
        );
    }

    pub fn force_fail_by_near_launchpad(&mut self) {
        assert!(env::current_account_id() == NEAR_LAUNCHPAD_ADDRESS);
        assert!(!self.presale_status.force_failed);
        self.presale_status.force_failed = true;
    }

    pub fn force_fail_by_presale_owner(&mut self) {
        self.assert_called_by_owner();
        assert!(!self.presale_status.lp_generation_complete, "POOL EXISTS");
        assert!(!self.presale_status.force_failed);
        self.presale_status.force_failed = true;
    }

    /// Internal method to verify the predecessor was the owner account ID.
    fn assert_called_by_owner(&self) {
        assert_eq!(
            &env::predecessor_account_id(),
            &self.presale_owner_account_id,
            "Can only be called by owner"
        );
    }

    pub fn ft_withdraw_callback(&mut self, account_id: AccountId) -> u128 {
        assert_eq!(env::promise_results_count(), 1, "ERR_TOO_MANY_RESULTS");

        match env::promise_result(0) {
            PromiseResult::NotReady => unreachable!(),
            PromiseResult::Successful(_value) => {
                let mut buyer = self.buyer_info.get(&account_id).unwrap();
                self.presale_status.total_base_withdrawn += buyer.tokens_ownd;
                let tokens_ownd = buyer.tokens_ownd;
                buyer.tokens_ownd = 0;
                tokens_ownd
            }
            PromiseResult::Failed => {
                // handle rollback data
                0
            }
        }
    }
}

pub fn assert_one_yocto() {
    assert_eq!(
        env::attached_deposit(),
        1,
        "Required attached deposit of exactly 1 yoctoNEAR"
    )
}

#[near_bindgen]
impl FungibleTokenReceiver for NearLaunchpadContract {
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        assert_eq!(self.amount, amount.0, "deposit amount not less than amount!");
        PromiseOrValue::Value(U128(0))
    }
}
