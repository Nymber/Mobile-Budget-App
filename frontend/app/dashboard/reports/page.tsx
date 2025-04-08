"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { downloadReport, getReports, ReportOption } from '@/services/api';
import { ToastProvider, useToast } from '@/components/ui/use-toast';

// Define CustomReportForm first to avoid hoisting issues
function CustomReportForm() {
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [reportType, setReportType] = useState('expenses');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Helper functions to set default dates (current month range)
  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0); // Last day of current month
    return date.toISOString().split('T')[0];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Format the endpoint with query parameters
      const endpoint = `/${reportType}-excel?start_date=${startDate}&end_date=${endDate}`;
      
      // Download the report
      const blob = await downloadReport(endpoint);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${startDate}-to-${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 0);
      
      toast({
        title: "Report Downloaded",
        description: "Your custom report has been downloaded successfully.",
      });
    } catch (err) {
      console.error('Error downloading custom report:', err);
      toast({
        title: "Download Failed",
        description: err instanceof Error ? err.message : 'An error occurred while downloading the report',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="start-date" className="text-sm font-medium">
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="end-date" className="text-sm font-medium">
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="report-type" className="text-sm font-medium">
          Report Type
        </label>
        <select
          id="report-type"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="expenses">Expenses</option>
          <option value="earnings">Earnings</option>
          <option value="inventory">Inventory</option>
        </select>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating Report...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" /> Generate Custom Report
          </>
        )}
      </Button>
    </form>
  );
}

function ReportsContent() {
  const [reports, setReports] = useState<ReportOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await getReports();
        if (response.data) {
          setReports(response.data);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: 'Error',
          description: 'Failed to load report options',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [toast]);

  const handleDownload = async (reportId: string, endpoint: string) => {
    try {
      setDownloadingId(reportId);
      
      // Show longer-running indication for port-forwarded environments
      toast({
        title: "Preparing Download",
        description: "Please wait while we generate your report. This may take a moment...",
      });
      
      // Download the report with improved error handling
      const blob = await downloadReport(endpoint);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportId}-report.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 0);
      
      toast({
        title: "Report Downloaded",
        description: `Your ${reportId} report has been downloaded successfully.`,
      });
    } catch (err) {
      console.error(`Error downloading report ${reportId}:`, err);
      
      // Enhanced error messages for common port-forwarding issues
      let errorMessage = err instanceof Error ? err.message : 'An error occurred while downloading the report';
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your connection to the server and try again.';
      } else if (errorMessage.includes('timed out')) {
        errorMessage = 'The request timed out. This can happen with port-forwarded connections. Please try again.';
      } else if (errorMessage.includes('Authentication')) {
        errorMessage = 'Your session has expired. Please log in again.';
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login?session=expired';
        }, 2000);
      }
      
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8">Financial Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{report.name}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="flex-grow flex items-center justify-center mb-4">
                <FileSpreadsheet className="text-blue-500 h-16 w-16" />
              </div>
              <Button 
                className="w-full mt-auto"
                onClick={() => handleDownload(report.id, report.endpoint)}
                disabled={downloadingId === report.id}
              >
                {downloadingId === report.id ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Download Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Custom Date Range Reports</CardTitle>
          <CardDescription>Generate financial reports for specific time periods</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomReportForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ToastProvider>
      <ReportsContent />
    </ToastProvider>
  );
}
