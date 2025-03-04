import React, { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import { config } from "../wagmi";
import { readContract, writeContract } from "wagmi/actions";
import { waitForTransactionReceipt } from "@wagmi/core";
import { AGENT_REGISTRY_ABI } from "../contract/abi/agent";
import { AGENT_REGISTRY_ADDRESS } from "../contract/address";
import { toast } from "sonner";

interface SpaceEnvDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpace: string;
  envs: { key: string; value: string }[];
  handleEnvChange: (index: number, key: string, value: string) => void;
  handleRemoveEnv: (index: number) => void;
  handleAddEnv: () => void;
  handleSetSpaceEnvs: () => void;
}

const SpaceEnvDialog: React.FC<SpaceEnvDialogProps> = ({
  isOpen,
  onClose,
  selectedSpace,
  envs,
  handleEnvChange,
  handleRemoveEnv,
  handleAddEnv,
  handleSetSpaceEnvs,
}) => {
  const [spaceEnvs, setSpaceEnvs] = useState<{ key: string; value: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedSpace) {
      fetchSpaceEnvs();
    }
  }, [isOpen, selectedSpace]);

  const fetchSpaceEnvs = async () => {
    if (!selectedSpace) return;

    setLoading(true);
    try {
      const [keys, values] = (await readContract(config, {
        abi: AGENT_REGISTRY_ABI,
        address: AGENT_REGISTRY_ADDRESS,
        functionName: "getAllSpaceEnvs",
        args: [selectedSpace],
      })) as [string[], string[]];

      const envData = keys.map((key, index) => ({
        key,
        value: values[index],
      }));

      setSpaceEnvs(envData);
    } catch (error) {
      console.error("Error fetching space envs:", error);
      toast.error("Failed to fetch space environment variables");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Space Environment Variables</h2>
          <button onClick={onClose} className={styles.closeButton}>
            &times;
          </button>
        </div>
        <div className={styles.modalContent}>
          {/* Current space envs display */}
          <div className={styles.envDisplaySection}>
            <h3 className={styles.sectionTitle}>Current Environment Variables</h3>
            {loading ? (
              <div className={styles.loadingIndicator}>Loading...</div>
            ) : spaceEnvs.length > 0 ? (
              <>
                <div className={styles.envTable}>
                  <div className={styles.envTableHeader}>
                    <div className={styles.envTableCell}>Key</div>
                    <div className={styles.envTableCell}>Value</div>
                  </div>
                  {spaceEnvs.map((env, index) => (
                    <div key={index} className={styles.envTableRow}>
                      <div className={styles.envTableCell}>{env.key}</div>
                      <div className={styles.envTableCell}>{env.value}</div>
                    </div>
                  ))}
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
            <h3 className={styles.sectionTitle}>Set New Environment Variables</h3>
            {envs.map((env, index) => (
              <div key={index} className={styles.envRow}>
                <input
                  type="text"
                  placeholder="Key"
                  value={env.key}
                  onChange={(e) =>
                    handleEnvChange(index, e.target.value, env.value)
                  }
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={env.value}
                  onChange={(e) =>
                    handleEnvChange(index, env.key, e.target.value)
                  }
                />
                <button
                  onClick={() => handleRemoveEnv(index)}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            ))}
            <div className={styles.buttonGroup}>
              <button className={styles.addButton} onClick={handleAddEnv}>
                Add Env
              </button>
              <button
                className={styles.actionButton}
                onClick={handleSetSpaceEnvs}
              >
                Set Space Envs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceEnvDialog;
