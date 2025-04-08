import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/DownloadExcel.module.css';

interface Report {
  id: number;
  name: string;
  description: string;
  endpoint: string;
}

const DownloadExcel: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available reports from the backend
    const fetchReports = async () => {
      try {
        const response = await axios.get<Report[]>('/api/reports'); // Replace with the actual backend route
        setReports(response.data);
      } catch (error) {
        console.error('Error fetching reports:', error);
        alert('Failed to fetch reports. Please try again later.');
      }
    };

    fetchReports();
  }, []);

  const handleDownload = async (endpoint: string) => {
    setLoading(true);
    try {
      const response = await axios.get(endpoint, {
        responseType: 'blob', // Ensure the response is treated as a file
      });

      // Create a download link for the file
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'report.xlsx'); // Default filename
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download the report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Download Reports</h1>
      <div className="bg-white shadow rounded-lg p-6">
        {loading && <p className="text-blue-500">Downloading...</p>}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div key={report.id} className="border rounded-lg p-4">
              <h2 className="font-bold text-lg">{report.name}</h2>
              <p className="text-gray-600 mb-4">{report.description}</p>
              <button
                onClick={() => handleDownload(report.endpoint)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={loading}
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DownloadExcel;
