import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Box, Button, CircularProgress, Typography, Paper } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config'; // Adjust path as needed
import styles from './styles/CameraCapture.module.css';

export default function CameraCapture() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [photo, setPhoto] = useState(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const navigate = useNavigate();

    const handleCapture = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('receipt', file);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/upload-receipt`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            // Navigate to receipt details or receipts list after successful upload
            if (response.data && response.data.receipt_id) {
                navigate(`/receipts/${response.data.receipt_id}`);
            } else {
                navigate('/receipts');
            }
        } catch (err) {
            console.error('Error uploading receipt:', err);
            setError(err.response?.data?.detail || 'Failed to upload receipt');
        } finally {
            setLoading(false);
        }
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/png'));
    };

    const clearPhoto = () => {
        setPhoto(null);
    };

    return (
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <div className={styles.container}>
                <h1 className={styles.title}>Camera Capture</h1>
                <div className={styles.cameraContainer}>
                    <video ref={videoRef} className={styles.video} autoPlay playsInline></video>
                    <button onClick={capturePhoto} className={styles.captureButton}>Capture</button>
                </div>
                {photo && (
                    <div className={styles.photoPreview}>
                        <img src={photo} alt="Captured" className={styles.photo} />
                        <button onClick={clearPhoto} className={styles.clearButton}>Clear</button>
                    </div>
                )}
                <Box display="flex" flexDirection="column" alignItems="center">
                    <input
                        type="file"
                        accept="image/*"
                        capture="camera"
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <Button
                        variant="contained"
                        startIcon={<PhotoCamera />}
                        onClick={handleCapture}
                        disabled={loading}
                        sx={{ mb: 2 }}
                    >
                        {loading ? 'Processing...' : 'Capture Receipt'}
                    </Button>

                    {loading && (
                        <Box display="flex" alignItems="center" flexDirection="column" my={2}>
                            <CircularProgress size={24} sx={{ mb: 1 }} />
                            <Typography variant="body2">Processing receipt...</Typography>
                        </Box>
                    )}

                    {error && (
                        <Box>
                            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                {error}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </div>
        </Paper>
    );
}