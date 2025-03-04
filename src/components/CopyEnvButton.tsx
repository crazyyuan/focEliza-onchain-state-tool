import React, { useState } from 'react';
import styles from '../styles/Home.module.css';
import { AGENT_REGISTRY_ADDRESS } from '../contract/address';

interface CopyEnvButtonProps {
  selectedSpace: string;
  selectedAgentId: string;
}

const CopyEnvButton: React.FC<CopyEnvButtonProps> = ({ selectedSpace, selectedAgentId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const envContent = `ON_CHAIN_STATE_AGENT_REGISTER=${AGENT_REGISTRY_ADDRESS}
ON_CHAIN_STATE_AGENT_SPACE=${selectedSpace}
ON_CHAIN_STATE_AGENT_IDS=${selectedAgentId}
ON_CHAIN_STATE_RPC=https://optimism-sepolia.gateway.tenderly.co`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(envContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
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
              <h3>Environment Variables for Eliza</h3>
              <button onClick={closeModal} className={styles.closeButton}>
                &times;
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                Copy these environment variables for Eliza development:
              </p>
              <pre className={styles.envPreview}>{envContent}</pre>
              <div className={styles.modalActions}>
                <button 
                  onClick={handleCopy} 
                  className={isCopied ? styles.copiedButton : styles.copyModalButton}
                >
                  {isCopied ? 'Copied!' : 'Copy to Clipboard'}
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
