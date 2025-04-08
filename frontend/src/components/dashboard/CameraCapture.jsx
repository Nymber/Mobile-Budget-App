import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Box, Button, CircularProgress, Typography, Paper } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config'; // Adjust path as needed

export default function CameraCapture() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
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
    
    return (
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
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
                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                        {error}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}