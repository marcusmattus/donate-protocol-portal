use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("DonateProtoo11111111111111111111111111111111");

// Donate Protocol on-chain program.
// Tracks donation vaults, copy-trading strategy vaults, charity registry,
// and emits a DonationEvent every time profit is shared.

#[program]
pub mod donate_protocol {
    use super::*;

    pub fn init_donation_vault(
        ctx: Context<InitDonationVault>,
        vault_id: u64,
        donation_bps: u16,
        strategy_id: u64,
    ) -> Result<()> {
        require!(donation_bps <= 10_000, DonateError::InvalidBps);
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.owner.key();
        vault.vault_id = vault_id;
        vault.total_volume = 0;
        vault.donation_bps = donation_bps;
        vault.strategy_id = strategy_id;
        vault.bump = ctx.bumps.vault;
        emit!(VaultCreated { vault_id, owner: vault.owner });
        Ok(())
    }

    pub fn init_strategy_vault(
        ctx: Context<InitStrategyVault>,
        strategy_id: u64,
    ) -> Result<()> {
        let s = &mut ctx.accounts.strategy;
        s.strategy_id = strategy_id;
        s.owner = ctx.accounts.owner.key();
        s.followers = 0;
        s.pnl = 0;
        s.bump = ctx.bumps.strategy;
        Ok(())
    }

    pub fn register_charity(
        ctx: Context<RegisterCharity>,
        charity_id: u64,
        category: [u8; 32],
    ) -> Result<()> {
        let c = &mut ctx.accounts.charity;
        c.charity_id = charity_id;
        c.charity_wallet = ctx.accounts.charity_wallet.key();
        c.category = category;
        c.verified = false;
        c.total_received = 0;
        c.bump = ctx.bumps.charity;
        Ok(())
    }

    pub fn verify_charity(ctx: Context<VerifyCharity>) -> Result<()> {
        ctx.accounts.charity.verified = true;
        Ok(())
    }

    pub fn record_trade_and_donate(
        ctx: Context<RecordTradeAndDonate>,
        trade_id: u64,
        notional: u64,
        pnl: i64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.total_volume = vault.total_volume.saturating_add(notional);

        if pnl <= 0 {
            return Ok(());
        }

        let pnl_u = pnl as u64;
        let donation = pnl_u
            .checked_mul(vault.donation_bps as u64)
            .ok_or(DonateError::MathOverflow)?
            / 10_000;

        if donation > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.profit_account.to_account_info(),
                to: ctx.accounts.charity_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            token::transfer(CpiContext::new(cpi_program, cpi_accounts), donation)?;

            let charity = &mut ctx.accounts.charity;
            charity.total_received = charity.total_received.saturating_add(donation);

            emit!(DonationEvent {
                trade_id,
                vault_id: vault.vault_id,
                charity_id: charity.charity_id,
                amount: donation,
                timestamp: Clock::get()?.unix_timestamp,
            });
        }

        Ok(())
    }

    pub fn follow_strategy(ctx: Context<FollowStrategy>) -> Result<()> {
        let s = &mut ctx.accounts.strategy;
        s.followers = s.followers.saturating_add(1);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(vault_id: u64)]
pub struct InitDonationVault<'info> {
    #[account(
        init,
        payer = owner,
        space = DonationVault::SIZE,
        seeds = [b"vault", owner.key().as_ref(), &vault_id.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, DonationVault>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(strategy_id: u64)]
pub struct InitStrategyVault<'info> {
    #[account(
        init,
        payer = owner,
        space = StrategyVault::SIZE,
        seeds = [b"strategy", &strategy_id.to_le_bytes()],
        bump
    )]
    pub strategy: Account<'info, StrategyVault>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(charity_id: u64)]
pub struct RegisterCharity<'info> {
    #[account(
        init,
        payer = registrar,
        space = CharityRegistry::SIZE,
        seeds = [b"charity", &charity_id.to_le_bytes()],
        bump
    )]
    pub charity: Account<'info, CharityRegistry>,
    /// CHARITY WALLET — pubkey that will receive donations.
    /// CHECK: only stored as pubkey; donations transfer via SPL tokens to a token account.
    pub charity_wallet: AccountInfo<'info>,
    #[account(mut)]
    pub registrar: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyCharity<'info> {
    #[account(mut)]
    pub charity: Account<'info, CharityRegistry>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordTradeAndDonate<'info> {
    #[account(mut)]
    pub vault: Account<'info, DonationVault>,
    #[account(mut)]
    pub charity: Account<'info, CharityRegistry>,
    #[account(mut)]
    pub profit_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub charity_token_account: Account<'info, TokenAccount>,
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct FollowStrategy<'info> {
    #[account(mut)]
    pub strategy: Account<'info, StrategyVault>,
    pub follower: Signer<'info>,
}

#[account]
pub struct DonationVault {
    pub owner: Pubkey,
    pub vault_id: u64,
    pub total_volume: u64,
    pub donation_bps: u16,
    pub strategy_id: u64,
    pub bump: u8,
}
impl DonationVault {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 2 + 8 + 1 + 32;
}

#[account]
pub struct StrategyVault {
    pub owner: Pubkey,
    pub strategy_id: u64,
    pub followers: u64,
    pub pnl: i64,
    pub bump: u8,
}
impl StrategyVault {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8 + 1 + 32;
}

#[account]
pub struct CharityRegistry {
    pub charity_id: u64,
    pub charity_wallet: Pubkey,
    pub category: [u8; 32],
    pub verified: bool,
    pub total_received: u64,
    pub bump: u8,
}
impl CharityRegistry {
    pub const SIZE: usize = 8 + 8 + 32 + 32 + 1 + 8 + 1 + 32;
}

#[event]
pub struct VaultCreated {
    pub vault_id: u64,
    pub owner: Pubkey,
}

#[event]
pub struct DonationEvent {
    pub trade_id: u64,
    pub vault_id: u64,
    pub charity_id: u64,
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum DonateError {
    #[msg("Donation basis points must be <= 10000")]
    InvalidBps,
    #[msg("Math overflow")]
    MathOverflow,
}
