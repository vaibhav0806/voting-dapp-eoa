import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { PrivyProvider } from '@privy-io/react-auth';
import { NETWORK_CONFIG } from './contractConfig.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId='635394802866-bahaea6gr6d7q8io1maa7cae3drh0ad9.apps.googleusercontent.com'>
      <PrivyProvider
        appId="cm0xs5wlv00h3gmtvris0g8b9"
        config={{
          // Display email and wallet as login methods
          loginMethods: ['email'],
          // Customize Privy's appearance in your app
          appearance: {
            theme: 'light',
            accentColor: '#676FFF',
          },
          // Create embedded wallets for users who don't have a wallet
          embeddedWallets: {
            createOnLogin: 'all-users',
          },
          defaultChain: NETWORK_CONFIG,
          supportedChains: [NETWORK_CONFIG],
        }}
      ><App /></PrivyProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
