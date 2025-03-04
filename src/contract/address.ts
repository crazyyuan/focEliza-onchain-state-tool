export type Address = `0x${string[40]}`;
export const AGENT_REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_AGENT_REGISTRY as Address;
