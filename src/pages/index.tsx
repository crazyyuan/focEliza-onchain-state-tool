import Head from "next/head";
import styles from "../styles/Home.module.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useRef, useState } from "react";

import { config } from "../wagmi";
import { AGENT_ABI, AGENT_REGISTRY_ABI } from "../contract/abi/agent";
import { AGENT_REGISTRY_ADDRESS } from "../contract/address";
import { toast, Toaster } from "sonner";
import { NextPage } from "next";
import { useAccount } from "wagmi";
import { readContract, writeContract } from "wagmi/actions";
import { waitForTransactionReceipt } from "@wagmi/core";
import { fetchFromIpfs, ipfsUriToGatewayUrl } from "../utils/ipfs";
import apiClient from "../utils/apiClient";
import CharacterTemplateLink from "../components/CharacterTemplateLink";
import CopyEnvButton from "../components/CopyEnvButton";
import SpaceEnvDialog from "../components/SpaceEnvDialog";
import AgentEnvDialog from "../components/AgentEnvDialog";

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../components/Dialog";

interface AgentInfo {
  space: string;
  id: string;
  deploy: string;
  name: string;
  description: string;
  characterURI: string;
  // characterData: string;
}

const Home: NextPage = () => {
  // const { writeContract } = useWriteContract();

  const { address, isConnected } = useAccount();

  const [formData, setFormData] = useState({
    operator: "",
    space: "",
    name: "",
    description: "",
    characterURI: "",
  });

  const [spaces, setSpaces] = useState<string[]>([]);
  const [selectedSpace, setSelectedSpace] = useState("");

  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  // const [selectedAgentInfo, setSelectedAgentInfo] = useState<any>(null);
  // const [isLoadingAgentInfo, setIsLoadingAgentInfo] = useState(false);

  const [envs, setEnvs] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSpaceEnvDialogOpen, setIsSpaceEnvDialogOpen] = useState(false);
  const [isAgentEnvDialogOpen, setIsAgentEnvDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (address && isConnected) {
      refreshSpaceData();
    }
  }, [address, isConnected]);

  useEffect(() => {
    if (selectedSpace) {
      refreshAgentData(selectedSpace);
    }
  }, [selectedSpace]);

  useEffect(() => {
    if (selectedAgent) {
      fetchCharacterInfo(selectedAgent);
    }
  }, [selectedAgent]);

  const refreshSpaceData = async () => {
    try {
      const spaceIndex = Number(
        (await readContract(config, {
          abi: AGENT_REGISTRY_ABI,
          address: AGENT_REGISTRY_ADDRESS,
          functionName: "spaceIndex",
        })) as BigInt,
      );
      if (spaceIndex > 0) {
        const spaces = (await readContract(config, {
          abi: AGENT_REGISTRY_ABI,
          address: AGENT_REGISTRY_ADDRESS,
          functionName: "getCreatorAllSpaces",
          args: [address, 0, spaceIndex],
        })) as string[];
        setSpaces(spaces);

        // // Use the API client instead of direct contract call
        // try {
        //   const response = await apiClient.getSpaces(address as string);
        //   if (response.status === 'success' && response.data) {
        //     setSpaces(response.data);

        //     // Automatically select the first space if none is selected
        //     if (response.data.length > 0 && !selectedSpace) {
        //       setSelectedSpace(response.data[0]);
        //     }
        //   }
        // } catch (apiError) {
        //   console.error("API error:", apiError);
        //   // Fallback to direct contract call if API fails
        //   const spaces = (await readContract(config, {
        //     abi: AGENT_REGISTRY_ABI,
        //     address: AGENT_REGISTRY_ADDRESS,
        //     functionName: "getCreatorAllSpaces",
        //     args: [address, 0, spaceIndex],
        //   })) as string[];
        //   setSpaces(spaces);

        //   // Automatically select the first space if none is selected
        //   if (spaces.length > 0 && !selectedSpace) {
        //     setSelectedSpace(spaces[0]);
        //   }
        // }
      }
    } catch (e) {
      console.error("Error fetching spaces:", e);
      toast.error("Failed to fetch spaces. Please try again.");
    } finally {
    }
  };

  const refreshAgentData = async (space: string) => {
    // try {
    //   // Use the API client instead of direct contract call
    //   try {
    //     const response = await apiClient.getAgents(space);
    //     if (response.status === 'success' && response.data) {
    //       setAgents(response.data);
    //       console.log("agents:", response.data);
    //     }
    //   } catch (apiError) {
    //     console.error("API error:", apiError);
    //     // Fallback to direct contract call if API fails
    const agentIndex = Number(
      (await readContract(config, {
        abi: AGENT_REGISTRY_ABI,
        address: AGENT_REGISTRY_ADDRESS,
        functionName: "agentIndex",
      })) as BigInt,
    );
    if (agentIndex > 0) {
      const agents = (await readContract(config, {
        abi: AGENT_REGISTRY_ABI,
        address: AGENT_REGISTRY_ADDRESS,
        functionName: "getAgentsBySpace",
        args: [space, 0, agentIndex],
      })) as AgentInfo[];
      setAgents(agents);
      if (agents.length > 0) {
        setSelectedAgent(agents[0]);
      }
      console.log("agents:", agents);
    }
    //   }
    // } catch (e) {
    //   console.error("Error fetching agents:", e);
    //   toast.error("Failed to fetch agents. Please try again.");
    // } finally {
    // }
  };

  const fetchCharacterInfo = async (agent: AgentInfo) => {
    try {
      // If agent has a character URI, try to fetch its content
      if (agent && agent.characterURI) {
        try {
          // agent.characterData = await fetchFromIpfs(agent.characterURI);
        } catch (error) {
          console.error("Error fetching character data:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching agent info:", error);
      toast.error("Failed to fetch agent information");
    }
  };

  const openRegisterDialog = (spaceValue = "") => {
    setFormData({
      operator: address || "",
      space: spaceValue,
      name: "",
      description: "",
      characterURI: "",
    });
    setIsRegisterDialogOpen(true);
  };

  const closeRegisterDialog = () => {
    setIsRegisterDialogOpen(false);
  };

  const handleRegister = async () => {
    // Validate form data
    if (!formData.operator || !formData.space || !formData.name) {
      toast.error("Please fill in all required fields (Operator, Space, Name)");
      return;
    }

    const id = toast.loading("Registering agent...");
    try {
      const hash = await writeContract(config, {
        abi: AGENT_REGISTRY_ABI,
        address: AGENT_REGISTRY_ADDRESS,
        functionName: "registerAgent",
        args: [
          {
            operator: formData.operator,
            space: formData.space,
            name: formData.name,
            description: formData.description,
            characterURI: formData.characterURI,
          },
        ],
      });
      const transactionReceipt = await waitForTransactionReceipt(config, {
        confirmations: 1,
        hash,
      });
      console.log("transactionReceipt", transactionReceipt);

      toast.success("Agent registered successfully!", { id });

      closeRegisterDialog();
      setFormData({
        operator: "",
        space: "",
        name: "",
        description: "",
        characterURI: "",
      });
      await refreshSpaceData();
    } catch (error: any) {
      console.log("registerAgent error:", error);
      toast.error(`Registration failed: ${error.message}`, { id });
    } finally {
    }
  };

  const handleAddEnv = () => {
    setEnvs([...envs, { key: "", value: "" }]);
  };

  const handleRemoveEnv = (index: number) => {
    const newEnvs = [...envs];
    newEnvs.splice(index, 1);
    setEnvs(newEnvs);
  };

  const handleEnvChange = (index: number, key: string, value: string) => {
    const newEnvs = [...envs];
    newEnvs[index] = { key, value };
    setEnvs(newEnvs);
  };

  const handleSetSpaceEnvs = async () => {
    if (!selectedSpace) {
      toast.error("Please select a space first");
      return;
    }

    // Filter out empty entries and prepare arrays
    const validEnvs = envs.filter(
      (env) => env.key.trim() !== "" && env.value.trim() !== "",
    );

    if (validEnvs.length === 0) {
      toast.error(
        "Please add at least one environment variable with key and value",
      );
      return;
    }

    const keys = validEnvs.map((env) => env.key.trim());
    const values = validEnvs.map((env) => env.value.trim());

    const id = toast.loading("Setting space environment variables...");
    try {
      const hash = await writeContract(config, {
        abi: AGENT_REGISTRY_ABI,
        address: AGENT_REGISTRY_ADDRESS,
        functionName: "setSpaceEnvs",
        args: [selectedSpace, keys, values],
      });

      const transactionReceipt = await waitForTransactionReceipt(config, {
        confirmations: 1,
        hash,
      });
      console.log("transactionReceipt", transactionReceipt);

      setEnvs([{ key: "", value: "" }]);

      toast.success("Space environment variables set successfully!", {
        id: id,
      });

      await refreshAgentData(selectedSpace);
    } catch (error: any) {
      toast.error(`Setting space envs failed: ${error.message}`, {
        id: id,
      });
      console.error("Setting space envs failed:", error);
    } finally {
    }
  };

  const handleSetAgentEnvs = async () => {
    if (!selectedAgent) {
      toast.error("Please select an agent first");
      return;
    }

    // Filter out empty entries and prepare arrays
    const validEnvs = envs.filter(
      (env) => env.key.trim() !== "" && env.value.trim() !== "",
    );

    if (validEnvs.length === 0) {
      toast.error(
        "Please add at least one environment variable with key and value",
      );
      return;
    }

    const keys = validEnvs.map((env) => env.key.trim());
    const values = validEnvs.map((env) => env.value.trim());

    const id = toast.loading("Setting agent environment variables...");
    try {
      const hash = await writeContract(config, {
        abi: AGENT_ABI,
        address: selectedAgent.deploy as `0x${string}`,
        functionName: "setEnvs",
        args: [keys, values],
      });

      const transactionReceipt = waitForTransactionReceipt(config, {
        confirmations: 1,
        hash,
      });
      console.log("transactionReceipt", transactionReceipt);

      toast.success("Agent environment variables set successfully!", {
        id,
      });

      setEnvs([{ key: "", value: "" }]);
    } catch (error: any) {
      toast.error(`Setting agent envs failed: ${error.message}`, { id });
      console.error("Setting agent envs failed:", error);
    } finally {
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      toast.error("Only JSON files are allowed");
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to IPFS
      const result = await apiClient.uploadToIpfs(file);

      // Update form with the IPFS URI
      setFormData({
        ...formData,
        characterURI: result.ipfsUri,
      });

      toast.success("File uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Error uploading file");
    } finally {
      setIsUploading(false);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Eliza Agent Registry</title>
        <meta name="description" content="Eliza Agent Registry DApp" />
        {/*<link href="/favicon.ico" rel="icon" />*/}
      </Head>

      <Toaster />

      <main className={styles.main}>
        <h1 className={styles.title}>Eliza Agent Registry</h1>
        <p className={styles.description}>
          Manage your agents and spaces on the blockchain
        </p>

        <div className={styles.connectButton}>
          <ConnectButton />
        </div>

        {address && isConnected ? (
          <div className={styles.dashboard}>
            {spaces.length === 0 ? (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>No Spaces Found</h2>
                <p>
                  You don't have any spaces yet. Register a new agent to create
                  a space.
                </p>
                <button
                  className={styles.actionButton}
                  onClick={() => openRegisterDialog()}
                >
                  Register New Agent
                </button>
              </div>
            ) : null}

            {spaces.length > 0 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Manage Space</h2>
                <div className={styles.formRow}>
                  <select
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Select a space</option>
                    {spaces.map((space, index) => (
                      <option key={index} value={space}>
                        {space}
                      </option>
                    ))}
                  </select>
                  <button
                    className={styles.actionButton}
                    onClick={() => openRegisterDialog(selectedSpace)}
                    disabled={!selectedSpace}
                  >
                    Register New Agent
                  </button>
                </div>

                <div className={styles.envSection}>
                  <h3 className={styles.sectionTitle}>Environment Variables</h3>
                  <div className={styles.buttonGroup}>
                    <button
                      className={styles.manageButton}
                      onClick={() => setIsSpaceEnvDialogOpen(true)}
                    >
                      Manage Envs
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedSpace && agents && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Manage Agent</h2>
                <div className={styles.formRow}>
                  <select
                    value={selectedAgent?.id || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const agent = agents.find(
                        (agent) => agent.id === selectedId,
                      );
                      setSelectedAgent(agent || null);
                    }}
                    className={styles.select}
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent, index) => (
                      <option key={index} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAgent && (
                  <div className={styles.agentInfo}>
                    <h3 className={styles.sectionTitle}>Agent Information</h3>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Name:</span>
                      <span className={styles.infoValue}>
                        {selectedAgent.name}
                      </span>
                    </div>
                    {selectedAgent.description && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Description:</span>
                        <span className={styles.infoValue}>
                          {selectedAgent.description}
                        </span>
                      </div>
                    )}
                    {selectedAgent.characterURI && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Character URI:</span>
                        <span className={styles.infoValue}>
                          <a
                            href={ipfsUriToGatewayUrl(
                              selectedAgent.characterURI,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {selectedAgent.characterURI}
                          </a>
                        </span>
                      </div>
                    )}
                    <CopyEnvButton
                      selectedSpace={selectedAgent.space}
                      selectedAgentId={selectedAgent.id}
                    />
                    {/*{selectedAgent.characterData && (*/}
                    {/*  <div className={styles.characterDataSection}>*/}
                    {/*    <h4 className={styles.subSectionTitle}>*/}
                    {/*      Character Data*/}
                    {/*    </h4>*/}
                    {/*    <pre className={styles.jsonDisplay}>*/}
                    {/*      {JSON.stringify(selectedAgent.characterData, null, 2)}*/}
                    {/*    </pre>*/}
                    {/*  </div>*/}
                    {/*)}*/}
                  </div>
                )}

                <div className={styles.envSection}>
                  <h3 className={styles.sectionTitle}>Environment Variables</h3>
                  <div className={styles.buttonGroup}>
                    <button
                      className={styles.manageButton}
                      onClick={() => setIsAgentEnvDialogOpen(true)}
                    >
                      Manage Envs
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.connectPrompt}>
            <p>Please connect your wallet to use this application</p>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Eliza Agent Registry &copy; {new Date().getFullYear()}</p>
      </footer>

      <SpaceEnvDialog
        isOpen={isSpaceEnvDialogOpen}
        onClose={() => setIsSpaceEnvDialogOpen(false)}
        selectedSpace={selectedSpace}
        envs={envs}
        handleEnvChange={handleEnvChange}
        handleRemoveEnv={handleRemoveEnv}
        handleAddEnv={handleAddEnv}
        handleSetSpaceEnvs={handleSetSpaceEnvs}
      />

      <AgentEnvDialog
        isOpen={isAgentEnvDialogOpen}
        onClose={() => setIsAgentEnvDialogOpen(false)}
        selectedAgent={selectedAgent}
        envs={envs}
        handleEnvChange={handleEnvChange}
        handleRemoveEnv={handleRemoveEnv}
        handleAddEnv={handleAddEnv}
        handleSetAgentEnvs={handleSetAgentEnvs}
      />

      <Dialog open={isRegisterDialogOpen} onClose={closeRegisterDialog}>
        <DialogTitle>Register New Agent</DialogTitle>
        <DialogContent>
          <div className={styles.form}>
            <input
              type="text"
              placeholder="Operator Address"
              value={formData.operator}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  operator: e.target.value,
                })
              }
            />
            <input
              type="text"
              placeholder="Space Name"
              value={formData.space}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  space: e.target.value,
                })
              }
            />
            <input
              type="text"
              placeholder="Agent Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
            />
            <div className={styles.inputWithButton}>
              <input
                type="text"
                placeholder="Character URI (optional)"
                value={formData.characterURI}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    characterURI: e.target.value,
                  })
                }
              />
              <button
                type="button"
                className={styles.uploadButton}
                onClick={triggerFileInput}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload JSON"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </div>
            {formData.characterURI && (
              <div className={styles.previewLink}>
                <a
                  href={ipfsUriToGatewayUrl(formData.characterURI)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Character JSON
                </a>
              </div>
            )}
            <CharacterTemplateLink />
          </div>
        </DialogContent>
        <DialogActions>
          <button className={styles.cancelButton} onClick={closeRegisterDialog}>
            Cancel
          </button>
          <button
            className={styles.actionButton}
            onClick={handleRegister}
            disabled={isUploading}
          >
            Register Agent
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Home;
