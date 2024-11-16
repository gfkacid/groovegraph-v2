import { Bundler, IBundler } from "@biconomy/bundler";
import {
  Paymaster,
  createSmartAccountClient,
  DEFAULT_ENTRYPOINT_ADDRESS,
  ECDSAOwnershipValidationModule,
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
} from "@biconomy/account";
import { sepolia } from "viem/chains";

const bundler: IBundler = new Bundler({
  bundlerUrl: "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
  chainId: sepolia.id,
  entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
});

const paymaster = new Paymaster({
  paymasterUrl: import.meta.env.VITE_BICONOMY_PAYMASTER_URL,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createValidationModule = async (signer: any) => {
  return await ECDSAOwnershipValidationModule.create({
    signer: signer,
    moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createSmartAccount = async (walletClient: any) => {
  const validationModule = await createValidationModule(walletClient);
  console.log("creating smart account client");

  return await createSmartAccountClient({
    signer: walletClient,
    chainId: sepolia.id,
    // @ts-ignore
    bundler: bundler,
    paymaster: paymaster,
    biconomyPaymasterApiKey: import.meta.env.VITE_PM_BICONOMY_API_KEY,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    defaultValidationModule: validationModule,
    activeValidationModule: validationModule,
  });
};
