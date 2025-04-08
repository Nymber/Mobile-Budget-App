import React, { useEffect } from 'react';
import styles from './styles/SharedFeatures.module.css';

function SharedFeatures() {
    useEffect(() => {
        // Real-time synchronization logic
    }, []);
    
    const features = [
        { title: 'Notification System', description: 'Real-time notifications for updates.' },
        { title: 'Collaborative Inventory Management', description: 'Manage inventory collaboratively.' }
    ];
    
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Shared Features</h1>
            <div className={styles.content}>
                {features.map((feature, index) => (
                    <div key={index} className={styles.featureItem}>
                        <h2 className={styles.featureTitle}>{feature.title}</h2>
                        <p className={styles.featureDescription}>{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SharedFeatures;