"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FeedbackForm from '@/components/dashboard/Feedback';

export default function FeedbackPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Feedback</h1>
      
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-card-foreground text-xl">Share Your Feedback</CardTitle>
          <CardDescription className="text-muted-foreground">
            We value your opinion! Let us know what you think about the app,
            report any issues you&apos;ve encountered, or suggest new features.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <FeedbackForm />
        </CardContent>
      </Card>
    </div>
  );
}
