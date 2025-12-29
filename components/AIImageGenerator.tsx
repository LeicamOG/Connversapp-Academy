import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Loader, Download, RefreshCw, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    generateImage,
    generateImagePromptSuggestions,
    ImageResolutionType,
    ImageResolutions,
    GenerateImageRequest,
    isNanoBananaConfigured
} from '../services/nanoBanana';

interface AIImageGeneratorProps {
    resolutionType: ImageResolutionType;
    onImageGenerated?: (imageUrl: string) => void;
    context?: {
        title: string;
        description?: string;
        keywords?: string[];
    };
}

const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({
    resolutionType,
    onImageGenerated,
    context
}) => {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState<GenerateImageRequest['style']>('professional');
    const [usePro, setUsePro] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const resolution = ImageResolutions[resolutionType];
    const suggestions = context
        ? generateImagePromptSuggestions({ type: resolutionType, ...context })
        : [];

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Por favor, descreva a imagem que deseja gerar');
            return;
        }

        if (!isNanoBananaConfigured()) {
            setError('API do Google não configurada. Verifique suas variáveis de ambiente.');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const imageUrl = await generateImage({
                prompt: prompt.trim(),
                resolution: resolutionType,
                style,
                usePro
            });

            setGeneratedImage(imageUrl);

            if (onImageGenerated) {
                onImageGenerated(imageUrl);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao gerar imagem');
            console.error('Erro na geração:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;

        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `ai-generated-${resolutionType.toLowerCase()}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const styles: Array<{ value: GenerateImageRequest['style']; label: string; icon: string }> = [
        { value: 'professional', label: 'Profissional', icon: '💼' },
        { value: 'vibrant', label: 'Vibrante', icon: '🎨' },
        { value: 'minimalist', label: 'Minimalista', icon: '✨' },
        { value: 'illustration', label: 'Ilustração', icon: '🖼️' },
        { value: 'realistic', label: 'Realista', icon: '📸' },
    ];

    return (
        <div className="bg-brand-card rounded-xl border border-white/10 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                        <Wand2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Gerador de Imagens IA</h3>
                        <p className="text-xs text-gray-400">
                            Powered by Nano Banana • {resolution.width}x{resolution.height}px
                        </p>
                    </div>
                </div>

                {/* Pro Toggle */}
                <label className="flex items-center gap-2 cursor-pointer group">
                    <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                        Modo Pro
                    </span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={usePro}
                            onChange={(e) => setUsePro(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500 transition-all"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                </label>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                    Descreva a imagem que deseja gerar
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Uma ilustração moderna de um estudante usando tecnologia para aprender..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-brand-primary/50 focus:outline-none resize-none transition-colors"
                    rows={3}
                />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Sugestões baseadas no contexto
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.slice(0, 3).map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => setPrompt(suggestion)}
                                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-gray-300 hover:text-white transition-colors"
                            >
                                {suggestion.split('.')[0]}...
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Style Selection */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Estilo</label>
                <div className="grid grid-cols-5 gap-2">
                    {styles.map((s) => (
                        <button
                            key={s.value}
                            onClick={() => setStyle(s.value)}
                            className={`p-3 rounded-lg border transition-all ${style === s.value
                                    ? 'bg-brand-primary/20 border-brand-primary text-white'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <div className="text-2xl mb-1">{s.icon}</div>
                            <div className="text-xs font-medium">{s.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Gerando imagem...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        Gerar Imagem {usePro && '(Pro)'}
                    </>
                )}
            </button>

            {/* Generated Image Preview */}
            <AnimatePresence>
                {generatedImage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-3"
                    >
                        <div className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5">
                            <img
                                src={generatedImage}
                                alt="Imagem gerada por IA"
                                className="w-full h-auto"
                                style={{ aspectRatio: resolution.aspectRatio }}
                            />

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                    onClick={handleDownload}
                                    className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5 text-white" />
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                                    title="Gerar novamente"
                                >
                                    <RefreshCw className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>
                                {resolution.width}x{resolution.height}px • {resolution.aspectRatio}
                            </span>
                            <span>
                                {usePro ? 'Nano Banana Pro' : 'Nano Banana'}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIImageGenerator;
