import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/Home.module.css";
import { config } from "../wagmi";
import { readContract, writeContract } from "wagmi/actions";
import { waitForTransactionReceipt } from "@wagmi/core";
import { AGENT_REGISTRY_ABI } from "../contract/abi/agent";
import { AGENT_REGISTRY_ADDRESS } from "../contract/address";
import { toast } from "sonner";
var AES = require("crypto-js/aes");

interface SpaceEnvDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpace: string;
  onEnvsUpdated?: () => Promise<void>; // Optional callback for when envs are updated
}

const SpaceEnvDialog: React.FC<SpaceEnvDialogProps> = ({
  isOpen,
  onClose,
  selectedSpace,
  onEnvsUpdated,
}) => {
  const [spaceEnvs, setSpaceEnvs] = useState<{ key: string; value: string; encrypted?: boolean }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const limit = 10;

  // Internal state for form management
  const [envs, setEnvs] = useState<{ key: string; value: string; encrypted?: boolean }[]>([
    { key: "", value: "", encrypted: false },
  ]);

  // Categories for filtering
  const categories = [
    { id: "all", name: "All" },
    { id: "server", name: "Server & DB" },
    { id: "client", name: "Client" },
    { id: "model", name: "Models" },
    { id: "blockchain", name: "Blockchain" },
    { id: "other", name: "Other" },
  ];

  // Category mapping based on key prefixes or keywords
  const getCategoryForKey = (key: string) => {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey.includes("server") ||
      lowerKey.includes("db") ||
      lowerKey.includes("database") ||
      lowerKey.includes("cache") ||
      lowerKey.includes("redis") ||
      lowerKey.includes("supabase")
    ) {
      return "server";
    }

    if (
      lowerKey.includes("model") ||
      lowerKey.includes("openai") ||
      lowerKey.includes("anthropic") ||
      lowerKey.includes("llama") ||
      lowerKey.includes("claude") ||
      lowerKey.includes("gpt")
    ) {
      return "model";
    }

    if (
      lowerKey.includes("web3") ||
      lowerKey.includes("chain") ||
      lowerKey.includes("wallet") ||
      lowerKey.includes("contract") ||
      lowerKey.includes("eth") ||
      lowerKey.includes("blockchain")
    ) {
      return "blockchain";
    }

    if (
      lowerKey.includes("client") ||
      lowerKey.includes("ui") ||
      lowerKey.includes("discord") ||
      lowerKey.includes("slack")
    ) {
      return "client";
    }

    return "other";
  };

  useEffect(() => {
    if (isOpen && selectedSpace) {
      fetchSpaceEnvs();
    }
  }, [isOpen, selectedSpace]);

  const fetchSpaceEnvs = async () => {
    if (!selectedSpace) return;

    setLoading(true);
    try {
      const [keys, values, encryptedFlags] = (await readContract(config, {
        abi: AGENT_REGISTRY_ABI,
        address: AGENT_REGISTRY_ADDRESS,
        functionName: "getAllSpaceEnvs",
        args: [selectedSpace],
      })) as [string[], string[], boolean[]];

      const envData = keys.map((key, index) => ({
        key,
        value: values[index],
        encrypted: encryptedFlags ? encryptedFlags[index] : false,
      }));

      setSpaceEnvs(envData);
    } catch (error) {
      console.error("Error fetching space envs:", error);
      toast.error("Failed to fetch space environment variables");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      // Parse .env file content
      const lines = content.split("\n");
      const tempEnvs: { key: string; value: string; encrypted?: boolean }[] = [];
      const uniqueKeys = new Set<string>();
      let duplicateCount = 0;
      let existingCount = 0;
      let limitExceeded = false;

      lines.forEach((line) => {
        // Skip comments and empty lines
        if (line.trim() === "" || line.trim().startsWith("#")) return;

        // Parse key-value pairs
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();

          // filter secret salt
          if (key.includes("ON_CHAIN_STATE_WALLET_SECRET_SALT")) {
            return;
          }

          // Check if value is commented out (starts with #) or empty
          if (value.startsWith("#") || value === "") {
            return;
          }

          // If value contains a # character (but doesn't start with it),
          // truncate the value at the # character to remove inline comments
          const hashIndex = value.indexOf("#");
          if (hashIndex > 0) {
            value = value.substring(0, hashIndex).trim();
          }

          // Check for duplicate keys and skip them
          if (uniqueKeys.has(key)) {
            duplicateCount++;
            return;
          }

          // Check if this key-value pair already exists in spaceEnvs
          const alreadyExists = spaceEnvs.some(
            (env) => env.key === key && env.value === value,
          );

          if (alreadyExists) {
            existingCount++;
            return; // Skip this key-value pair as it already exists
          }

          // Add the key to the set of unique keys
          uniqueKeys.add(key);

          // Detect potentially sensitive variables that should be encrypted
          const sensitiveKeywords = [
            'key', 'secret', 'password', 'token', 'auth', 'credential', 'private', 
            'apikey', 'api_key', 'access', 'cert', 'jwt', 'encrypt'
          ];
          
          // Check if the key contains any sensitive keywords (case insensitive)
          const shouldEncrypt = sensitiveKeywords.some(keyword => 
            key.toLowerCase().includes(keyword.toLowerCase())
          );

          // Add the key-value pair if we haven't reached the limit
          if (tempEnvs.length < limit) { // Using 10 as per the environment variable limit
            tempEnvs.push({ key, value, encrypted: shouldEncrypt });
          } else {
            limitExceeded = true;
          }
        }
      });

      setEnvs(tempEnvs);

      let successMessage = `Loaded ${tempEnvs.length} environment variables from file`;
      let details = [];
      
      // Count how many variables were automatically marked for encryption
      const encryptedCount = tempEnvs.filter(env => env.encrypted).length;
      
      if (encryptedCount > 0) {
        details.push(`${encryptedCount} sensitive variables marked for encryption`);
        // Show a separate toast about encryption detection
        toast.info(`${encryptedCount} potentially sensitive variables were automatically marked for encryption. You can toggle encryption for each variable if needed.`);
      }

      if (duplicateCount > 0) {
        details.push(`${duplicateCount} duplicates removed`);
      }

      if (existingCount > 0) {
        details.push(`${existingCount} existing variables skipped`);
      }

      if (limitExceeded) {
        details.push(`limited to ${limit} variables`);
        toast.warning(
          `Environment variables limit reached. Only the first ${limit} variables were loaded.`,
        );
      }

      if (details.length > 0) {
        successMessage += ` (${details.join(", ")})`;
      }

      toast.success(successMessage);
    };

    reader.readAsText(file);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredEnvs = spaceEnvs.filter((env) => {
    const matchesSearch =
      env.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      env.value.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      getCategoryForKey(env.key) === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handlers for managing the form state
  const handleAddEnv = () => {
    // Check if we've reached the limit of environment variables
    if (envs.length >= limit) {
      toast.warning(
        `You can only have up to ${limit} environment variables. Please remove some before adding more.`,
      );
      return;
    }

    // Check if the new empty key already exists
    const newKey = "";
    const existingKeys = envs.map((env) => env.key);

    if (existingKeys.includes(newKey)) {
      toast.warning(
        "Please fill in the empty key field before adding a new one",
      );
      return;
    }

    setEnvs([...envs, { key: "", value: "", encrypted: false }]);
  };

  const handleRemoveEnv = (index: number) => {
    const newEnvs = [...envs];
    newEnvs.splice(index, 1);
    setEnvs(newEnvs);
  };

  const handleEnvChange = (index: number, key: string, value: string, encrypted?: boolean) => {
    const newEnvs = [...envs];

    // Check if this key already exists in another row
    const keyExists = newEnvs.some((env, i) => i !== index && env.key === key);

    if (key !== "" && keyExists) {
      toast.warning(
        `Warning: Duplicate key "${key}" detected. This may overwrite existing values.`,
      );
    }

    // If encrypted is explicitly provided, use it, otherwise keep the existing value
    const isEncrypted = encrypted !== undefined ? encrypted : newEnvs[index]?.encrypted || false;
    newEnvs[index] = { key, value, encrypted: isEncrypted };
    setEnvs(newEnvs);
  };

  const handleToggleEncryption = (index: number) => {
    const newEnvs = [...envs];
    const currentEnv = newEnvs[index];
    const newEncrypted = !currentEnv.encrypted;
    
    newEnvs[index] = { ...currentEnv, encrypted: newEncrypted };
    setEnvs(newEnvs);
  };

  const handleClearAll = () => {
    if (envs.length === 0) {
      toast.info("No environment variables to clear");
      return;
    }

    if (confirm("Are you sure you want to clear all environment variables?")) {
      setEnvs([]);
      toast.success("All environment variables cleared");
    }
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

    // Remove duplicates that already exist in spaceEnvs with the same value
    const uniqueEnvs = validEnvs.filter((newEnv) => {
      // Check if this key already exists in spaceEnvs with the same value
      const existingEnv = spaceEnvs.find(
        (existingEnv) =>
          existingEnv.key === newEnv.key && existingEnv.value === newEnv.value,
      );

      // Keep only if it doesn't exist or has a different value
      return !existingEnv;
    });

    if (uniqueEnvs.length === 0) {
      toast.info("No new environment variables to set");
      return;
    }

    const keys = uniqueEnvs.map((env) => env.key.trim());
    const values = uniqueEnvs.map((env) => {
      // If the value should be encrypted, encrypt it using the wallet secret salt
      if (env.encrypted) {
        // Get the agent-specific salt from localStorage
        const salt = localStorage.getItem(`WALLET_SECRET_SALT_${selectedSpace}`);
        if (!salt) {
          toast.error("No encryption salt found. Please generate one first.");
          throw new Error("No encryption salt found");
        }
        // Encrypt the value using AES with the salt
        return AES.encrypt(env.value.trim(), salt).toString();
      }
      return env.value.trim();
    });
    const encryptedFlags = uniqueEnvs.map((env) => env.encrypted || false);

    const id = toast.loading("Setting space environment variables...");
    try {
      const hash = await writeContract(config, {
        abi: AGENT_REGISTRY_ABI,
        address: AGENT_REGISTRY_ADDRESS,
        functionName: "setSpaceEnvs",
        args: [selectedSpace, keys, values, encryptedFlags],
      });

      const transactionReceipt = await waitForTransactionReceipt(config, {
        confirmations: 1,
        hash,
      });
      console.log("transactionReceipt", transactionReceipt);

      setEnvs([{ key: "", value: "", encrypted: false }]);

      toast.success("Space environment variables set successfully!", {
        id: id,
      });

      // Refresh the space envs
      await fetchSpaceEnvs();

      // Call the callback if provided
      if (onEnvsUpdated) {
        await onEnvsUpdated();
      }
    } catch (error: any) {
      toast.error(`Setting space envs failed: ${error.message}`, {
        id: id,
      });
      console.error("Setting space envs failed:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Space Environment Variables</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Current space envs display */}
          <div className={styles.envDisplaySection}>
            <h3 className={styles.sectionTitle}>
              Current Environment Variables
            </h3>

            <div className={styles.filterControls}>
              <input
                type="text"
                placeholder="Search by key or value..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />

              <div className={styles.categoryFilter}>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`${styles.categoryButton} ${
                      selectedCategory === category.id
                        ? styles.activeCategoryButton
                        : ""
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className={styles.loadingIndicator}>Loading...</div>
            ) : filteredEnvs.length > 0 ? (
              <>
                <div className={styles.envTable}>
                  <div className={styles.envTableHeader}>
                    <div className={styles.envTableCellSmall}>#</div>
                    <div className={styles.envTableCell}>Key</div>
                    <div className={styles.envTableCell}>Value</div>
                    <div className={styles.envTableCellSmall}>Encrypted</div>
                  </div>
                  <div className={styles.envTableBody}>
                    {filteredEnvs.map((env, index) => (
                      <div key={index} className={styles.envTableRow}>
                        <div className={styles.envTableCellSmall}>
                          {index + 1}
                        </div>
                        <div className={styles.envTableCell}>{env.key}</div>
                        <div className={styles.envTableCell}>
                          {env.encrypted ? (
                            <span className={styles.encryptedValue}>********</span>
                          ) : (
                            env.value
                          )}
                        </div>
                        <div className={styles.envTableCellSmall}>
                          {env.encrypted ? (
                            <span className={styles.encryptedValue}>Yes</span>
                          ) : (
                            "No"
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className={styles.noEnvsMessage}>
                No environment variables set for this space.
              </p>
            )}
          </div>

          {/* Set new envs section */}
          <div className={styles.envSection}>
            <h3 className={styles.sectionTitle}>
              Set New Environment Variables
            </h3>

            <div className={styles.fileUploadSection}>
              <p className={styles.uploadInstructions}>
                Upload a .env file to load environment variables. Only variables
                with non-empty values will be added.
              </p>
              <div className={styles.fileInputWrapper}>
                <input
                  type="file"
                  // accept=".env,.txt"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  id="env-file-input"
                  className={styles.fileInput}
                />
                <label
                  htmlFor="env-file-input"
                  className={styles.fileInputLabel}
                >
                  Choose .env File
                </label>
                <span className={styles.fileInputText}>No file chosen</span>
              </div>
            </div>

            <div className={styles.envForm}>
              {envs.map((env, index) => (
                <div key={index} className={styles.envRow}>
                  <div className={styles.envRowNumber}>{index + 1}</div>
                  <input
                    type="text"
                    placeholder="Key"
                    value={env.key}
                    onChange={(e) =>
                      handleEnvChange(index, e.target.value, env.value, env.encrypted)
                    }
                    className={styles.envInput}
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={env.value}
                    onChange={(e) =>
                      handleEnvChange(index, env.key, e.target.value, env.encrypted)
                    }
                    className={styles.envInput}
                  />
                  <div className={styles.encryptToggle}>
                    <label className={styles.encryptLabel}>
                      <input
                        type="checkbox"
                        checked={env.encrypted || false}
                        onChange={() => handleToggleEncryption(index)}
                        className={styles.encryptCheckbox}
                      />
                      {env.encrypted ? (
                        <span className={styles.encryptedValue}>Encrypted</span>
                      ) : (
                        "Encrypt"
                      )}
                      <div className={styles.encryptTooltip}>
                        <span className={styles.tooltipText}>
                          {env.encrypted
                            ? "This value will be encrypted before storing on the blockchain"
                            : "Toggle to encrypt this sensitive value"}
                        </span>
                      </div>
                    </label>
                  </div>
                  <button
                    onClick={() => handleRemoveEnv(index)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className={styles.actionButtons}>
                <button onClick={handleAddEnv} className={styles.addButton}>
                  Add Environment Variable
                </button>

                <button onClick={handleClearAll} className={styles.clearButton}>
                  Clear All
                </button>

                <button
                  onClick={handleSetSpaceEnvs}
                  className={styles.actionButton}
                >
                  Set Space Envs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceEnvDialog;
