// ============================================================================
// TOKEN SERVICE — BLACK-BOX INTERFACE
// ============================================================================
// DO NOT modify token pricing, incentive calculations, conversion formulas,
// or reward algorithms. These are proprietary domain rules.
// This interface is the ONLY public API for token operations.
// ============================================================================

export interface TokenService {
  /**
   * Parent awards tokens to a child.
   * The parent's account is charged at TOKEN_BUY_RATE per token.
   */
  award(input: {
    familyId: string;
    childId: string;
    tokens: number;
    note: string;
    awardedBy: string;
  }): Promise<TokenAwardResult>;

  /**
   * Child redeems tokens for cash (credited to savings).
   * Uses TOKEN_REDEEM_RATE per token.
   */
  redeem(input: {
    familyId: string;
    childId: string;
    tokens: number;
  }): Promise<TokenRedeemResult>;

  /**
   * Returns the current token balance for a child.
   * Balance = awarded - redeemed.
   */
  getBalance(childId: string): Promise<number>;

  /**
   * Returns the cost to the parent for purchasing N tokens.
   * Pure calculation — no side effects.
   */
  calculatePurchaseCost(tokens: number): number;

  /**
   * Returns the cash value a child receives for redeeming N tokens.
   * Pure calculation — no side effects.
   */
  calculateRedeemValue(tokens: number): number;
}

export interface TokenAwardResult {
  transactionId: string;
  ledgerEntryId: string;
  tokensAwarded: number;
  parentCost: number;
}

export interface TokenRedeemResult {
  transactionId: string;
  ledgerEntryId: string;
  tokensRedeemed: number;
  cashValue: number;
  newBalance: number;
}

// ============================================================================
// IMPLEMENTATION — delegates to existing store logic.
// The actual rate constants live in phrases.ts and MUST NOT be changed.
// ============================================================================

import { TOKEN_BUY_RATE, TOKEN_REDEEM_RATE } from "@/lib/phrases";
import { db } from "@/lib/db";
import { BusinessRuleError } from "@/lib/errors";

export const TokenServiceImpl: TokenService = {
  async award(input) {
    const ts = Date.now();
    const ledger = await db.tokenLedgerEntry.create({
      data: {
        familyId: input.familyId,
        childId: input.childId,
        type: "parent_give",
        tokens: input.tokens,
        note: input.note,
        timestamp: BigInt(ts),
      } as any,
    });
    const tx = await db.transaction.create({
      data: {
        familyId: input.familyId,
        childId: input.childId,
        type: "parent_give",
        amount: 0,
        tokenDelta: input.tokens,
        note: input.note,
        timestamp: BigInt(ts),
      } as any,
    });
    return {
      transactionId: tx.id,
      ledgerEntryId: ledger.id,
      tokensAwarded: input.tokens,
      parentCost: this.calculatePurchaseCost(input.tokens),
    };
  },

  async redeem(input) {
    const balance = await this.getBalance(input.childId);
    if (input.tokens > balance) {
      throw new BusinessRuleError("Insufficient token balance");
    }
    const cashValue = this.calculateRedeemValue(input.tokens);
    const ts = Date.now();

    const ledger = await db.tokenLedgerEntry.create({
      data: {
        familyId: input.familyId,
        childId: input.childId,
        type: "redeem",
        tokens: input.tokens,
        note: `${input.tokens} tokens redeemed`,
        timestamp: BigInt(ts),
      } as any,
    });
    const tx = await db.transaction.create({
      data: {
        familyId: input.familyId,
        childId: input.childId,
        type: "redeem",
        amount: cashValue,
        tokenDelta: input.tokens,
        note: `${input.tokens} tokens redeemed`,
        timestamp: BigInt(ts),
      } as any,
    });

    // Credit child savings
    const child = await db.child.findUnique({ where: { id: input.childId } });
    if (child) {
      await db.child.update({
        where: { id: input.childId },
        data: { currentAmount: child.currentAmount + cashValue },
      });
    }

    return {
      transactionId: tx.id,
      ledgerEntryId: ledger.id,
      tokensRedeemed: input.tokens,
      cashValue,
      newBalance: balance - input.tokens,
    };
  },

  async getBalance(childId) {
    const given = await db.tokenLedgerEntry.aggregate({
      where: { childId, type: "parent_give" },
      _sum: { tokens: true },
    });
    const redeemed = await db.tokenLedgerEntry.aggregate({
      where: { childId, type: "redeem" },
      _sum: { tokens: true },
    });
    return (given._sum.tokens ?? 0) - (redeemed._sum.tokens ?? 0);
  },

  calculatePurchaseCost(tokens) {
    return tokens * TOKEN_BUY_RATE;
  },

  calculateRedeemValue(tokens) {
    return tokens * TOKEN_REDEEM_RATE;
  },
};

// Export the singleton instance
export const TokenEngine: TokenService = TokenServiceImpl;
