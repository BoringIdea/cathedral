import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { BN } from "bn.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import type { Cathedral } from "../target/types/cathedral";
import CathedralIDL from "../target/idl/cathedral.json";

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import {
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createUpdateFieldInstruction,
  getTokenMetadata,
} from "@solana/spl-token";

import {
  createInitializeInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";

const SOLANA_PROTOCOL_ACCOUNT_ADDRESS = process.env.NEXT_PUBLIC_SOLANA_PROTOCOL_ACCOUNT_ADDRESS || '';
const SOLANA_PROGRAM_ID = process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || '';

const curveSeed = "CurveConfiguration";
// const TOKEN_MINT_PREFIX = "liquidity_token_mint";
const POOL_SEED_PREFIX = "liquidity_pool";
const SOL_VAULT_PREFIX = "liquidity_sol_vault";
const SOL_FEE_PREFIX = "liquidity_sol_fee_vault";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatShares(value: number): string {
  if (value === 0) return '0';
  const integerPart = Math.floor(value);
  const integerDigits = integerPart.toString().length;
  const decimalDigits = Math.max(0, 6 - integerDigits);
  return value.toFixed(decimalDigits);
}

export function formatPrice(value: number): string {
  if (value === 0) return '0';

  // Handle very small numbers
  if (value < 0.000001) {
    const exponent = Math.floor(Math.log10(value));
    const mantissa = value / Math.pow(10, exponent);
    return `${mantissa.toFixed(3)}×10^${exponent}`;
  }

  // Handle normal numbers
  if (value < 0.01) {
    return value.toFixed(6);
  } else if (value < 1) {
    return value.toFixed(4);
  } else {
    return value.toFixed(2);
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0
  }).format(num);
}

export function getCurveConfigPda(): PublicKey {
  // return new PublicKey(Config.SOLANA_CURVE_CONFIG_ADDRESS);
  const [curveConfiguration, curveConfigurationBump] = PublicKey.findProgramAddressSync(
    [Buffer.from(curveSeed)],
    new PublicKey(CathedralIDL.address)
  );
  return curveConfiguration;
}

export function getProtocolAccount(): PublicKey {
  if (SOLANA_PROTOCOL_ACCOUNT_ADDRESS) {
    return new PublicKey(SOLANA_PROTOCOL_ACCOUNT_ADDRESS);
  } else {
    throw new Error("SOLANA_PROTOCOL_ACCOUNT_ADDRESS is not set");
  }
}

export function getCathedralProgram(provider: AnchorProvider): Program<Cathedral> {
  // let CathedralIDL = require('../target/idl/cathedral.json');
  if (SOLANA_PROGRAM_ID) {
    CathedralIDL.address = SOLANA_PROGRAM_ID;
  } else {
    throw new Error("SOLANA_PROGRAM_ID is not set");
  }
  return new Program(CathedralIDL as unknown as Cathedral, provider);
}

