import React from 'react';
import styles from '../styles/Home.module.css';

const CharacterTemplateLink: React.FC = () => {
  return (
    <div className={styles.templateLink}>
      <a 
        href="/character-template.json" 
        download="character-template.json"
        className={styles.templateLinkAnchor}
      >
        Download Character Template
      </a>
      <p className={styles.templateDescription}>
        Use this template to create your character JSON file for uploading.
      </p>
    </div>
  );
};

export default CharacterTemplateLink;
