'use client';

import { useState, useCallback } from 'react';

export default function UploadZone({ onUploadComplete }: { onUploadComplete: (data: any[]) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const processFile = async (file: File) => {
    setIsUploading(true);
    setFileName(file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        onUploadComplete(data.fullData);
      } else {
        alert('Upload failed: ' + data.error);
        setFileName(null);
      }
    } catch (err) {
      alert('Error uploading file');
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden rounded-2xl
        transition-all duration-300 ease-out
        flex items-center justify-center
        h-40 cursor-pointer
        ${isDragging 
          ? 'border-2 border-blue-400 bg-blue-500/10 scale-[1.01] shadow-xl shadow-blue-500/20' 
          : 'border border-dashed border-slate-700 hover:border-slate-500 glass-card'}
      `}
    >
      <input 
        type="file" 
        accept=".xlsx,.xls"
        aria-label="Upload monitoring form"
        title="Upload monitoring form"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} 
      />
      
      <div className="text-center space-y-3 pointer-events-none">
        {isUploading ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-400 font-medium">Processing {fileName}...</span>
          </div>
        ) : fileName ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-white font-medium">{fileName}</p>
              <p className="text-xs text-slate-500">Drop a new file to replace</p>
            </div>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 mb-1">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-slate-200">
                Drop your <span className="text-blue-400">MONITORING FORM</span> here
              </p>
              <p className="text-sm text-slate-500 mt-1">
                or click to browse • .xlsx files only
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
