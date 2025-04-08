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
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

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

    return () => {
      if (scanning) {
        stopCamera();
      }
    };
  }, [isAuthenticated, scanning, toast]);

  const handleCameraToggle = () => {
    if (scanning) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const startCamera = async () => {
    try {
      let stream;
      if (isMobile) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
            },
          });
        } catch (mobileErr) {
          console.warn("Couldn't access rear camera, falling back to default:", mobileErr);
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track: MediaStreamTrack) => track.stop());
      videoRef.current.srcObject = null;
      setScanning(false);
    }
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
