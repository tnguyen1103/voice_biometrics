import { useRef, useState } from 'react';
import type { DragEvent } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  selectedFile?: File | null;
}

export function FileUploader({ onFileSelect, accept = 'audio/*', selectedFile }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleChange = () => {
    const file = inputRef.current?.files?.[0];
    if (file) onFileSelect(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? 'var(--color-secondary)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#EFF6FF' : 'var(--color-bg)',
          transition: 'all 0.15s',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
          Drag & drop audio file or <span style={{ color: 'var(--color-secondary)' }}>browse</span>
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 4 }}>
          Supported: WAV, MP3, M4A, OGG, WebM
        </p>
        <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={handleChange} />
      </div>
      {selectedFile && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 14px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#1D4ED8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedFile.name}
            </p>
            <p style={{ fontSize: 11, color: '#3B82F6' }}>{formatSize(selectedFile.size)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