export async function getTokenBalance(connection: Connection, mint: PublicKey, user: PublicKey) {
  try {
    const tokenAccount = getAssociatedTokenAddressSync(
      mint,
      user,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const accountInfo = await connection.getTokenAccountBalance(tokenAccount);

    const balance = parseFloat(accountInfo.value.amount) / Math.pow(10, accountInfo.value.decimals);
    console.log("balance", balance);
    return balance;
  } catch (error) {
    console.error("Fetch token balance error:", error);
    return 0;
  }
}

// Get token metadata information using SPL Token Metadata (Token 2022)
export async function getTokenInfo(connection: Connection, mint: PublicKey) {
  try {
    // Get mint account info
    const mintInfo = await connection.getParsedAccountInfo(mint);
    if (!mintInfo.value) {
      throw new Error('Mint account not found');
    }

    const mintData = mintInfo.value.data as any;
    const decimals = mintData.parsed.info.decimals;
    const supply = mintData.parsed.info.supply;

    let tokenSymbol = 'UNKNOWN';
    let tokenName = 'Unknown Token';

    try {
      // Use getTokenMetadata from @solana/spl-token for Token 2022
      console.log('Attempting to get token metadata for mint:', mint.toString());
      const metadata = await getTokenMetadata(connection, mint);
      console.log('Retrieved metadata:', metadata);

      if (metadata) {
        tokenSymbol = metadata.symbol || 'UNKNOWN';
        tokenName = metadata.name || 'Unknown Token';
        console.log('Successfully parsed metadata:', { symbol: tokenSymbol, name: tokenName });
      } else {
        console.log('No metadata found, using fallback');
        // Fallback to common tokens mapping
        const mintString = mint.toString();
        const tokenMap: Record<string, { symbol: string; name: string }> = {
          'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana' },
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin' },
          'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD' },
          'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', name: 'Marinade Staked SOL' },
          '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'ETH', name: 'Ethereum (Portal)' },
          'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM': { symbol: 'USDCet', name: 'USD Coin (Portal from Ethereum)' },
        };

        if (tokenMap[mintString]) {
          tokenSymbol = tokenMap[mintString].symbol;
          tokenName = tokenMap[mintString].name;
        } else {
          // For unknown tokens, use mint address prefix
          tokenSymbol = `TOKEN${mintString.slice(0, 4).toUpperCase()}`;
          tokenName = `Token ${mintString.slice(0, 8)}`;
        }
      }
    } catch (metadataError) {
      console.warn('Could not fetch token metadata:', metadataError);
      // Use fallback naming
      const mintString = mint.toString();
      tokenSymbol = `TOKEN${mintString.slice(0, 4).toUpperCase()}`;
      tokenName = `Token ${mintString.slice(0, 8)}`;
    }

    return {
      mint: mint.toString(),
      symbol: tokenSymbol,
      name: tokenName,
      decimals,
      supply: supply.toString()
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return {
      mint: mint.toString(),
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 9,
      supply: '0'
    };
  }
}

export async function getBuyPriceAfterFee(
  provider: AnchorProvider,
  pool: PublicKey,
  amount: number
) {
  const program = getCathedralProgram(provider);
  const curveConfiguration = getCurveConfigPda();

  const curveConfigurationInfo = await program.account.curveConfiguration.fetch(curveConfiguration);

  const poolInfo = await program.account.pool.fetch(pool);

  const supply = new BN(poolInfo.totalSupply);
  const creatorPremint = new BN(curveConfigurationInfo.creatorPremint);
  const amountBN = new BN(amount);

  const supplyMinusCreatorPremint = supply.sub(creatorPremint);
  const supplyMinusCreatorPremintPlusAmount = supplyMinusCreatorPremint.add(amountBN);

  const price = supplyMinusCreatorPremintPlusAmount.mul(supplyMinusCreatorPremintPlusAmount)
    .sub(supplyMinusCreatorPremint.mul(supplyMinusCreatorPremint))
    .div(new BN(LAMPORTS_PER_SOL))
    .div(new BN(5000));

  const creatorFees = price.mul(new BN(5)).div(new BN(100));
  const ProtocolFee = price.mul(new BN(2)).div(new BN(100));

  return price.add(creatorFees).add(ProtocolFee).toNumber() / LAMPORTS_PER_SOL;
}

export async function getSellPriceAfterFee(
  provider: AnchorProvider,
  pool: PublicKey,
  amount: number
) {
  const program = getCathedralProgram(provider);
  const curveConfiguration = getCurveConfigPda();

  const curveConfigurationInfo = await program.account.curveConfiguration.fetch(curveConfiguration);

  const poolInfo = await program.account.pool.fetch(pool);

  const supply = new BN(poolInfo.totalSupply);
  const creatorPremint = new BN(curveConfigurationInfo.creatorPremint);
  const amountBN = new BN(amount);

  const supplyMinusCreatorPremint = supply.sub(creatorPremint);
  const supplyMinusCreatorPremintMinusAmount = supplyMinusCreatorPremint.sub(amountBN);

  const price = supplyMinusCreatorPremint.mul(supplyMinusCreatorPremint)
    .sub(supplyMinusCreatorPremintMinusAmount.mul(supplyMinusCreatorPremintMinusAmount))
    .div(new BN(LAMPORTS_PER_SOL))
    .div(new BN(5000));

  const creatorFees = price.mul(new BN(5)).div(new BN(100));
  const ProtocolFee = price.mul(new BN(2)).div(new BN(100));

  return price.sub(creatorFees).sub(ProtocolFee).toNumber() / LAMPORTS_PER_SOL;
}


