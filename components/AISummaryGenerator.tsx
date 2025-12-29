import React, { useState } from 'react';
import { FileText, Loader, Copy, Check, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    generateSummary,
    generateLessonNotes,
    GenerateSummaryRequest,
    isNanoBananaConfigured
} from '../services/nanoBanana';

interface AISummaryGeneratorProps {
    text: string;
    type: 'summary' | 'notes';
    onGenerated?: (content: string) => void;
    autoGenerate?: boolean;
}

const AISummaryGenerator: React.FC<AISummaryGeneratorProps> = ({
    text,
    type,
    onGenerated,
    autoGenerate = false
}) => {
    const [style, setStyle] = useState<GenerateSummaryRequest['style']>('concise');
    const [maxLength, setMaxLength] = useState<number>(150);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    React.useEffect(() => {
        if (autoGenerate && text && !generatedContent) {
            handleGenerate();
        }
    }, [autoGenerate, text]);

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError('Nenhum texto fornecido para análise');
            return;
        }

        if (!isNanoBananaConfigured()) {
            setError('API do Google não configurada. Verifique suas variáveis de ambiente.');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            let content: string;

            if (type === 'notes') {
                content = await generateLessonNotes(text);
            } else {
                content = await generateSummary({
                    text,
                    style,
                    maxLength,
                    language: 'Portuguese (Brazil)'
                });
            }

            setGeneratedContent(content);

            if (onGenerated) {
                onGenerated(content);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao gerar conteúdo');
            console.error('Erro na geração:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!generatedContent) return;

        try {
            await navigator.clipboard.writeText(generatedContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    };

    const summaryStyles: Array<{ value: GenerateSummaryRequest['style']; label: string; description: string }> = [
        { value: 'concise', label: 'Conciso', description: '2-3 frases' },
        { value: 'detailed', label: 'Detalhado', description: 'Completo' },
        { value: 'bullet-points', label: 'Tópicos', description: 'Lista' },
        { value: 'academic', label: 'Acadêmico', description: 'Formal' },
    ];

    const lengthOptions = [
        { value: 50, label: 'Curto' },
        { value: 150, label: 'Médio' },
        { value: 300, label: 'Longo' },
    ];

    return (
        <div className="bg-brand-card rounded-xl border border-white/10 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                    {type === 'notes' ? (
                        <BookOpen className="w-5 h-5 text-blue-400" />
                    ) : (
                        <FileText className="w-5 h-5 text-blue-400" />
                    )}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">
                        {type === 'notes' ? 'Gerador de Anotações' : 'Gerador de Resumo'}
                    </h3>
                    <p className="text-xs text-gray-400">
                        Powered by Gemini AI • {text.length} caracteres
                    </p>
                </div>
            </div>

            {/* Configuration (only for summary type) */}
            {type === 'summary' && (
                <>
                    {/* Style Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Estilo do Resumo</label>
                        <div className="grid grid-cols-4 gap-2">
                            {summaryStyles.map((s) => (
                                <button
                                    key={s.value}
                                    onClick={() => setStyle(s.value)}
                                    className={`p-3 rounded-lg border transition-all text-left ${style === s.value
                                            ? 'bg-brand-primary/20 border-brand-primary text-white'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <div className="text-sm font-medium">{s.label}</div>
                                    <div className="text-xs opacity-70">{s.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Length Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                            Tamanho Máximo: {maxLength} palavras
                        </label>
                        <div className="flex gap-2">
                            {lengthOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setMaxLength(option.value)}
                                    className={`flex-1 py-2 px-4 rounded-lg border transition-all ${maxLength === option.value
                                            ? 'bg-brand-primary/20 border-brand-primary text-white'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

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
            {!autoGenerate && (
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !text.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Gerando {type === 'notes' ? 'anotações' : 'resumo'}...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Gerar {type === 'notes' ? 'Anotações' : 'Resumo'}
                        </>
                    )}
                </button>
            )}

            {/* Loading State for Auto Generate */}
            {autoGenerate && isGenerating && (
                <div className="flex items-center justify-center py-8">
                    <Loader className="w-8 h-8 animate-spin text-brand-primary" />
                </div>
            )}

            {/* Generated Content */}
            <AnimatePresence>
                {generatedContent && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-300">
                                {type === 'notes' ? 'Anotações Geradas' : 'Resumo Gerado'}
                            </label>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-400" />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copiar
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <div className="prose prose-invert prose-sm max-w-none">
                                {generatedContent.split('\n').map((line, idx) => {
                                    // Detectar títulos markdown
                                    if (line.startsWith('**') && line.endsWith('**')) {
                                        return (
                                            <h4 key={idx} className="text-white font-bold mt-4 mb-2">
                                                {line.replace(/\*\*/g, '')}
                                            </h4>
                                        );
                                    }
                                    // Detectar listas
                                    if (line.match(/^[\d]+\./)) {
                                        return (
                                            <li key={idx} className="text-gray-300 ml-4">
                                                {line.replace(/^[\d]+\./, '').trim()}
                                            </li>
                                        );
                                    }
                                    if (line.startsWith('-') || line.startsWith('*')) {
                                        return (
                                            <li key={idx} className="text-gray-300 ml-4">
                                                {line.substring(1).trim()}
                                            </li>
                                        );
                                    }
                                    // Parágrafo normal
                                    return line.trim() ? (
                                        <p key={idx} className="text-gray-300 mb-2">
                                            {line}
                                        </p>
                                    ) : null;
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{generatedContent.split(' ').length} palavras</span>
                            <span>Gerado com Gemini AI</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AISummaryGenerator;
