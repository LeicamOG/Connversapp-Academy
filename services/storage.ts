/**
 * Supabase Storage Service
 * Gerenciamento de upload e armazenamento de imagens
 */

import { supabase } from './supabase';

// Buckets do Supabase Storage
export const STORAGE_BUCKETS = {
    AVATARS: 'avatars',           // Fotos de perfil dos usuários
    COURSE_COVERS: 'course-covers', // Capas de cursos
    COURSE_BANNERS: 'course-banners', // Banners de cursos
    LESSON_IMAGES: 'lesson-images',  // Imagens de aulas
    CERTIFICATES: 'certificates',    // Certificados
    GENERAL: 'general'              // Imagens gerais
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

/**
 * Interface para resultado de upload
 */
export interface UploadResult {
    url: string;
    path: string;
    bucket: string;
}

/**
 * Converte File ou Blob para base64
 */
export function fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Converte base64 para Blob
 */
export function base64ToBlob(base64: string): Blob {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}

/**
 * Gera um nome de arquivo único
 */
function generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${random}.${extension}`;
}

/**
 * Upload de arquivo para o Supabase Storage
 */
export async function uploadFile(
    file: File | Blob,
    bucket: StorageBucket,
    options?: {
        fileName?: string;
        folder?: string;
        upsert?: boolean;
    }
): Promise<UploadResult> {
    if (!supabase) {
        console.warn('⚠️ Supabase não configurado. Usando fallback local (base64)');

        // Fallback: converter para base64 e armazenar localmente
        const base64 = await fileToBase64(file);
        const fileName = options?.fileName || `local-${Date.now()}.png`;
        const localPath = `${bucket}/${options?.folder || ''}/${fileName}`;

        // Armazenar no localStorage
        const storageKey = `storage_${bucket}_${fileName}`;
        localStorage.setItem(storageKey, base64);

        return {
            url: base64,
            path: localPath,
            bucket
        };
    }

    try {
        // Gerar nome do arquivo
        const fileName = options?.fileName || generateUniqueFileName(
            file instanceof File ? file.name : 'image.png'
        );

        // Caminho completo no bucket
        const folder = options?.folder || '';
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        console.log('📤 Uploading file to Supabase Storage:', {
            bucket,
            path: filePath,
            size: file.size
        });

        // Upload para o Supabase
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: options?.upsert || false
            });

        if (error) {
            console.error('❌ Upload error:', error);
            throw error;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        console.log('✅ File uploaded successfully:', urlData.publicUrl);

        return {
            url: urlData.publicUrl,
            path: filePath,
            bucket
        };

    } catch (error) {
        console.error('❌ Error uploading file:', error);

        // Fallback para base64 local em caso de erro
        const base64 = await fileToBase64(file);
        const fileName = options?.fileName || `fallback-${Date.now()}.png`;

        return {
            url: base64,
            path: `${bucket}/${fileName}`,
            bucket
        };
    }
}

/**
 * Upload de imagem a partir de URL ou base64
 */
export async function uploadImageFromUrl(
    imageUrl: string,
    bucket: StorageBucket,
    options?: {
        fileName?: string;
        folder?: string;
    }
): Promise<UploadResult> {
    try {
        // Se já for uma URL do Supabase, retornar como está
        if (imageUrl.includes('supabase.co/storage')) {
            return {
                url: imageUrl,
                path: imageUrl.split('/').slice(-2).join('/'),
                bucket
            };
        }

        // Se for base64, converter para Blob
        if (imageUrl.startsWith('data:')) {
            const blob = base64ToBlob(imageUrl);
            return uploadFile(blob, bucket, options);
        }

        // Se for URL externa, fazer download e upload
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return uploadFile(blob, bucket, options);

    } catch (error) {
        console.error('❌ Error uploading image from URL:', error);

        // Fallback: retornar a URL original
        return {
            url: imageUrl,
            path: imageUrl,
            bucket
        };
    }
}

/**
 * Deletar arquivo do Supabase Storage
 */
export async function deleteFile(
    bucket: StorageBucket,
    filePath: string
): Promise<boolean> {
    if (!supabase) {
        // Remover do localStorage
        const fileName = filePath.split('/').pop();
        const storageKey = `storage_${bucket}_${fileName}`;
        localStorage.removeItem(storageKey);
        return true;
    }

    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error('❌ Delete error:', error);
            return false;
        }

        console.log('✅ File deleted successfully:', filePath);
        return true;

    } catch (error) {
        console.error('❌ Error deleting file:', error);
        return false;
    }
}

/**
 * Listar arquivos em um bucket
 */
export async function listFiles(
    bucket: StorageBucket,
    folder?: string
): Promise<string[]> {
    if (!supabase) {
        // Listar do localStorage
        const files: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(`storage_${bucket}_`)) {
                files.push(key.replace(`storage_${bucket}_`, ''));
            }
        }
        return files;
    }

    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(folder);

        if (error) {
            console.error('❌ List error:', error);
            return [];
        }

        return data.map(file => file.name);

    } catch (error) {
        console.error('❌ Error listing files:', error);
        return [];
    }
}

/**
 * Criar buckets necessários (executar uma vez na configuração inicial)
 */
export async function initializeStorageBuckets(): Promise<void> {
    if (!supabase) {
        console.warn('⚠️ Supabase não configurado. Buckets não serão criados.');
        return;
    }

    const buckets = Object.values(STORAGE_BUCKETS);

    for (const bucket of buckets) {
        try {
            // Verificar se o bucket já existe
            const { data: existingBuckets } = await supabase.storage.listBuckets();
            const bucketExists = existingBuckets?.some(b => b.name === bucket);

            if (!bucketExists) {
                // Criar bucket público
                const { error } = await supabase.storage.createBucket(bucket, {
                    public: true,
                    fileSizeLimit: 5242880 // 5MB
                });

                if (error) {
                    console.error(`❌ Error creating bucket ${bucket}:`, error);
                } else {
                    console.log(`✅ Bucket ${bucket} created successfully`);
                }
            } else {
                console.log(`✓ Bucket ${bucket} already exists`);
            }
        } catch (error) {
            console.error(`❌ Error initializing bucket ${bucket}:`, error);
        }
    }
}

/**
 * Utilitário para validar tipo de arquivo
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Tipo de arquivo inválido. Use JPEG, PNG, GIF ou WebP.'
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'Arquivo muito grande. Tamanho máximo: 5MB.'
        };
    }

    return { valid: true };
}

export default {
    uploadFile,
    uploadImageFromUrl,
    deleteFile,
    listFiles,
    initializeStorageBuckets,
    validateImageFile,
    fileToBase64,
    base64ToBlob,
    STORAGE_BUCKETS
};
