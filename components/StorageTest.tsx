import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader, Upload, Database } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { STORAGE_BUCKETS, listFiles } from '../services/storage';
import { supabase } from '../services/supabase';

const StorageTest: React.FC = () => {
    const [testing, setTesting] = useState(false);
    const [results, setResults] = useState<{
        bucket: string;
        exists: boolean;
        fileCount?: number;
    }[]>([]);
    const [testImageUrl, setTestImageUrl] = useState<string>('');

    const testBuckets = async () => {
        setTesting(true);
        const testResults = [];

        for (const [key, bucketName] of Object.entries(STORAGE_BUCKETS)) {
            try {
                // Tentar listar arquivos do bucket
                const files = await listFiles(bucketName);
                testResults.push({
                    bucket: `${key} (${bucketName})`,
                    exists: true,
                    fileCount: files.length
                });
            } catch (error) {
                testResults.push({
                    bucket: `${key} (${bucketName})`,
                    exists: false
                });
            }
        }

        setResults(testResults);
        setTesting(false);
    };

    const checkSupabaseConnection = async () => {
        if (!supabase) {
            return { connected: false, message: 'Supabase não configurado' };
        }

        try {
            const { data, error } = await supabase.storage.listBuckets();
            if (error) throw error;
            return {
                connected: true,
                message: `Conectado! ${data.length} buckets encontrados`,
                buckets: data.map(b => b.name)
            };
        } catch (error) {
            return {
                connected: false,
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    };

    const [connectionStatus, setConnectionStatus] = useState<any>(null);

    const testConnection = async () => {
        setTesting(true);
        const status = await checkSupabaseConnection();
        setConnectionStatus(status);
        setTesting(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-brand-card rounded-xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-primary/20 rounded-lg">
                        <Database className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Teste de Storage</h1>
                        <p className="text-sm text-gray-400">
                            Verifique se o Supabase Storage está configurado corretamente
                        </p>
                    </div>
                </div>

                {/* Connection Test */}
                <div className="space-y-3">
                    <button
                        onClick={testConnection}
                        disabled={testing}
                        className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {testing ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Testando conexão...
                            </>
                        ) : (
                            <>
                                <Database className="w-5 h-5" />
                                Testar Conexão com Supabase
                            </>
                        )}
                    </button>

                    {connectionStatus && (
                        <div className={`p-4 rounded-lg border ${connectionStatus.connected
                            ? 'bg-green-500/10 border-green-500/20'
                            : 'bg-red-500/10 border-red-500/20'
                            }`}>
                            <div className="flex items-start gap-3">
                                {connectionStatus.connected ? (
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-medium ${connectionStatus.connected ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {connectionStatus.message}
                                    </p>
                                    {connectionStatus.buckets && (
                                        <div className="mt-2 text-sm text-gray-400">
                                            <p className="font-medium mb-1">Buckets encontrados:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                {connectionStatus.buckets.map((bucket: string) => (
                                                    <li key={bucket}>{bucket}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bucket Test */}
            <div className="bg-brand-card rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Teste de Buckets</h2>

                <button
                    onClick={testBuckets}
                    disabled={testing}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
                >
                    {testing ? (
                        <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Testando buckets...
                        </>
                    ) : (
                        'Testar Todos os Buckets'
                    )}
                </button>

                {results.length > 0 && (
                    <div className="space-y-2">
                        {results.map((result, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center justify-between p-3 rounded-lg border ${result.exists
                                    ? 'bg-green-500/10 border-green-500/20'
                                    : 'bg-red-500/10 border-red-500/20'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {result.exists ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    )}
                                    <span className="text-white font-medium">{result.bucket}</span>
                                </div>
                                {result.exists && result.fileCount !== undefined && (
                                    <span className="text-sm text-gray-400">
                                        {result.fileCount} arquivo(s)
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Test */}
            <div className="bg-brand-card rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Teste de Upload</h2>
                <p className="text-sm text-gray-400 mb-4">
                    Faça upload de uma imagem de teste para verificar se tudo está funcionando
                </p>

                <ImageUpload
                    bucket={STORAGE_BUCKETS.GENERAL}
                    currentImageUrl={testImageUrl}
                    onImageUploaded={(url) => {
                        setTestImageUrl(url);
                        console.log('✅ Upload bem-sucedido! URL:', url);
                    }}
                    label="Imagem de Teste"
                    aspectRatio="16/9"
                    fileName="test-image.png"
                />

                {testImageUrl && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-medium text-green-400 mb-2">Upload realizado com sucesso!</p>
                                <div className="text-sm text-gray-400 break-all">
                                    <p className="font-medium mb-1">URL da imagem:</p>
                                    <code className="bg-black/30 px-2 py-1 rounded text-xs">
                                        {testImageUrl}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-400 mb-3">📋 Checklist</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">1.</span>
                        <span>Clique em "Testar Conexão com Supabase" para verificar se está conectado</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">2.</span>
                        <span>Clique em "Testar Todos os Buckets" para verificar se os 6 buckets foram criados</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">3.</span>
                        <span>Faça upload de uma imagem de teste</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">4.</span>
                        <span>Verifique se a URL pública está acessível (clique na imagem)</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default StorageTest;
