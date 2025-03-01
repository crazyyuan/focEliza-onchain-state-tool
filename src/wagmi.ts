import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, optimism, optimismSepolia, sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
    appName: "Eliza On-chain State App",
    projectId: `${process.env.NEXT_PUBLIC_PROJECT_ID}` || "",
    chains: [
        mainnet,
        optimism,
        ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true"
            ? [sepolia, optimismSepolia]
            : []),
    ],
    ssr: true,
});
