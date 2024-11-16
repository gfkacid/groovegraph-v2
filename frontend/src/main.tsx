import React from 'react'
import ReactDOM from 'react-dom/client'

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { createConfig, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from "viem";
import { sepolia } from "viem/chains";
import { getAuthToken } from "@dynamic-labs/sdk-react-core";

import App from './App'
import './index.css'

const config = createConfig({
  chains: [sepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [sepolia.id]: http(),
  },
});
const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DynamicContextProvider
            settings={{
              environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
              walletConnectors: [EthereumWalletConnectors],
              events: {
                onAuthSuccess: (args) => {
                  console.log("onAuthSuccess was called", args);
                  const authToken = getAuthToken();
                  console.log("authToken", authToken);
                },
              },
            }}>
            <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <DynamicWagmiConnector>
                  <App />
                </DynamicWagmiConnector>
              </QueryClientProvider>
            </WagmiProvider>
          </DynamicContextProvider>
  </React.StrictMode>,
)