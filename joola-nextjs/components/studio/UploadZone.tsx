'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, ImageIcon, X, RefreshCw } from 'lucide-react'

interface UploadZoneProps {
  image: string | null          // base64 data URL
  fileName: string
  fileSize: number
  onUpload: (base64: string, fileName: string, fileSize: number) => void
  onClear: () => void
}

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export default function UploadZone({ image, fileName, fileSize, onUpload, onClear }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback((file: File) => {
    setError(null)
    if (!ACCEPTED.includes(file.type)) {
      setError('Only JPG, PNG, WEBP supported')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Max 20MB — please compress your image')
      return
    }

    setProgress(10)
    const reader = new FileReader()
    reader.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90))
    }
    reader.onloadend = () => {
      setProgress(100)
      setTimeout(() => setProgress(0), 600)
      onUpload(reader.result as string, file.name, file.size)
    }
    reader.readAsDataURL(file)
  }, [onUpload])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 space-y-3 flex flex-col">
      <div>
        <h2 className="text-sm font-bold text-white">Upload Your Product Image</h2>
        <p className="text-[11px] text-[#64748b] mt-0.5 leading-relaxed">
          Paddle, product shot, or any JOOLA item.{' '}
          <span className="text-[#475569]">Your product stays 100% untouched.</span>
        </p>
      </div>

      {image ? (
        <div className="space-y-2 flex-1">
          <div className="relative rounded-lg overflow-hidden border border-[#1e1e2e] bg-[#0a0a0f]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="Product"
              className="w-full h-[220px] object-contain"
            />
            <button
              onClick={onClear}
              className="absolute top-2 right-2 p-1 bg-[#0d0d14]/80 hover:bg-red-500/20 text-[#94a3b8] hover:text-red-400 rounded-md transition-colors"
            >
              <X size={13} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-white font-medium truncate">{fileName}</p>
              <p className="text-[10px] text-[#64748b]">{formatSize(fileSize)}</p>
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e1e2e] hover:bg-[#2a2a3e] text-[#94a3b8] hover:text-white rounded-lg text-[11px] transition-colors flex-shrink-0"
            >
              <RefreshCw size={11} />
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`flex-1 flex flex-col items-center justify-center min-h-[220px] border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            dragging
              ? 'border-[#00d4ff] bg-[#00d4ff]/5'
              : 'border-[#1e1e2e] hover:border-[#334155] hover:bg-[#0d0d14]'
          }`}
        >
          <div className="flex flex-col items-center gap-2.5 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1e1e2e] flex items-center justify-center">
              {dragging ? (
                <Upload size={20} className="text-[#00d4ff]" />
              ) : (
                <ImageIcon size={20} className="text-[#334155]" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[#94a3b8]">
                {dragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-[11px] text-[#475569] mt-1">PNG, JPG, WEBP up to 20MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {progress > 0 && progress < 100 && (
        <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#1a5cff] to-[#00d4ff] transition-all duration-200 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