export async function getPrice(
  provider: AnchorProvider,
  pool: PublicKey
) {
  const program = getCathedralProgram(provider);
  const curveConfiguration = getCurveConfigPda();

  const curveConfigurationInfo = await program.account.curveConfiguration.fetch(curveConfiguration);

  const poolInfo = await program.account.pool.fetch(pool);

  const supply = new BN(poolInfo.totalSupply);
  const creatorPremint = new BN(curveConfigurationInfo.creatorPremint);
  const amountBN = new BN(LAMPORTS_PER_SOL);

  const supplyMinusCreatorPremint = supply.sub(creatorPremint);
  const supplyMinusCreatorPremintPlusAmount = supplyMinusCreatorPremint.add(amountBN);

  const price = supplyMinusCreatorPremintPlusAmount.mul(supplyMinusCreatorPremintPlusAmount)
    .sub(supplyMinusCreatorPremint.mul(supplyMinusCreatorPremint))
    .div(new BN(LAMPORTS_PER_SOL))
    .div(new BN(5000));

  const priceNumber = price.toNumber() / LAMPORTS_PER_SOL;

  console.log("price", priceNumber);

  return priceNumber;
}

export async function constructSellInstruction(
  connection: Connection,
  provider: AnchorProvider,
  payer: PublicKey,
  mint: PublicKey,
  pool: PublicKey,
  poolTokenAccount: PublicKey,
  poolSolVault: PublicKey,
  poolSolFeeVault: PublicKey,
  poolCreator: PublicKey,
  amount: number,
) {

  const curveConfiguration = getCurveConfigPda();
  const protocolAccount = getProtocolAccount();

  const program = getCathedralProgram(provider);

  const sellerTokenAccount = getAssociatedTokenAddressSync(
    mint,
    payer,
    false,
    TOKEN_2022_PROGRAM_ID,
  );

  const sellInstruction = await program.methods
    .sell(new BN(amount))
    .accounts({
      curveConfigurationAccount: curveConfiguration,
      pool: pool,
      tokenMint: mint,
      poolTokenAccount: poolTokenAccount,
      poolSolVault: poolSolVault,
      poolSolFeeVault: poolSolFeeVault,
      userTokenAccount: sellerTokenAccount,
      protocolAccount: protocolAccount,
      poolCreator: poolCreator,
      user: payer,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .instruction();

  const transaction = new Transaction().add(sellInstruction);

  return transaction;
}

export async function constructBuyInstruction(
  connection: Connection,
  provider: AnchorProvider,
  payer: PublicKey,
  mint: PublicKey,
  pool: PublicKey,
  poolTokenAccount: PublicKey,
  poolSolVault: PublicKey,
  poolSolFeeVault: PublicKey,
  poolCreator: PublicKey,
  amount: number,
) {

  const curveConfiguration = getCurveConfigPda();
  const protocolAccount = getProtocolAccount();

  const program = getCathedralProgram(provider);

  const buyerTokenAccount = getAssociatedTokenAddressSync(
    mint,
    payer,
    false,
    TOKEN_2022_PROGRAM_ID,
  );

  const accountInfo = await connection.getAccountInfo(buyerTokenAccount);

  const buyInstruction = await program.methods
    .buy(new BN(amount))
    .accounts({
      curveConfigurationAccount: curveConfiguration,
      pool: pool,
      tokenMint: mint,
      poolTokenAccount: poolTokenAccount,
      poolSolVault: poolSolVault,
      poolSolFeeVault: poolSolFeeVault,
      userTokenAccount: buyerTokenAccount,
      protocolAccount: protocolAccount,
      poolCreator: poolCreator,
      user: payer,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .instruction();

  const transaction = new Transaction();

  if (!accountInfo) {
    console.log("buyer token account not found, create instruction");
    const createUserTokenAccountIx = createAssociatedTokenAccountInstruction(
      payer,
      buyerTokenAccount,
      payer,
      mint,
      TOKEN_2022_PROGRAM_ID,
    );
    transaction.add(createUserTokenAccountIx);
  }

  transaction.add(buyInstruction);

  return transaction;
}

export async function constructCreatePoolInstruction(
  connection: Connection,
  provider: AnchorProvider,
  payer: PublicKey,
  mint: PublicKey,
  decimals: number,
  name: string,
  symbol: string,
  uri: string,
  description: string,
  repositoryName: string,
  repoUrl: string,
  githubUser: string,
) {
  console.log("start constructCreatePoolInstruction");
  const program = getCathedralProgram(provider);
  const programId = program.programId;
  console.log("programId", programId);

  // Get PDA
  const {
    poolPda,
    poolTokenAccountPda,
    poolSolVaultPda,
    poolSolFeeVaultPda,
  } = getPda(mint, programId);

  const creatorTokenAccount = getAssociatedTokenAddressSync(
    mint,
    payer,
    false,
    TOKEN_2022_PROGRAM_ID,
  );

  // Metadata to store in Mint Account
  const metaData: TokenMetadata = {
    updateAuthority: payer,
    mint: mint,
    name: name,
    symbol: symbol,
    uri: uri,
    additionalMetadata: [
      ["description", description],
      ["repository_name", repositoryName],
      ["repo_url", repoUrl],
      ["github_user", githubUser],
    ],
  };

  // Size of MetadataExtension 2 bytes for type, 2 bytes for length
  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
  // Size of metadata
  const metadataLen = pack(metaData).length;

  // Size of Mint Account with extension
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);

  // Minimum lamports required for Mint Account
  const lamports = await connection.getMinimumBalanceForRentExemption(
    mintLen + metadataExtension + metadataLen,
  );

  // Instruction to invoke System Program to create new account
  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer, // Account that will transfer lamports to created account
    newAccountPubkey: mint, // Address of the account to create
    space: mintLen, // Amount of bytes to allocate to the created account
    lamports, // Amount of lamports transferred to created account
    programId: TOKEN_2022_PROGRAM_ID, // Program assigned as owner of created account
  });

  // Instruction to initialize the MetadataPointer Extension
  const initializeMetadataPointerInstruction =
    createInitializeMetadataPointerInstruction(
      mint, // Mint Account address
      payer, // Authority that can set the metadata address
      mint, // Account address that holds the metadata
      TOKEN_2022_PROGRAM_ID
    );

  // Instruction to initialize Mint Account data
  const initializeMintInstruction = createInitializeMintInstruction(
    mint, // Mint Account Address
    decimals, // Decimals of Mint
    payer, // Designated Mint Authority
    null, // Optional Freeze Authority
    TOKEN_2022_PROGRAM_ID // Token Extension Program ID
  );

  // Instruction to initialize Metadata Account data
  const initializeMetadataInstruction = createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
    metadata: mint, // Account address that holds the metadata
    updateAuthority: payer, // Authority that can update the metadata
    mint: mint, // Mint Account address
    mintAuthority: payer, // Designated Mint Authority
    name: metaData.name,
    symbol: metaData.symbol,
    uri: metaData.uri,
  });

  // Instruction to update metadata, adding description
  const updateFieldInstruction = createUpdateFieldInstruction({
    programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
    metadata: mint, // Account address that holds the metadata
    updateAuthority: payer, // Authority that can update the metadata
    field: metaData.additionalMetadata[0][0], // key
    value: metaData.additionalMetadata[0][1], // value
  });

  // Instruction to update metadata, adding repository_name
  const updateFieldInstruction2 = createUpdateFieldInstruction({
    programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
    metadata: mint, // Account address that holds the metadata
    updateAuthority: payer, // Authority that can update the metadata
    field: metaData.additionalMetadata[1][0], // key
    value: metaData.additionalMetadata[1][1], // value
  });

  // Instruction to update metadata, adding repo_url
  const updateFieldInstruction3 = createUpdateFieldInstruction({
    programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
    metadata: mint, // Account address that holds the metadata
    updateAuthority: payer, // Authority that can update the metadata
    field: metaData.additionalMetadata[2][0], // key
    value: metaData.additionalMetadata[2][1], // value
  });

  // Instruction to update metadata, adding github_user
  const updateFieldInstruction4 = createUpdateFieldInstruction({
    programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
    metadata: mint, // Account address that holds the metadata
    updateAuthority: payer, // Authority that can update the metadata
    field: metaData.additionalMetadata[3][0], // key
    value: metaData.additionalMetadata[3][1], // value
  });

  // Instruction to create User Token Account
  const createUserTokenAccountIx = createAssociatedTokenAccountInstruction(
    payer,
    creatorTokenAccount,
    payer,
    mint,
    TOKEN_2022_PROGRAM_ID,
  );

  // Instruction to create Pool
  const curveConfiguration = getCurveConfigPda();
  const createPoolIx = await program.methods
    .createPool()
    .accounts({
      curveConfiguration: curveConfiguration,
      pool: poolPda,
      tokenMint: mint,
      poolTokenAccount: poolTokenAccountPda,
      poolSolVault: poolSolVaultPda,
      poolSolFeeVault: poolSolFeeVaultPda,
      userTokenAccount: creatorTokenAccount,
      payer: payer,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .instruction();

  // Add instructions to new transaction
  const transaction = new Transaction().add(
    createAccountInstruction,
    initializeMetadataPointerInstruction,
    initializeMintInstruction,
    initializeMetadataInstruction,
    updateFieldInstruction,
    updateFieldInstruction2,
    updateFieldInstruction3,
    updateFieldInstruction4,
    createUserTokenAccountIx,
    createPoolIx
  );

  return transaction;
}

function getPda(tokenMintPda: PublicKey, programId: PublicKey) {
  const [poolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_SEED_PREFIX), tokenMintPda.toBuffer()],
    programId,
  );

  const [poolTokenAccountPda] = PublicKey.findProgramAddressSync(
    [
      poolPda.toBuffer(),
      TOKEN_2022_PROGRAM_ID.toBuffer(),
      tokenMintPda.toBuffer()
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const [poolSolVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SOL_VAULT_PREFIX), tokenMintPda.toBuffer()],
    programId,
  );

  const [poolSolFeeVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SOL_FEE_PREFIX), tokenMintPda.toBuffer()],
    programId,
  );

  return {
    poolPda,
    poolTokenAccountPda,
    poolSolVaultPda,
    poolSolFeeVaultPda,
  }
}

