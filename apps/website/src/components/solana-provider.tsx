'use client';

import dynamic from 'next/dynamic';
import { CSSProperties } from 'react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { WalletError } from '@solana/wallet-adapter-base';
import {
  AnchorWallet,
  useConnection,
  useWallet,
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';

import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
// import {
//   clusterApiUrl,
// } from "@solana/web3.js";
import { ReactNode, useCallback, useMemo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@solana/wallet-adapter-react-ui/styles.css');

// export const WalletButton = dynamic(
//   async () =>
//     (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
//   { ssr: false }
// );

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
// const WalletMultiButton = dynamic(
//   async () =>
//     (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
//   { ssr: false}
// );
//bg-gray-700 hover:bg-gray-600 text-white px-4 h-8
export const WalletButton = () => (
  <div className="hover:scale-105 transition-transform duration-200">
    <WalletMultiButton
      style={{
        backgroundColor: '#1A1A1A',
        height: '36px',
        padding: '0 16px',
        fontSize: '14px',
        lineHeight: '36px',
        borderRadius: '8px',
        fontWeight: '500',
        border: '1px solid rgba(55, 65, 81, 0.5)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        color: '#ffffff',
        boxShadow: 'none',
      }} 
      className="hover:bg-[#2A2A2A] hover:border-gray-600"
    />
  </div>
);

export function SolanaProvider({ children }: { children: ReactNode }) {
  const onError = useCallback((error: WalletError) => {
    console.error(error);
  }, []);

  // const endpoint = clusterApiUrl("devnet");
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: 'confirmed',
  });
}
