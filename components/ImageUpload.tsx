import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFile, validateImageFile, StorageBucket, STORAGE_BUCKETS } from '../services/storage';

interface ImageUploadProps {
    bucket: StorageBucket;
    currentImageUrl?: string;
    onImageUploaded: (url: string) => void;
    folder?: string;
    fileName?: string;
    label?: string;
    aspectRatio?: string;
    maxSizeMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    bucket,
    currentImageUrl,
    onImageUploaded,
    folder,
    fileName,
    label = 'Upload de Imagem',
    aspectRatio = '16/9',
    maxSizeMB = 5
}) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar arquivo
        const validation = validateImageFile(file);
        if (!validation.valid) {
            setError(validation.error || 'Arquivo inválido');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            // Criar preview local
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Upload para Supabase
            const result = await uploadFile(file, bucket, {
                fileName,
                folder,
                upsert: true
            });

            console.log('✅ Upload concluído:', result.url);
            onImageUploaded(result.url);

        } catch (err) {
            console.error('❌ Erro no upload:', err);
            setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
            setPreview(currentImageUrl || null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onImageUploaded('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-3">
            {/* Label */}
            <label className="text-sm font-medium text-gray-300">
                {label}
            </label>

            {/* Upload Area */}
            <div className="relative">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {preview ? (
                    /* Preview com imagem */
                    <div className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5 group">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-auto object-cover"
                            style={{ aspectRatio }}
                        />

                        {/* Overlay com ações */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                                onClick={handleClick}
                                disabled={uploading}
                                className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
                                title="Trocar imagem"
                            >
                                {uploading ? (
                                    <Loader className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5 text-white" />
                                )}
                            </button>
                            <button
                                onClick={handleRemove}
                                disabled={uploading}
                                className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                title="Remover imagem"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Loading overlay */}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <div className="text-center">
                                    <Loader className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-white">Fazendo upload...</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Área de upload vazia */
                    <button
                        onClick={handleClick}
                        disabled={uploading}
                        className="w-full border-2 border-dashed border-white/20 rounded-lg p-8 hover:border-brand-primary/50 hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ aspectRatio }}
                    >
                        <div className="flex flex-col items-center justify-center gap-3">
                            {uploading ? (
                                <>
                                    <Loader className="w-12 h-12 text-brand-primary animate-spin" />
                                    <p className="text-sm text-gray-400">Fazendo upload...</p>
                                </>
                            ) : (
                                <>
                                    <div className="p-3 bg-white/5 rounded-full">
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-white mb-1">
                                            Clique para fazer upload
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            PNG, JPG, GIF ou WebP (máx. {maxSizeMB}MB)
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </button>
                )}
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    >
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Info */}
            <p className="text-xs text-gray-500">
                {bucket === STORAGE_BUCKETS.AVATARS && 'Recomendado: 512x512px (1:1)'}
                {bucket === STORAGE_BUCKETS.COURSE_COVERS && 'Recomendado: 1200x675px (16:9)'}
                {bucket === STORAGE_BUCKETS.COURSE_BANNERS && 'Recomendado: 1920x600px (16:5)'}
                {bucket === STORAGE_BUCKETS.LESSON_IMAGES && 'Recomendado: 1200x675px (16:9)'}
            </p>
        </div>
    );
};

export default ImageUpload;
