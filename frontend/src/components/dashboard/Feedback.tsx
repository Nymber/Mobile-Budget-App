"use client";

import './styles/Feedback.module.css';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { apiPost } from '@/services/apiUtils';

interface FeedbackResponse {
  success: boolean;
  message?: string;
  id?: number;
  // Add any other fields that might be in the response
}

const Feedback: React.FC = () => {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      if (rating === 0) {
        throw new Error('Please select a rating before submitting');
      }

      if (!message.trim()) {
        throw new Error('Please enter a message before submitting');
      }

      const feedback = {
        message,
        type: feedbackType,
        rating
      };

      const response = await apiPost<FeedbackResponse>('/api/feedback', feedback);
      
      // Type-check the response
      if (response && response.success) {
        setSuccess(true);
        setMessage('');
        setRating(0);
        setFeedbackType('general');
      } else {
        throw new Error(response?.message || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="type" className="block text-sm font-medium">
              Feedback Type
            </label>
            <select
              id="type"
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement Suggestion</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium">
              Your Feedback
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, experiences, or suggestions..."
              className="min-h-[120px]"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Rate Your Experience
            </label>
            <div className="py-2">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
              />
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-100 text-green-700 rounded-md">
              Thank you for your feedback! We appreciate your input.
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Feedback;