// Fee Distribution Functions
export async function distributeUserFee(
  provider: AnchorProvider,
  poolAddress: string,
  tokenMint: string,
  recipientAddress: string,
  feeSharePercentage: number
): Promise<string> {
  const program = new Program(CathedralIDL as any, provider) as Program<Cathedral>;

  const poolPda = new PublicKey(poolAddress);
  const tokenMintPda = new PublicKey(tokenMint);
  const recipientPda = new PublicKey(recipientAddress);

  try {
    const tx = await program.methods
      .distributeUserFee(feeSharePercentage)
      .accounts({
        pool: poolPda,
        tokenMint: tokenMintPda,
        recipient: recipientPda,
        user: provider.wallet.publicKey,
      } as any)
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error distributing user fee:', error);
    throw error;
  }
}

export async function distributePoolFee(
  provider: AnchorProvider,
  poolAddress: string,
  tokenMint: string,
  distributePoolAddress: string,
  distributePoolTokenMint: string,
  feeSharePercentage: number
): Promise<string> {
  const program = new Program(CathedralIDL as any, provider) as Program<Cathedral>;

  const poolPda = new PublicKey(poolAddress);
  const tokenMintPda = new PublicKey(tokenMint);
  const distributePoolPda = new PublicKey(distributePoolAddress);
  const distributePoolTokenMintPda = new PublicKey(distributePoolTokenMint);

  try {
    const tx = await program.methods
      .distributePoolFee(feeSharePercentage)
      .accounts({
        pool: poolPda,
        tokenMint: tokenMintPda,
        distributeFeePool: distributePoolPda,
        distributeFeePoolTokenMint: distributePoolTokenMintPda,
        user: provider.wallet.publicKey,
      } as any)
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error distributing pool fee:', error);
    throw error;
  }
}

