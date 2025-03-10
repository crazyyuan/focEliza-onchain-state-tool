import React, { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import { AGENT_REGISTRY_ADDRESS } from "../contract/address";

interface CopyEnvButtonProps {
  selectedSpace: string;
  selectedAgentId: string;
}

const CopyEnvButton: React.FC<CopyEnvButtonProps> = ({
  selectedSpace,
  selectedAgentId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [walletSecretSalt, setWalletSecretSalt] = useState<string | null>(null);

  // Get the WALLET_SECRET_SALT from localStorage when component mounts or modal opens
  useEffect(() => {
    if (isModalOpen) {
      // For agent-specific salt
      // if (selectedAgentId) {
      //   const salt = localStorage.getItem(`WALLET_SECRET_SALT_${selectedAgentId}`);
      //   setWalletSecretSalt(salt);
      // }
      // For space-specific salt
      if (selectedSpace) {
        const salt = localStorage.getItem(`WALLET_SECRET_SALT_${selectedSpace}`);
        setWalletSecretSalt(salt);
      }
    }
  }, [isModalOpen, selectedAgentId, selectedSpace]);

  // Generate a random string for WALLET_SECRET_SALT that is unique per agent or space
  const generateWalletSecretSalt = () => {
    if (!selectedAgentId && !selectedSpace) {
      console.error("Cannot generate wallet secret salt: No agent or space selected");
      return;
    }
    
    // Generate a random string (32 characters) with letters, numbers, and some special characters
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=<>?";
    let result = "";
    const length = 32;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    // Store in localStorage with agent-specific or space-specific key
    // if (selectedAgentId) {
    //   localStorage.setItem(`WALLET_SECRET_SALT_${selectedAgentId}`, result);
    // } 
    if (selectedSpace) {
      localStorage.setItem(`WALLET_SECRET_SALT_${selectedSpace}`, result);
    }
    setWalletSecretSalt(result);
  };

  // Base environment variables without WALLET_SECRET_SALT
  const baseEnvContent = `ON_CHAIN_STATE_AGENT_REGISTER=${AGENT_REGISTRY_ADDRESS}
ON_CHAIN_STATE_AGENT_SPACE=${selectedSpace}
ON_CHAIN_STATE_AGENT_IDS=${selectedAgentId}
ON_CHAIN_STATE_RPC=https://optimism-sepolia.gateway.tenderly.co
ON_CHAIN_STATE_DOMAIN=${window.location.origin}/api`;

  // Full environment variables content (displayed but not copied)
  const displayEnvContent = walletSecretSalt
    ? `${baseEnvContent}
ON_CHAIN_STATE_WALLET_SECRET_SALT=${walletSecretSalt} (will not be copied)

# The salt above is used for encrypting sensitive environment variables.
# When an environment variable is marked as encrypted, its value will be
# encrypted using AES with this salt before being stored on the blockchain.`
    : baseEnvContent;

  // Content that will actually be copied to clipboard (without WALLET_SECRET_SALT)
  const envContent = baseEnvContent;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(envContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsCopied(false);
  };

  return (
    <>
      <button onClick={openModal} className={styles.copyButton}>
        Copy Env Variables
      </button>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Environment Variables for {selectedAgentId ? "Agent" : "Space"}</h3>
              <button onClick={closeModal} className={styles.closeButton}>
                &times;
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                Copy these environment variables for {selectedAgentId ? "Agent" : "Space"} development:
              </p>
              <pre className={styles.envPreview}>{displayEnvContent}</pre>
              {walletSecretSalt && (
                <p
                  className={styles.noteText}
                  style={{
                    color: "#ff6b6b",
                    fontSize: "0.85rem",
                    marginTop: "5px",
                  }}
                >
                  Note: WALLET_SECRET_SALT will not be copied for security
                  reasons. This salt is used for encrypting sensitive environment variables.
                </p>
              )}
              <div className={styles.modalActions}>
                <button
                  onClick={handleCopy}
                  className={
                    isCopied ? styles.copiedButton : styles.copyModalButton
                  }
                >
                  {isCopied ? "Copied!" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={generateWalletSecretSalt}
                  className={styles.copyModalButton}
                  style={{ backgroundColor: "#4a6da7", marginLeft: "10px" }}
                >
                  {walletSecretSalt
                    ? "Regenerate WALLET_SECRET_SALT"
                    : "Generate WALLET_SECRET_SALT"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CopyEnvButton;
