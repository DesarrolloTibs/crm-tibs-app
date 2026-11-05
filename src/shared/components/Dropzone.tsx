import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface DropzoneProps {
  id: string;
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  label?: string;
  helpText?: string;
  buttonText?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  id,
  accept,
  multiple = false,
  onFilesSelected,
  label,
  helpText = 'Arrastra y suelta o haz clic para buscar',
  buttonText = 'Buscar archivo',
  icon = <UploadCloud size={30} className="text-indigo-500 mb-2 animate-bounce" style={{ animationDuration: '3s' }} />,
  className = '',
}) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
          {label}
        </label>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[160px] ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99] shadow-lg'
            : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50/80 hover:border-slate-350'
        } ${className}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id={id}
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleFileChange}
        />
        <label htmlFor={id} className="cursor-pointer flex flex-col items-center select-none w-full">
          {icon}
          <span className="text-sm font-semibold text-slate-700">{helpText}</span>
          <span className="mt-4 inline-flex items-center text-[10px] uppercase tracking-widest bg-white border border-slate-200 text-indigo-600 px-4 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-500/5 hover:-translate-y-0.5 transition-all hover:bg-indigo-50 cursor-pointer">
            {buttonText}
          </span>
        </label>
      </div>
    </div>
  );
};

export default Dropzone;