export async function getFeeRecipients(
  provider: AnchorProvider,
  poolAddress: string
): Promise<any> {
  const program = new Program(CathedralIDL as any, provider) as Program<Cathedral>;

  const poolPda = new PublicKey(poolAddress);

  try {
    const poolAccount = await program.account.pool.fetch(poolPda);
    return poolAccount.feeRecipients;
  } catch (error) {
    console.error('Error fetching fee recipients:', error);
    throw error;
  }
}

export async function getPoolTokenMint(
  provider: AnchorProvider,
  poolAddress: string
): Promise<string> {
  const program = new Program(CathedralIDL as any, provider) as Program<Cathedral>;

  const poolPda = new PublicKey(poolAddress);

  try {
    const poolAccount = await program.account.pool.fetch(poolPda);
    return poolAccount.token.toString();
  } catch (error) {
    console.error('Error fetching pool token mint:', error);
    throw error;
  }
}

export async function validatePoolExists(
  provider: AnchorProvider,
  poolAddress: string
): Promise<boolean> {
  const program = new Program(CathedralIDL as any, provider) as Program<Cathedral>;

  const poolPda = new PublicKey(poolAddress);

  try {
    await program.account.pool.fetch(poolPda);
    return true;
  } catch (error) {
    console.error('Pool does not exist:', poolAddress, error);
    return false;
  }
}

