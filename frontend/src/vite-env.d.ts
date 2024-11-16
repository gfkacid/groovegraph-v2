/// <reference types="vite/client" />

interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  interface ImportMetaEnv {
    readonly VITE_DYNAMIC_ENVIRONMENT_ID: string;
    readonly VITE_PM_BICONOMY_API_KEY: string;
    readonly VITE_BICONOMY_PAYMASTER_URL: string;
    // Add other environment variables as needed
  }