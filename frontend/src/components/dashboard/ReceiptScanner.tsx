import React, { useState, useRef, useEffect } from 'react';
import styles from './ReceiptScanner.module.css';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const hasGetUserMedia = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

const ReceiptScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Clean up function to stop all tracks and free memory
  const cleanupMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Please log in to use the receipt scanner",
        variant: "destructive",
      });
    }

    setIsMobile(isMobileDevice());
    setHasCamera(hasGetUserMedia());

    // Clean up on component unmount
    return () => {
      cleanupMediaStream();
    };
  }, [isAuthenticated, toast]);

  const handleCameraToggle = () => {
    if (scanning) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const startCamera = async () => {
    try {
      // Clean up any existing stream first
      cleanupMediaStream();
      
      if (isMobile) {
        try {
          streamRef.current = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
            },
          });
        } catch (mobileErr) {
          console.warn("Couldn't access rear camera, falling back to default:", mobileErr);
          streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      } else {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        setScanning(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Error",
        description: "Failed to access camera. Please make sure you've granted camera permissions or try uploading a photo instead.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    cleanupMediaStream();
    setScanning(false);
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.cameraButton}
        onClick={handleCameraToggle}
        disabled={!hasCamera}
      >
        {scanning ? "Stop Camera" : "Start Camera"}
      </button>
      {!hasCamera && (
        <p className={styles.errorMessage}>Camera not available</p>
      )}
    </div>
  );
};

export default ReceiptScanner;
