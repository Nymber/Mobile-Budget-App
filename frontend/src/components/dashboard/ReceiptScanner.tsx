import React, { useState, useRef, useEffect } from 'react';
import styles from './static/styles/ReceiptScanner.module.css';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { createInventoryItem, InventoryItem } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const hasGetUserMedia = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

const ReceiptScanner: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptItems, setReceiptItems] = useState<InventoryItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setImage(dataUrl);

      dataURLtoFile(dataUrl, "camera-capture.png")
        .then(file => processReceipt(file))
        .catch(err => {
          console.error('Error converting data URL to file:', err);
          toast({
            title: "Error",
            description: "Failed to process image. Please try again.",
            variant: "destructive",
          });
        });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      processReceipt(file);
    }
  };

  const dataURLtoFile = (dataURL: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
      try {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }

        const file = new File([u8arr], filename, { type: mime });
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  };

  const processReceipt = async (file: File) => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Please log in to use the receipt scanner",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const token = localStorage.getItem('token') ||
        (localStorage.getItem('authData') ?
          JSON.parse(localStorage.getItem('authData') || '{}').token :
          null);

      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_URL}/upload-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to process receipt');
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Receipt processed successfully. Amount: $${data.amount.toFixed(2)}`,
      });
      setReceiptItems(data.items);
      await addToInventory(); // Automatically add items to inventory after processing
    } catch (err: unknown) {
      console.error('Error processing receipt:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to process receipt. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addToInventory = async () => {
    try {
      for (const item of receiptItems) {
        const response = await createInventoryItem(item);
        if (response.error) {
          throw new Error(response.error);
        }
      }
      toast({
        title: "Success",
        description: "Items added to inventory successfully!",
      });
    } catch (err) {
      console.error('Error adding items to inventory:', err);
      toast({
        title: "Error",
        description: "Failed to add items to inventory. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={styles.container}>
      <h2>Receipt Scanner</h2>

      <div className={styles.cameraContainer}>
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          playsInline
          style={{ display: scanning ? 'block' : 'none' }}
        />
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      <div className={styles.controls}>
        {hasCamera && (
          <Button
            onClick={handleCameraToggle}
            variant={scanning ? "destructive" : "default"}
            className="mb-2"
          >
            {scanning ? "Stop Camera" : "Start Camera"}
          </Button>
        )}

        {scanning && (
          <Button
            onClick={captureImage}
            disabled={isProcessing}
            className="mb-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Capture Receipt"
            )}
          </Button>
        )}

        <Button
          onClick={() => document.getElementById('file-upload')?.click()}
          className="mb-2"
        >
          Upload Receipt
        </Button>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          title="Upload a receipt image"
        />
      </div>

      {receiptItems.length > 0 && (
        <div className={styles.receiptItems}>
          <h3>Receipt Items</h3>
          <ul>
            {receiptItems.map((item, index) => (
              <li key={index}>
                {item.name} - {item.quantity} @ ${item.price.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {image && (
        <div className={styles.preview}>
          <Image
            src={image}
            alt="Receipt Preview"
            width={500}
            height={500}
            className={styles.previewImage}
            unoptimized
          />
        </div>
      )}
    </div>
  );
};

export default ReceiptScanner;
