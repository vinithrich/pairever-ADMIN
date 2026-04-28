// components/PatternLockComponent.js
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const PatternLock = dynamic(() => import('react-pattern-lock'), { ssr: false });

const PatternLockComponent = ({ onComplete, isConfirm }) => {
    const [path, setPath] = useState([]);

    const handleFinish = () => {
        if (onComplete) onComplete(path);
    };

    useEffect(() => {
        if (isConfirm) {
            // Reset path when switching to confirm pattern mode
            setPath([]);
        }
    }, [isConfirm]);
    return (
        <PatternLock
            width={300}
            height={300}
            onChange={setPath}
            onFinish={handleFinish}
            path={path}
            connectorThickness={5}
            size={3}
        />
    );
};

export default PatternLockComponent;