export function validateSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    console.error('Invalid Solana address:', address, error);
    return false;
  }
}

export async function claimUserFees(
  provider: AnchorProvider,
  poolAddress: string,
  tokenMint: string
): Promise<string> {
  const program = new Program(CathedralIDL as any, provider) as Program<Cathedral>;

  const poolPda = new PublicKey(poolAddress);
  const tokenMintPda = new PublicKey(tokenMint);
  const userPda = provider.wallet.publicKey;

  // Get pool sol fee vault
  const [poolSolFeeVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("liquidity_sol_fee_vault"), tokenMintPda.toBuffer()],
    program.programId,
  );

  try {
    const tx = await program.methods
      .claimUserFees()
      .accounts({
        pool: poolPda,
        tokenMint: tokenMintPda,
        feeRecipient: userPda,
        poolSolFeeVault: poolSolFeeVaultPda,
        user: userPda,
      } as any)
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error claiming user fees:', error);
    throw error;
  }
}

// Get pool creator address
export async function getPoolCreator(
  provider: AnchorProvider,
  poolAddress: string
): Promise<string> {
  const program = getCathedralProgram(provider);
  const poolPda = new PublicKey(poolAddress);

  try {
    const poolAccount = await program.account.pool.fetch(poolPda);
    return poolAccount.creator.toString();
  } catch (error) {
    console.error('Error fetching pool creator:', error);
    throw error;
  }
}

// Get Birdeye price data for tokens (simplified version to avoid rate limiting)
export async function getBirdeyePriceData(tokenMint: string): Promise<{
  currentPrice: number;
  change24h: number;
  volume24h: number;
  priceHistory: Array<{ timestamp: number; price: number }>;
} | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY;
    if (!apiKey) {
      console.warn('Birdeye API key not found');
      return null;
    }

    // Use the correct API format based on your successful curl command
    const priceResponse = await fetch(
      `https://public-api.birdeye.so/defi/price?address=${tokenMint}&ui_amount_mode=raw`,
      {
        headers: {
          'X-API-KEY': apiKey,
          'accept': 'application/json',
          'x-chain': 'solana'
        }
      }
    );

    if (!priceResponse.ok) {
      const errorText = await priceResponse.text();
      console.error('Birdeye API error response:', errorText);

      if (priceResponse.status === 429) {
        console.warn('Rate limited (429), returning null');
        return null;
      }

      if (priceResponse.status === 400) {
        console.warn('Bad request (400), token might not be supported by Birdeye');
        return null;
      }

      throw new Error(`Birdeye price API failed: ${priceResponse.status} - ${errorText}`);
    }

    const priceData = await priceResponse.json();
    console.log('Birdeye price data:', priceData);

    // Get historical price data
    const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const oneDayAgo = now - (24 * 60 * 60); // 24 hours ago

    const historyResponse = await fetch(
      `https://public-api.birdeye.so/defi/history_price?address=${tokenMint}&address_type=token&type=1m&time_from=${oneDayAgo}&time_to=${now}&ui_amount_mode=raw`,
      {
        headers: {
          'X-API-KEY': apiKey,
          'accept': 'application/json',
          'x-chain': 'solana'
        }
      }
    );

    let priceHistory: Array<{ timestamp: number; price: number }> = [];

    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log('Birdeye history data:', historyData);

      if (historyData.data && historyData.data.items) {
        priceHistory = historyData.data.items.map((item: any) => ({
          timestamp: item.unixTime * 1000, // Convert to milliseconds
          price: item.value
        }));
      }
    } else {
      console.warn('Failed to fetch historical data:', historyResponse.status);
    }

    return {
      currentPrice: priceData.data?.value || 0,
      change24h: priceData.data?.priceChange24h || 0,
      volume24h: priceData.data?.volume24h || 0,
      priceHistory
    };
  } catch (error) {
    console.error('Error fetching Birdeye price data:', error);
    return null;
  }
}