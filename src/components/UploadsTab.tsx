
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  Image,
  Video,
  FileText,
  Music,
  Trash2,
  Copy,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../supabaseClient';
import { postService } from '../services/postService';

interface UploadsTabProps {
  lang: 'en' | 'ar';
}

interface MediaFile {
  id: string;
  name: string;
  url: string;
  created_at: string;
  metadata: {
    mimetype: string;
    size: number;
  };
}

export const UploadsTab: React.FC<UploadsTabProps> = ({ lang }) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    title: lang === 'en' ? 'Media Uploads' : 'رفع الوسائط',
    upload: lang === 'en' ? 'Upload New Media' : 'رفع وسائط جديدة',
    drop: lang === 'en' ? 'Drop files here or click to browse' : 'أفلت الملفات هنا أو انقر للتصفح',
  };

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from('media').list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      setError(error.message);
    } else if (data) {
      const formattedFiles = data
        .filter(file => !file.name.startsWith('.')) // Filter out empty folders
        .map(file => {
          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(file.name);
          return {
            id: file.id,
            name: file.name,
            url: publicUrl,
            created_at: file.created_at,
            metadata: {
              mimetype: file.metadata.mimetype,
              size: file.metadata.size,
            }
          };
        });
      setFiles(formattedFiles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    setUploading(true);
    setError('');

    try {
      for (const file of selectedFiles) {
        await postService.uploadMedia(file);
      }
      await fetchFiles(); // Refresh file list
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      await supabase.storage.from('media').remove([fileName]);
      await fetchFiles();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-8 h-8 text-blue-400" />;
    if (mimeType.startsWith('video/')) return <Video className="w-8 h-8 text-purple-400" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8 text-green-400" />;
    return <FileText className="w-8 h-8 text-gray-400" />;
  };

  return (
    <div className="bg-app-card border border-white/10 rounded-3xl p-6">
      <h3 className="text-xl font-bold text-app-text mb-4">{t.title}</h3>
      <div className="mb-6">
        <label
          htmlFor="media-upload-input"
          className="relative block w-full border-2 border-dashed border-white/20 rounded-2xl p-12 text-center cursor-pointer hover:border-app-accent/50 hover:bg-white/5 transition-all"
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-app-accent animate-spin mb-4" />
              <p className="text-app-muted">{lang === 'en' ? 'Uploading...' : 'جاري الرفع...'}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 text-app-accent mb-4" />
              <h4 className="text-app-text font-bold">{t.upload}</h4>
              <p className="text-xs text-app-muted">{t.drop}</p>
            </div>
          )}
          <input
            id="media-upload-input"
            type="file"
            multiple
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-app-accent mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map(file => (
            <div key={file.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center h-32 bg-app-bg rounded-lg mb-4">
                  {file.metadata.mimetype.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="max-h-full max-w-full object-contain rounded-lg" />
                  ) : (
                    getFileIcon(file.metadata.mimetype)
                  )}
                </div>
                <p className="text-xs text-app-text font-bold break-all">{file.name}</p>
                <p className="text-[10px] text-app-muted">
                  {(file.metadata.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => navigator.clipboard.writeText(file.url)}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-app-accent/10 text-app-accent text-xs hover:bg-app-accent/20 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteFile(file.name)}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

