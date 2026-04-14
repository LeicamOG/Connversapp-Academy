
import React, { useState, useEffect, useRef } from 'react';
import {
    Play, CheckCircle, Clock, ArrowLeft, Plus, Edit2,
    Trash, GripVertical, Loader2, Sparkles, LogIn, Image as ImageIcon, Layout as LayoutIcon, Type as TypeIcon,
    Save, RefreshCw, Palette, UserPlus, MoreHorizontal, UserX, Shield, Video, Layers, ChevronDown, ChevronUp, FileVideo, Youtube, Link as LinkIcon, X, Settings, List, Grid, Search, Filter, MonitorPlay, Upload, Camera, ToggleLeft, ToggleRight, User as UserIcon, ChevronRight, Check, FileText, Paperclip, Bold, Italic, ListOrdered, List as ListIcon, Download, MessageSquare, ThumbsUp, CornerDownRight, ShieldAlert, ArrowUp, ArrowDown, ChevronLeft, Heading1, Heading2, Quote, ShieldCheck, Pencil, AlertTriangle, ExternalLink,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, Strikethrough, Underline, Link2, Send, BookOpen, Webhook, Key, Copy, Eye, EyeOff, XCircle, CheckSquare, AlertCircle, Globe, BarChart2, PieChart, Mail, ArrowRight, Users
} from 'lucide-react';
import { Course, Lesson, Module, PageBlock, ThemeConfig, User, UserRole, BlockType, DisplayStyle, AspectRatio, VideoProvider, Attachment, Comment, BlockContent } from '../types';
import { getFirstLesson, DEFAULT_AVATAR } from '../services/data';
import { UserService, LayoutService, SettingsService, AuthService, CourseService, CommentService, ProgressService, WebhookService } from '../services/supabase';
import { safeHtml } from '../services/sanitize';
import { generateSecurePassword } from '../services/secureRandom';
import { CourseSelector } from './CourseSelector';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation,
    DragStartEvent,
    DragOverEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';



// --- Animation Constants ---
const buttonTap = { scale: 0.95 };

// --- Default Author ---
const DEFAULT_AUTHOR = 'Eduardo Maciel';

// --- Mapeamento fixo por título do curso → capas temáticas ---
const COURSE_COVER_MAP: Record<string, { cover: string; banner: string }> = {
    'Configurações Iniciais': {
        cover:  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=90&w=1200',
        banner: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=90&w=2000',
    },
    'Recursos Básicos': {
        cover:  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=90&w=1200',
        banner: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=90&w=2000',
    },
    'Chatbot': {
        cover:  'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&q=90&w=1200',
        banner: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&q=90&w=2000',
    },
    'Sequências': {
        cover:  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=90&w=1200',
        banner: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=90&w=2000',
    },
    'IA de Atendimento': {
        cover:  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&q=90&w=1200',
        banner: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&q=90&w=2000',
    },
};

// --- Cover images — temáticas por módulo (dark, editorial, comunicação) ---
// M1: Configurações Iniciais — smartphone business setup
// M2: Recursos Básicos — mobile messaging features
// M3: Chatbot — automation / bot dark
// M4: Sequências — flow / drip campaign
// M5: IA de Atendimento — artificial intelligence
const COURSE_COVERS = [
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=90&w=1200', // M1 — WhatsApp phone dark
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=90&w=1200', // M2 — smartphone tela escura
  'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&q=90&w=1200', // M3 — chatbot / code dark
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=90&w=1200', // M4 — analytics / sequências
  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&q=90&w=1200', // M5 — AI neural dark
];

const COURSE_BANNERS = [
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=90&w=2000',
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=90&w=2000',
  'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&q=90&w=2000',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=90&w=2000',
  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&q=90&w=2000',
];

// Picks a deterministic image based on a seed string
function pickImage(arr: string[], seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

// Module gradient covers based on index (no external request needed)
const MODULE_GRADIENTS = [
  'linear-gradient(135deg, #0B1A10 0%, #0F2A18 50%, #0B3D20 100%)',
  'linear-gradient(135deg, #0D1117 0%, #0E1F33 50%, #0A2A4A 100%)',
  'linear-gradient(135deg, #140F1A 0%, #1E1030 50%, #2A1040 100%)',
  'linear-gradient(135deg, #1A0F0F 0%, #2A1010 50%, #3D1515 100%)',
  'linear-gradient(135deg, #0F1A14 0%, #1A2E1E 50%, #0F3322 100%)',
];

// --- Helper Functions ---
const convertToEmbedUrl = (url: string, provider: VideoProvider): string => {
    if (!url) return '';

    if (provider === 'youtube') {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
    }

    if (provider === 'vimeo') {
        const regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
        const match = url.match(regExp);
        if (match && match[5]) {
            return `https://player.vimeo.com/video/${match[5]}`;
        }
    }

    // Handle raw iframe or div wrapper paste (like Loom, Wistia)
    if (url.trim().startsWith('<')) {
        // Try to extract src from iframe
        const srcMatch = url.match(/<iframe.*?src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
            return srcMatch[1];
        }
    }

    return url;
};

// --- Reusable Components ---

const ImagePicker: React.FC<{ label: string; value: string; onChange: (val: string) => void; resolutionHint?: string; allowedTabs?: ('upload' | 'link' | 'ai')[] }> = ({ label, value, onChange, resolutionHint, allowedTabs = ['upload'] }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'link' | 'ai'>(allowedTabs.length > 0 ? allowedTabs[0] : 'upload');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { onChange(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handleAIGenerate = async () => {
        if (!aiPrompt.trim()) return;

        setIsGeneratingAI(true);
        try {
            // Importar dinamicamente o serviço de IA
            const { generateImage } = await import('../services/nanoBanana');

            // Determinar o tipo de resolução baseado no hint
            let resolutionType: any = 'COURSE_THUMBNAIL';
            if (resolutionHint?.includes('Avatar') || resolutionHint?.includes('512')) {
                resolutionType = 'PROFILE_AVATAR';
            } else if (resolutionHint?.includes('Banner') || resolutionHint?.includes('1920')) {
                resolutionType = 'LESSON_BANNER';
            } else if (resolutionHint?.includes('Certificado')) {
                resolutionType = 'CERTIFICATE';
            }

            const imageUrl = await generateImage({
                prompt: aiPrompt,
                resolution: resolutionType,
                style: 'professional',
                usePro: false
            });

            // Fetch e converter para Base64 para garantir que a imagem carregue e salvar no banco como dados
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            await new Promise((resolve, reject) => {
                reader.onloadend = resolve;
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            const base64Data = reader.result as string;
            setPreviewUrl(base64Data);

        } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            alert('Não foi possível gerar a imagem. Tente novamente ou verifique se o serviço está disponível.');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    useEffect(() => {
        if (!allowedTabs.includes(activeTab)) {
            setActiveTab(allowedTabs[0] || 'upload');
        }
    }, [allowedTabs, activeTab]);

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500">{label}</label>
                {resolutionHint && (
                    <span className="text-[9px] font-mono text-brand-primary/80 bg-brand-primary/8 border border-brand-primary/20 px-2 py-0.5 rounded-md">
                        {resolutionHint}
                    </span>
                )}
            </div>

            <div className="bg-brand-dark/80 border border-white/8 rounded-xl overflow-hidden">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                {/* Tab bar */}
                {allowedTabs.length > 1 && (
                    <div className="flex border-b border-white/8">
                        {allowedTabs.includes('upload') && (
                            <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2.5 px-2 text-[10px] font-bold font-mono uppercase tracking-wider transition-colors ${activeTab === 'upload' ? 'bg-white/8 text-white border-b border-brand-primary' : 'text-gray-500 hover:text-gray-300 hover:bg-white/4'}`}>
                                <Upload size={10} className="inline mr-1" />Upload
                            </button>
                        )}
                        {allowedTabs.includes('link') && (
                            <button onClick={() => setActiveTab('link')} className={`flex-1 py-2.5 px-2 text-[10px] font-bold font-mono uppercase tracking-wider transition-colors ${activeTab === 'link' ? 'bg-white/8 text-white border-b border-brand-primary' : 'text-gray-500 hover:text-gray-300 hover:bg-white/4'}`}>
                                <LinkIcon size={10} className="inline mr-1" />Link
                            </button>
                        )}
                        {allowedTabs.includes('ai') && (
                            <button onClick={() => setActiveTab('ai')} className={`flex-1 py-2.5 px-2 text-[10px] font-bold font-mono uppercase tracking-wider transition-colors ${activeTab === 'ai' ? 'bg-white/8 text-white border-b border-brand-primary' : 'text-gray-500 hover:text-gray-300 hover:bg-white/4'}`}>
                                <Sparkles size={10} className="inline mr-1" />IA
                            </button>
                        )}
                    </div>
                )}

                <div className="p-3.5 space-y-3">
                    {activeTab === 'link' && (
                        <input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full bg-brand-surface/50 border border-white/8 rounded-xl px-3.5 py-2.5 text-[13px] text-white font-mono focus:outline-none focus:border-brand-primary/40 transition-colors placeholder-gray-700"
                            placeholder="https://..."
                        />
                    )}

                    {activeTab === 'upload' && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/10 hover:border-brand-primary/30 rounded-xl p-5 text-center cursor-pointer hover:bg-brand-primary/3 transition-all group"
                        >
                            <Upload size={20} className="mx-auto text-gray-600 group-hover:text-brand-primary mb-2 transition-colors" />
                            <p className="text-[12px] text-gray-500 group-hover:text-gray-300 transition-colors">Clique para selecionar</p>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-purple-400">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold font-mono uppercase tracking-wider">Gerador com IA</span>
                            </div>
                            {previewUrl ? (
                                <div className="space-y-2">
                                    <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group">
                                        <img key={previewUrl} src={previewUrl} className="w-full h-full object-cover" alt="AI Preview" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-white text-xs underline">Ver Original</a>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPreviewUrl(null)} className="flex-1 py-2 px-3 bg-white/8 text-gray-300 hover:text-white hover:bg-white/15 rounded-xl text-[11px] font-bold transition-colors">
                                            Cancelar
                                        </button>
                                        <button onClick={() => { onChange(previewUrl); setPreviewUrl(null); setAiPrompt(''); }} className="flex-1 py-2 px-3 bg-purple-500/90 text-white hover:bg-purple-500 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5">
                                            <CheckCircle size={12} /> Usar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Descreva a imagem... Ex: Estudantes aprendendo com tecnologia"
                                        className="w-full bg-brand-surface/50 border border-white/8 rounded-xl px-3 py-2.5 text-[12px] text-white focus:border-brand-primary/40 outline-none resize-none transition-colors placeholder-gray-700"
                                        rows={3}
                                    />
                                    <button
                                        onClick={handleAIGenerate}
                                        disabled={isGeneratingAI || !aiPrompt.trim()}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-[11px] flex items-center justify-center gap-2 transition-all"
                                    >
                                        {isGeneratingAI ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Gerando...</> : <><Sparkles className="w-3.5 h-3.5" />Gerar com IA</>}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Image preview — resolution hint only on hover */}
                {value && (
                    <div className="relative group border-t border-white/6 bg-black/40 overflow-hidden">
                        <img src={value} className="w-full object-contain max-h-[220px]" alt="Preview" />
                        <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5">
                            <button
                                onClick={() => allowedTabs.includes('upload') ? fileInputRef.current?.click() : setActiveTab('link')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl text-white text-[12px] font-semibold transition-colors"
                            >
                                <Edit2 size={13} /> Alterar imagem
                            </button>
                            {resolutionHint && (
                                <span className="text-[10px] font-mono text-brand-primary/90 bg-black/50 px-2.5 py-1 rounded-lg border border-brand-primary/20">
                                    {resolutionHint}
                                </span>
                            )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onChange(''); }} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-500/80 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-20">
                            <X size={11} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const VisualSelector: React.FC<{ label: string; value: string; onChange: (val: any) => void; options: { value: string; label: string }[] }> = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{label}</label>
        <div className="flex gap-2 bg-brand-dark p-1 rounded border border-white/20">
            {options.map(opt => (
                <button key={opt.value} onClick={() => onChange(opt.value)} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${value === opt.value ? 'bg-brand-primary text-brand-dark' : 'text-gray-400 hover:text-white'}`}>{opt.label}</button>
            ))}
        </div>
    </div>
);

const RichTextEditor: React.FC<{ value: string, onChange: (val: string) => void }> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const execCmd = (command: string, arg: string = '') => { document.execCommand(command, false, arg); if (editorRef.current) { editorRef.current.focus(); } };
    const preventFocusLoss = (e: React.MouseEvent) => { e.preventDefault(); };
    const handleLink = () => {
        const url = prompt("Digite a URL:");
        if (!url) return;
        // Block javascript: and data: URIs to prevent XSS via link clicks
        const scheme = url.trim().toLowerCase();
        if (scheme.startsWith('javascript:') || scheme.startsWith('data:')) {
            alert('URL inválida. Use http:// ou https://');
            return;
        }
        execCmd('createLink', url);
    };

    // Simple drag & drop for images
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        execCmd('insertImage', event.target.result as string);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };

    // Fix for cursor jumping: Only update innerHTML if focused element is NOT the editor
    useEffect(() => {
        if (editorRef.current && document.activeElement !== editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    return (
        <div className="border border-white/20 rounded-lg overflow-hidden bg-brand-dark flex flex-col h-64">
            <div className="flex flex-wrap items-center gap-1 p-2 bg-white/5 border-b border-white/10 shrink-0">
                <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('undo'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white" title="Desfazer"><Undo size={14} /></button>
                <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('redo'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white" title="Refazer"><Redo size={14} /></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('formatBlock', 'H1'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white" title="Título 1"><Heading1 size={14} /></button>
                <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('formatBlock', 'H2'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white" title="Título 2"><Heading2 size={14} /></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('bold'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white" title="Negrito"><Bold size={14} /></button>
                <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('italic'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white" title="Itálico"><Italic size={14} /></button>
                <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('underline'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white" title="Sublinhado"><Underline size={14} /></button>
                <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('strikeThrough'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white" title="Tachado"><Strikethrough size={14} /></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('insertUnorderedList'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white" title="Lista com Marcadores"><ListIcon size={14} /></button>
                <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('insertOrderedList'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white" title="Lista Numerada"><ListOrdered size={14} /></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button onMouseDown={(e) => { preventFocusLoss(e); handleLink(); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white" title="Link"><LinkIcon size={14} /></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button
                    onMouseDown={async (e) => {
                        preventFocusLoss(e);
                        const currentText = editorRef.current?.innerText || '';
                        let prompt = "";
                        if (!currentText.trim()) {
                            prompt = window.prompt("Sobre o que você quer escrever?") || "";
                            if (!prompt) return;
                        } else {
                            prompt = "Melhore, corrija e formate este texto de forma didática e profissional.";
                        }

                        const btn = e.currentTarget;
                        const originalContent = btn.innerHTML;
                        btn.innerHTML = '<span class="animate-spin">✨</span>';

                        try {
                            const { generateText } = await import('../services/nanoBanana');
                            const newText = await generateText(prompt, currentText);
                            if (newText) {
                                execCmd('insertHTML', newText.replace(/\n/g, '<br>'));
                            }
                        } catch (err) {
                            alert('Erro na IA: Verifique a API Key.');
                            console.error(err);
                        } finally {
                            btn.innerHTML = originalContent;
                        }
                    }}
                    className="p-1.5 hover:bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded text-purple-400 hover:text-purple-300 transition-colors"
                    title="Mágica IA (Gemini)"
                >
                    <Sparkles size={14} />
                </button>
            </div>
            <div
                ref={editorRef}
                className="flex-1 p-4 text-white focus:outline-none prose prose-invert max-w-none text-sm overflow-y-auto"
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                onDrop={handleDrop}
            ></div>
        </div>
    );
};

const AttachmentUploader: React.FC<{ attachments: Attachment[], onChange: (files: Attachment[]) => void }> = ({ attachments, onChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const newAttachments: Attachment[] = Array.from(files).map(file => ({ id: `att-${Date.now()}-${Math.random()}`, name: file.name, type: file.type, size: (file.size / 1024 / 1024).toFixed(2) + ' MB', url: URL.createObjectURL(file) }));
        onChange([...attachments, ...newAttachments]);
    };

    const updateName = (id: string, newName: string) => {
        onChange(attachments.map(a => a.id === id ? { ...a, name: newName } : a));
    };

    const remove = (id: string) => {
        onChange(attachments.filter(a => a.id !== id));
    };

    return (
        <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-400 uppercase">Materiais Complementares</label>

            <div className="space-y-2 mb-3">
                {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-2 bg-brand-dark p-2 rounded border border-white/10">
                        <Paperclip size={16} className="text-gray-400" />
                        <input
                            value={att.name}
                            onChange={(e) => updateName(att.id, e.target.value)}
                            className="flex-1 bg-transparent text-sm text-white focus:outline-none border-b border-transparent focus:border-brand-primary"
                            placeholder="Nome do arquivo"
                        />
                        <span className="text-xs text-gray-500">{att.size}</span>
                        <button onClick={() => { if (window.confirm('Tem certeza que deseja excluir este anexo?')) remove(att.id); }} className="text-gray-500 hover:text-red-400 p-1"><X size={14} /></button>
                    </div>
                ))}
            </div>

            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
                <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                <Paperclip className="mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Clique ou arraste arquivos para anexar</p>
            </div>
        </div>
    );
};

const LessonEditorModal: React.FC<{ isOpen: boolean, lesson: Lesson, isNew: boolean, onClose: () => void, onSave: (l: Lesson) => void }> = ({ isOpen, lesson, isNew, onClose, onSave }) => {
    const [formData, setFormData] = useState<Lesson>(lesson);
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setFormData(lesson);
            // If it's new, go to step 1 (selection), otherwise step 2 (edit)
            setStep(isNew ? 1 : 2);
        }
    }, [isOpen, lesson, isNew]);

    if (!isOpen) return null;

    const handleTypeSelect = (type: 'video' | 'text') => {
        setFormData({ ...formData, type });
        setStep(2);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-brand-card w-full max-w-4xl rounded-xl shadow-2xl border border-white/20 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-white/20">
                    <h3 className="text-xl font-bold text-white">
                        {step === 1 ? 'Escolha o Tipo de Aula' : (isNew ? 'Nova Aula' : 'Editar Aula')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                {step === 1 ? (
                    <div className="p-12 grid grid-cols-2 gap-8">
                        <button onClick={() => handleTypeSelect('video')} className="bg-brand-dark hover:bg-white/5 border border-white/10 hover:border-brand-primary p-8 rounded-xl flex flex-col items-center gap-4 transition-all group">
                            <div className="p-4 bg-blue-500/20 rounded-full text-blue-400 group-hover:scale-110 transition-transform"><Video size={48} /></div>
                            <h3 className="text-xl font-bold text-white">Vídeo Aula</h3>
                            <p className="text-gray-400 text-center text-sm">Aula baseada em vídeo (YouTube, Vimeo ou Embed) com descrição e materiais de apoio.</p>
                        </button>
                        <button onClick={() => handleTypeSelect('text')} className="bg-brand-dark hover:bg-white/5 border border-white/10 hover:border-brand-primary p-8 rounded-xl flex flex-col items-center gap-4 transition-all group">
                            <div className="p-4 bg-green-500/20 rounded-full text-green-400 group-hover:scale-110 transition-transform"><FileText size={48} /></div>
                            <h3 className="text-xl font-bold text-white">Texto / Artigo</h3>
                            <p className="text-gray-400 text-center text-sm">Conteúdo rico em texto, com imagens, formatação e materiais complementares.</p>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded px-4 py-3 text-white text-lg font-bold" placeholder="Título da Aula" />

                            {formData.type === 'video' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <VisualSelector
                                            label="Provedor de Vídeo"
                                            value={formData.provider || 'youtube'}
                                            onChange={val => setFormData({ ...formData, provider: val })}
                                            options={[{ value: 'youtube', label: 'YouTube' }, { value: 'vimeo', label: 'Vimeo' }, { value: 'embed_url', label: 'Embed/Iframe' }]}
                                        />
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">URL ou Código Embed</label>
                                            <input value={formData.videoUrl || ''} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} className="w-full bg-black border border-white/10 rounded px-4 py-3 text-white font-mono text-sm focus:border-brand-primary outline-none" placeholder="https://..." />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descrição da Aula</label>
                                        <RichTextEditor value={formData.description || ''} onChange={val => setFormData({ ...formData, description: val })} />
                                    </div>
                                </div>
                            )}

                            {formData.type === 'text' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Conteúdo do Artigo</label>
                                    <RichTextEditor value={formData.textContent || ''} onChange={val => setFormData({ ...formData, textContent: val })} />
                                </div>
                            )}

                            <AttachmentUploader attachments={formData.attachments || []} onChange={files => setFormData({ ...formData, attachments: files })} />
                        </div>
                        <div className="p-6 border-t border-white/20 flex justify-end gap-3">
                            {isNew && <button onClick={() => setStep(1)} className="px-6 py-2 text-gray-400 font-bold text-sm hover:text-white mr-auto">Voltar</button>}
                            <button onClick={onClose} className="px-6 py-2 text-gray-400 font-bold text-sm">Cancelar</button>
                            <button onClick={() => { onSave(formData); onClose(); }} className="px-6 py-2 bg-brand-primary text-brand-dark font-bold text-sm rounded">Salvar</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

function SortableModuleItem({ module, mIdx, onUpdateModule, onDeleteModule, lessons, onAddLesson, onEditLesson, onDeleteLesson }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        boxShadow: isDragging ? '0 24px 48px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,211,102,0.35)' : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className="module-card mb-4">
            <div className="module-card-header">
                <div className="drag-handle-premium" {...attributes} {...listeners}>
                    <GripVertical size={16} />
                </div>
                <div className="module-number">{String(mIdx + 1).padStart(2, '0')}</div>
                <input
                    value={module.title}
                    onChange={(e) => onUpdateModule(e.target.value)}
                    className="flex-1 bg-transparent text-white font-bold text-[15px] tracking-tight focus:outline-none placeholder:text-gray-600 min-w-0"
                    placeholder="Nome do módulo"
                />
                <div className="hidden md:flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-gray-500 shrink-0">
                    {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}
                </div>
                <button
                    onClick={() => onDeleteModule(module.id)}
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Excluir módulo"
                >
                    <Trash size={15} />
                </button>
            </div>
            <div className="p-3 space-y-1.5">
                <SortableContext items={lessons.map((l: any) => l.id)} strategy={verticalListSortingStrategy}>
                    {lessons.length === 0 && (
                        <div className="text-center py-6 text-xs text-gray-500 italic">Nenhuma aula ainda. Adicione a primeira abaixo.</div>
                    )}
                    {lessons.map((lesson: any, lIdx: number) => (
                        <SortableLessonItem
                            key={lesson.id}
                            lesson={lesson}
                            lIdx={lIdx}
                            onEdit={() => onEditLesson(lesson)}
                            onDelete={() => onDeleteLesson(mIdx, lesson.id)}
                        />
                    ))}
                </SortableContext>
                <button
                    onClick={() => onAddLesson(mIdx)}
                    className="w-full py-3 mt-2 border border-dashed border-white/10 hover:border-brand-primary/50 hover:bg-brand-primary/5 rounded-xl text-xs text-gray-400 hover:text-brand-primary font-mono uppercase tracking-wider flex justify-center items-center gap-2 transition-all"
                >
                    <Plus size={14} /> Adicionar aula
                </button>
            </div>
        </div>
    );
}

function SortableLessonItem({ lesson, lIdx, onEdit, onDelete }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        boxShadow: isDragging ? '0 12px 32px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,211,102,0.35)' : undefined,
    };
    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group flex items-center gap-3 px-3 py-2.5 bg-brand-card-raised/60 hover:bg-brand-card-raised rounded-xl border border-white/5 hover:border-white/10 transition-all"
        >
            <div className="drag-handle-premium !w-7 !h-7" {...attributes} {...listeners}>
                <GripVertical size={14} />
            </div>
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-gray-500 shrink-0">
                {String((lIdx ?? 0) + 1).padStart(2, '0')}
            </div>
            <div className="w-7 h-7 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                {lesson.type === 'video' ? <Play size={12} /> : <FileText size={12} />}
            </div>
            <div className="flex-1 text-[13px] text-gray-100 font-medium truncate">{lesson.title}</div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                    title="Editar"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Excluir"
                >
                    <Trash size={14} />
                </button>
            </div>
        </div>
    );
}

const ConfirmDialog: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-brand-card w-full max-w-md rounded-xl shadow-2xl border border-white/20 p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 text-red-500 mb-4">
                    <AlertTriangle size={24} />
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white font-bold text-sm">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded font-bold text-sm hover:bg-red-600 transition-colors">Confirmar Exclusão</button>
                </div>
            </div>
        </div>
    );
};

const CourseContentEditor: React.FC<{ course: Course, isSaving?: boolean, onBack: () => void, onSave: (c: Course) => void }> = ({ course, isSaving, onBack, onSave }) => {
    const [formData, setFormData] = useState<Course>(course);
    const [editingLesson, setEditingLesson] = useState<{ lesson: Lesson, moduleIndex: number } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Sync state with props immediately when parent updates
    useEffect(() => {
        setFormData(course);
    }, [course]);

    // Auto-save logic
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            if (JSON.stringify(formData) !== JSON.stringify(course)) {
                onSave(formData);
            }
        }, 2500); // 2.5s debounce for course content as it's deeper

        return () => clearTimeout(timeoutId);
    }, [formData]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setFormData(prev => {
            // Try moving Module
            const oldModIndex = prev.modules.findIndex(m => m.id === active.id);
            const newModIndex = prev.modules.findIndex(m => m.id === over.id);

            if (oldModIndex !== -1 && newModIndex !== -1) {
                return { ...prev, modules: arrayMove(prev.modules, oldModIndex, newModIndex) };
            }

            // Try moving Lesson within same module
            let activeModIdx = -1, activeLessonIdx = -1;
            let overModIdx = -1, overLessonIdx = -1;

            prev.modules.forEach((m, mIdx) => {
                const lIdx = m.lessons.findIndex(l => l.id === active.id);
                if (lIdx !== -1) { activeModIdx = mIdx; activeLessonIdx = lIdx; }

                const oIdx = m.lessons.findIndex(l => l.id === over.id);
                if (oIdx !== -1) { overModIdx = mIdx; overLessonIdx = oIdx; }
            });

            if (activeModIdx !== -1 && activeModIdx === overModIdx) {
                const newModules = [...prev.modules];
                const newLessons = arrayMove(newModules[activeModIdx].lessons, activeLessonIdx, overLessonIdx);
                newModules[activeModIdx] = { ...newModules[activeModIdx], lessons: newLessons };
                return { ...prev, modules: newModules };
            }

            return prev;
        });
    };

    const addModule = () => setFormData({ ...formData, modules: [...formData.modules, { id: `mod-${Date.now()}`, title: 'Novo Módulo', lessons: [] }] });
    const deleteModule = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Excluir Módulo?',
            message: 'Tem certeza que deseja excluir este módulo e todas as suas aulas? Esta ação não pode ser desfeita e será salva automaticamente.',
            onConfirm: async () => {
                const updatedCourse = { ...formData, modules: formData.modules.filter(m => m.id !== id) };
                setFormData(updatedCourse);
                await onSave(updatedCourse);
                setConfirmModal(null);
            }
        });
    };
    const updateModule = (id: string, newTitle: string) => setFormData({ ...formData, modules: formData.modules.map(m => m.id === id ? { ...m, title: newTitle } : m) });

    const addLesson = (idx: number) => setEditingLesson({ lesson: { id: `less-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, title: 'Nova Aula', description: '', duration: 0, type: 'video', thumbnail: '', attachments: [], isCompleted: false, progress: 0 }, moduleIndex: idx });

    const deleteLesson = (moduleIndex: number, lessonId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Excluir Aula?',
            message: 'Tem certeza que deseja excluir esta aula? Esta ação será salva automaticamente.',
            onConfirm: async () => {
                const newModules = formData.modules.map(m => ({
                    ...m,
                    lessons: m.lessons.filter(l => l.id !== lessonId)
                }));
                const updatedCourse = { ...formData, modules: newModules };
                setFormData(updatedCourse);
                await onSave(updatedCourse);
                setConfirmModal(null);
            }
        });
    };

    const saveLesson = (updatedLesson: Lesson) => {
        if (!editingLesson) return;
        const newModules = [...formData.modules];
        const mIdx = editingLesson.moduleIndex;
        const lIdx = newModules[mIdx].lessons.findIndex(l => l.id === updatedLesson.id);
        if (lIdx >= 0) newModules[mIdx].lessons[lIdx] = updatedLesson;
        else newModules[mIdx].lessons.push(updatedLesson);
        setFormData({ ...formData, modules: newModules });
        setEditingLesson(null);
    };

    const totalLessons = formData.modules.reduce((acc, m) => acc + m.lessons.length, 0);

    return (
        <div className="min-h-screen pb-24">
            {confirmModal && <ConfirmDialog {...confirmModal} onCancel={() => setConfirmModal(null)} />}
            <div className="header-premium border-b border-white/5 px-6 lg:px-10 h-16 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-4 min-w-0">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-3 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-primary/30 text-gray-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
                    >
                        <ArrowLeft size={14} /> Voltar
                    </button>
                    <div className="min-w-0">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-brand-primary leading-none">Editando curso</div>
                        <h2 className="text-[15px] font-bold text-white truncate leading-tight mt-0.5">{formData.title || 'Sem título'}</h2>
                    </div>
                </div>
                <button
                    disabled={isSaving}
                    onClick={() => onSave(formData)}
                    className="btn-primary-premium disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={15} /> Salvar
                        </>
                    )}
                </button>
            </div>

            <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8">
                {/* Identity panel */}
                <div className="panel-premium p-6 lg:p-8 space-y-6">
                    <div className="eyebrow">Identidade do curso</div>
                    <input
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-transparent border-0 border-b border-white/10 focus:border-brand-primary/60 focus:outline-none px-0 py-3 text-white text-2xl md:text-3xl font-bold tracking-tight placeholder:text-gray-600 transition-colors"
                        placeholder="Nome do curso..."
                    />

                    {/* Author field */}
                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-primary mb-2">Autor / Criador</label>
                        <input
                            value={formData.author || DEFAULT_AUTHOR}
                            onChange={e => setFormData({ ...formData, author: e.target.value })}
                            className="w-full bg-brand-surface/50 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:border-brand-primary/60 focus:outline-none transition-colors"
                            placeholder={DEFAULT_AUTHOR}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ImagePicker label="Imagem de Capa" value={formData.coverImage || pickImage(COURSE_COVERS, formData.id)} onChange={val => setFormData({ ...formData, coverImage: val })} resolutionHint="800×800px · quadrada 1:1 · min 500px" allowedTabs={['upload', 'link', 'ai']} />
                        <ImagePicker label="Banner do Curso" value={formData.bannerImage || pickImage(COURSE_BANNERS, formData.id + 'b')} onChange={val => setFormData({ ...formData, bannerImage: val })} resolutionHint="1920×1080px · proporção 16:9 · min 1280px" allowedTabs={['upload', 'link', 'ai']} />
                    </div>

                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-primary mb-3">Descrição do curso</label>
                        <RichTextEditor value={formData.description} onChange={val => setFormData({ ...formData, description: val })} />
                    </div>
                </div>

                {/* Structure panel */}
                <div className="panel-premium p-6 lg:p-8">
                    <div className="flex items-end justify-between gap-4 mb-6 pb-5 border-b border-white/5">
                        <div>
                            <div className="eyebrow mb-2">Currículo</div>
                            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                <Layers size={18} className="text-brand-primary" /> Estrutura do curso
                            </h3>
                        </div>
                        <div className="eyebrow-muted hidden md:block">{formData.modules.length} módulos · {totalLessons} aulas</div>
                    </div>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={formData.modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                            {formData.modules.map((module, idx) => (
                                <SortableModuleItem
                                    key={module.id}
                                    module={module}
                                    mIdx={idx}
                                    lessons={module.lessons}
                                    onUpdateModule={(title: string) => updateModule(module.id, title)}
                                    onDeleteModule={deleteModule}
                                    onAddLesson={() => addLesson(idx)}
                                    onEditLesson={(l: Lesson) => setEditingLesson({ lesson: l, moduleIndex: idx })}
                                    onDeleteLesson={(mIdx: number, lId: string) => deleteLesson(mIdx, lId)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    <button
                        onClick={addModule}
                        className="w-full py-5 border-2 border-dashed border-white/10 rounded-2xl text-gray-400 hover:text-brand-primary hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all flex flex-col items-center gap-2 mt-4"
                    >
                        <Plus size={22} />
                        <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Adicionar novo módulo</span>
                    </button>
                </div>
            </div>
            {editingLesson && <LessonEditorModal isOpen={true} lesson={editingLesson.lesson} isNew={!formData.modules[editingLesson.moduleIndex].lessons.find(l => l.id === editingLesson.lesson.id)} onClose={() => setEditingLesson(null)} onSave={saveLesson} />}
        </div>
    );
};

function hqImage(url: string, width = 1400): string {
    if (!url) return url;
    try {
        const u = new URL(url);
        if (u.hostname.includes('unsplash.com')) {
            u.searchParams.set('auto', 'format,compress');
            u.searchParams.set('fit', 'crop');
            u.searchParams.set('q', '90');
            u.searchParams.set('w', String(width));
            u.searchParams.set('dpr', '2');
            return u.toString();
        }
    } catch { /* not a valid URL */ }
    return url;
}

const PremiumCourseCard: React.FC<{ course: Course, onClick: () => void, index?: number }> = ({ course, onClick, index = 0 }) => {
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const progress = course.progress || 0;
    const cover = hqImage(course.coverImage || pickImage(COURSE_COVERS, course.id + course.title));
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClick}
            className="course-card-premium"
        >
            <div className="cover">
                <img src={cover} alt={course.title} loading="lazy" decoding="async" />
                <div className="cover-badge">{course.modules.length} módulos</div>
            </div>
            <div className="body">
                <h3>{course.title}</h3>
                <div className="meta">
                    <span>{totalLessons} aulas</span>
                    <span className="meta-dot" />
                    <span>{course.author || DEFAULT_AUTHOR}</span>
                </div>
                {progress > 0 && (
                    <div className="progress">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-primary">{progress}% concluído</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export const HomeView: React.FC<{ courses: Course[], onCourseClick: (id: string) => void, searchQuery: string }> = ({ courses, onCourseClick, searchQuery }) => {
    const [blocks, setBlocks] = useState<PageBlock[]>([]);
    useEffect(() => { LayoutService.getBlocks().then(setBlocks); }, []);
    const q = searchQuery.trim().toLowerCase();
    const filteredCourses = q ? courses.filter((c: Course) =>
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.author || '').toLowerCase().includes(q)
    ) : courses;
    const totalLessons = courses.reduce((acc, c) => acc + c.modules.reduce((a, m) => a + m.lessons.length, 0), 0);

    // When searching, always show search results regardless of blocks
    if (q) {
        return (
            <div className="pb-24 px-4 lg:px-8 max-w-7xl mx-auto pt-8">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="section-heading mb-6">
                        <div>
                            <div className="eyebrow mb-2">Busca</div>
                            <h2 className="tracking-tight">Resultados para <span className="text-brand-primary">"{searchQuery}"</span></h2>
                        </div>
                        <div className="eyebrow-muted">{filteredCourses.length} {filteredCourses.length === 1 ? 'resultado' : 'resultados'}</div>
                    </div>
                    {filteredCourses.length === 0 ? (
                        <div className="panel-premium p-14 flex flex-col items-center text-center gap-3">
                            <Search className="w-10 h-10 text-gray-700" />
                            <p className="text-gray-300 font-semibold">Nenhum resultado encontrado</p>
                            <p className="text-gray-600 text-sm">Tente buscar por outro termo ou verifique a ortografia.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredCourses.map((course, i) => (
                                <PremiumCourseCard key={course.id} course={course} index={i} onClick={() => onCourseClick(course.id)} />
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="pb-24">
            {blocks.length === 0 && (
                <div className="px-4 lg:px-8 max-w-7xl mx-auto pt-8">
                    {/* Premium hero strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="hero-premium mb-10"
                    >
                        <div className="eyebrow mb-4">Área de Membros Premium</div>
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 max-w-3xl leading-[1.1]">
                            <span className="text-white">Domine o </span>
                            <span className="text-gradient-premium">WhatsApp Business</span>
                            <span className="text-white"> como um especialista.</span>
                        </h1>
                        <p className="text-gray-300 text-base md:text-lg max-w-2xl mb-6 leading-relaxed">
                            Acesso exclusivo aos cursos, automações e playbooks do ecossistema Conversapp. Conteúdo liberado para acelerar suas conversões.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <div className="stat-chip">
                                <div className="dot" />
                                <span className="font-mono uppercase tracking-wider">{courses.length} cursos ativos</span>
                            </div>
                            <div className="stat-chip">
                                <div className="dot" />
                                <span className="font-mono uppercase tracking-wider">{totalLessons} aulas</span>
                            </div>
                            <div className="stat-chip">
                                <div className="dot" />
                                <span className="font-mono uppercase tracking-wider">Acesso vitalício</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Course grid */}
                    <div className="section-heading">
                        <div>
                            <div className="eyebrow mb-2">Biblioteca</div>
                            <h2 className="tracking-tight">Cursos disponíveis para você</h2>
                        </div>
                        <div className="eyebrow-muted hidden md:block">{filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'}</div>
                    </div>
                    {filteredCourses.length === 0 ? (
                        <div className="panel-premium p-12 text-center">
                            <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">Nenhum curso encontrado {searchQuery && `para "${searchQuery}"`}.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredCourses.map((course, i) => (
                                <PremiumCourseCard key={course.id} course={course} index={i} onClick={() => onCourseClick(course.id)} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {blocks.map(block => (
                <div key={block.id}>
                    {block.type === 'hero_banner' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative h-[480px] w-full flex items-center justify-center overflow-hidden mb-10 group"
                        >
                            <img src={block.content.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                            <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/40 via-brand-dark/60 to-brand-dark" />
                            <div className="absolute inset-0 bg-gradient-hero" />
                            <div className="relative z-10 text-center max-w-4xl px-4">
                                <div className="eyebrow justify-center mb-4 mx-auto" style={{ display: 'inline-flex' }}>Em destaque</div>
                                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight leading-[1.05] drop-shadow-lg">{block.content.title}</h1>
                                <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">{block.content.description}</p>
                                {block.content.showCta && (
                                    <button className="btn-primary-premium text-base">
                                        {block.content.ctaText} <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {block.type === 'content_list' && (() => {
                        const blockCourses = block.content.sourceType === 'specific_courses' && block.content.selectedIds?.length
                            ? (block.content.selectedIds as string[]).map((id: string) => courses.find(c => c.id === id)).filter(Boolean) as Course[]
                            : filteredCourses;
                        return (
                            <div className="px-4 lg:px-8 max-w-7xl mx-auto mb-14">
                                <div className="section-heading">
                                    <div>
                                        <div className="eyebrow mb-2">Coleção</div>
                                        <h2 className="tracking-tight">{block.content.title}</h2>
                                    </div>
                                </div>
                                <div className={block.content.displayStyle === 'grid' ? 'grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'flex gap-5 overflow-x-auto pb-4 snap-x scrollbar-subtle'}>
                                    {blockCourses.map((course, i) => (
                                        <div key={course.id} className={block.content.displayStyle === 'grid' ? '' : 'min-w-[300px] snap-start'}>
                                            <PremiumCourseCard course={course} index={i} onClick={() => onCourseClick(course.id)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            ))}
        </div>
    );
};

export const CourseDetailView: React.FC<{ course: Course, onBack: () => void, onLessonSelect: (id: string) => void }> = ({ course, onBack, onLessonSelect }) => {
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const totalDuration = course.modules.reduce((acc, m) => acc + m.lessons.reduce((a, l) => a + (l.duration || 0), 0), 0);
    const coverImage = course.coverImage || pickImage(COURSE_COVERS, course.id + course.title);
    const bannerImage = course.bannerImage || pickImage(COURSE_BANNERS, course.id + course.title);
    const author = course.author || DEFAULT_AUTHOR;

    return (
        <div className="pb-24">
            {/* Editorial hero */}
            <div className="relative h-[360px] md:h-[440px] w-full overflow-hidden">
                <img src={bannerImage} className="w-full h-full object-cover scale-105" />
                <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/40 via-brand-dark/70 to-brand-dark" />
                <div className="absolute inset-0 bg-gradient-hero" />

                <button
                    onClick={onBack}
                    className="absolute top-5 left-5 lg:left-8 flex items-center gap-2 px-3.5 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-sm font-semibold hover:bg-black/70 hover:border-brand-primary/40 transition-colors"
                >
                    <ArrowLeft size={15} /> Voltar
                </button>
            </div>

            {/* Overlapping content card */}
            <div className="max-w-6xl mx-auto px-4 lg:px-8 -mt-32 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="panel-premium-raised p-6 md:p-8 flex flex-col md:flex-row items-start gap-6 md:gap-8"
                >
                    <div className="shrink-0 relative">
                        <div className="absolute -inset-2 bg-gradient-premium opacity-40 blur-xl rounded-2xl" />
                        <img
                            src={coverImage}
                            alt={course.title}
                            className="relative w-32 h-32 md:w-40 md:h-40 object-cover rounded-2xl border border-white/10 shadow-premium-lg"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="eyebrow mb-3">Curso Conversapp</div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3 leading-tight">{course.title}</h1>
                        <div {...safeHtml(course.description)} className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 mb-5" />
                        <div className="flex flex-wrap gap-2">
                            <div className="stat-chip"><Layers className="w-3.5 h-3.5 text-brand-primary" /><span className="font-mono uppercase tracking-wider">{course.modules.length} módulos</span></div>
                            <div className="stat-chip"><Play className="w-3.5 h-3.5 text-brand-primary" /><span className="font-mono uppercase tracking-wider">{totalLessons} aulas</span></div>
                            {totalDuration > 0 && (
                                <div className="stat-chip"><Clock className="w-3.5 h-3.5 text-brand-primary" /><span className="font-mono uppercase tracking-wider">{Math.round(totalDuration / 60)}h totais</span></div>
                            )}
                            <div className="stat-chip"><UserIcon className="w-3.5 h-3.5 text-brand-primary" /><span className="font-mono uppercase tracking-wider">{author}</span></div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Modules list */}
            <div className="max-w-5xl mx-auto px-4 lg:px-8 mt-12">
                <div className="section-heading">
                    <div>
                        <div className="eyebrow mb-2">Conteúdo</div>
                        <h2 className="tracking-tight">Estrutura do curso</h2>
                    </div>
                    <div className="eyebrow-muted hidden md:block">{course.modules.length} módulos · {totalLessons} aulas</div>
                </div>

                <div className="space-y-4">
                    {course.modules.map((module, idx) => (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.04 }}
                            className="module-card"
                        >
                            <div className="module-card-header" style={{ background: MODULE_GRADIENTS[idx % MODULE_GRADIENTS.length] }}>
                                <div className="module-number">{String(idx + 1).padStart(2, '0')}</div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-[15px] tracking-tight">{module.title}</h3>
                                    <p className="text-[11px] font-mono uppercase tracking-wider text-brand-primary/70 mt-0.5">{module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'} · por {DEFAULT_AUTHOR}</p>
                                </div>
                            </div>
                            <div className="p-2.5 space-y-1">
                                {module.lessons.length === 0 && (
                                    <div className="text-xs text-gray-500 italic px-4 py-3">Nenhuma aula neste módulo ainda.</div>
                                )}
                                {module.lessons.map((lesson, lIdx) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => onLessonSelect(lesson.id)}
                                        className="lesson-row"
                                    >
                                        <div className="lesson-icon-wrap">
                                            {lesson.type === 'video' ? <Play size={14} /> : <FileText size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[14px] text-gray-200 font-medium leading-tight">{lesson.title}</div>
                                            <div className="text-[11px] font-mono uppercase tracking-wider text-gray-500 mt-0.5">
                                                Aula {String(lIdx + 1).padStart(2, '0')}{lesson.duration ? ` · ${lesson.duration} min` : ''}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-primary shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CommentsSection: React.FC<{ lessonId: string, user: User | null }> = ({ lessonId, user }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchComments = async () => {
        if (!user) return;
        const data = await CommentService.getComments(lessonId, user.role, user.id);
        setComments(data);
    };

    useEffect(() => {
        fetchComments();
    }, [lessonId, user]);

    const handleSubmit = async () => {
        if (!user || !newComment.trim()) return;
        setLoading(true);
        const comment = {
            id: `cmt-${Date.now()}`,
            lessonId,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            text: newComment,
            timestamp: new Date().toISOString(),
            status: user.role === UserRole.ADMIN ? 'approved' : 'pending',
            likes: 0,
            likedBy: []
        };
        await CommentService.addComment(comment);
        setNewComment('');
        await fetchComments();
        setLoading(false);
    };

    const handleStatusUpdate = async (commentId: string, status: 'approved' | 'rejected') => {
        await CommentService.updateStatus(commentId, lessonId, status);
        await fetchComments();
    };

    if (!user) return <div className="p-4 text-center text-gray-500">Faça login para ver os comentários.</div>;

    return (
        <div className="mt-12 pt-8 border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><MessageSquare size={20} /> Comentários ({comments.length})</h3>

            <div className="flex gap-4 mb-8">
                <img src={user.avatar} className="w-10 h-10 rounded-full border border-white/10" />
                <div className="flex-1">
                    <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        className="w-full bg-brand-dark border border-white/10 rounded-lg p-3 text-white focus:border-brand-primary outline-none min-h-[80px]"
                        placeholder="Deixe seu comentário ou dúvida..."
                    />
                    <div className="flex justify-end mt-2">
                        <button onClick={handleSubmit} disabled={loading || !newComment.trim()} className="bg-brand-primary text-brand-dark px-4 py-2 rounded font-bold text-sm flex items-center gap-2 hover:brightness-110 disabled:opacity-50">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Enviar
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {comments.length === 0 && <p className="text-gray-500 text-center py-4">Seja o primeiro a comentar!</p>}
                {comments.map(comment => (
                    <div key={comment.id} className={`flex gap-4 p-4 rounded-xl ${comment.status === 'pending' ? 'bg-yellow-500/5 border border-yellow-500/20' : 'bg-white/5'}`}>
                        <img src={comment.userAvatar} className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-white text-sm">{comment.userName} {comment.userId === user.id && <span className="text-xs text-brand-primary ml-2">(Você)</span>}</h4>
                                    <span className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleDateString()}</span>
                                </div>
                                {(user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) && comment.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleStatusUpdate(comment.id, 'approved')} className="p-1 px-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded text-xs font-bold">Aprovar</button>
                                        <button onClick={() => handleStatusUpdate(comment.id, 'rejected')} className="p-1 px-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded text-xs font-bold">Rejeitar</button>
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-300 text-sm mt-2 whitespace-pre-wrap">{comment.text}</p>
                            {comment.status === 'pending' && <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1"><Clock size={12} /> Aguardando aprovação</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PlayerView: React.FC<{ course: Course, lessonId: string, onBack: () => void, onLessonChange: (id: string) => void, user: User | null }> = ({ course, lessonId, onBack, onLessonChange, user }) => {
    const [isCompleted, setIsCompleted] = useState(false);

    // Find current lesson and module
    let currentLesson: Lesson | undefined;
    let currentModuleIdx = -1;
    let currentLessonIdx = -1;
    let nextLessonId: string | null = null;
    let prevLessonId: string | null = null;

    // Flatten logic for navigation
    const flatLessons: { id: string, title: string, moduleTitle: string }[] = [];
    course.modules.forEach(m => m.lessons.forEach(l => flatLessons.push({ id: l.id, title: l.title, moduleTitle: m.title })));

    const currentIndex = flatLessons.findIndex(l => l.id === lessonId);
    if (currentIndex >= 0) {
        if (currentIndex > 0) prevLessonId = flatLessons[currentIndex - 1].id;
        if (currentIndex < flatLessons.length - 1) nextLessonId = flatLessons[currentIndex + 1].id;
    }

    for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
        const m = course.modules[mIdx];
        const lIdx = m.lessons.findIndex(l => l.id === lessonId);
        if (lIdx >= 0) {
            currentLesson = m.lessons[lIdx];
            currentModuleIdx = mIdx;
            currentLessonIdx = lIdx;
            break;
        }
    }

    useEffect(() => {
        // Reset immediately so the previous lesson's state doesn't bleed into
        // the new one while we read from storage.
        setIsCompleted(false);
        if (user && user.id && lessonId) {
            const progress = ProgressService.getProgress(user.id);
            setIsCompleted(!!progress[lessonId]);
        }
        // Scroll the player back to the top whenever the lesson changes.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [lessonId, user]);

    if (!currentLesson) return <div className="p-8 text-white">Aula não encontrada</div>;

    const embedUrl = convertToEmbedUrl(currentLesson.videoUrl || '', currentLesson.provider || 'embed_url');

    const toggleComplete = () => {
        if (!user) return;
        const newState = !isCompleted;
        setIsCompleted(newState);
        ProgressService.saveProgress(user.id, lessonId, newState);
        if (newState && nextLessonId) {
            // Optional: Auto-advance could be here, but let's just mark it.
        }
    };

    return (
        <div onContextMenu={(e) => e.preventDefault()} className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex-1 bg-black flex flex-col overflow-y-auto custom-scrollbar">
                {currentLesson.type === 'video' ? (
                    <>
                        <div className="w-full bg-black aspect-video max-h-[75vh] flex items-center justify-center relative shadow-2xl">
                            {embedUrl ? (
                                <iframe src={embedUrl} className="w-full h-full" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen></iframe>
                            ) : (
                                <div className="text-gray-500 flex flex-col items-center"><FileVideo size={48} /><span className="mt-2">Sem vídeo configurado</span></div>
                            )}
                        </div>
                        <div className="p-6 lg:p-10 max-w-6xl mx-auto w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{currentLesson.title}</h1>
                                    <p className="text-gray-400 text-sm">Módulo: {course.modules[currentModuleIdx].title}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={toggleComplete} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                                        {isCompleted ? <CheckCircle size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>}
                                        {isCompleted ? 'Aula Concluída' : 'Marcar como Concluída'}
                                    </button>
                                </div>
                            </div>

                            <div {...safeHtml(currentLesson.description)} className="prose prose-invert prose-lg text-gray-300 mb-8 max-w-none"></div>

                            {/* Attachments */}
                            {currentLesson.attachments && currentLesson.attachments.length > 0 && (
                                <div className="bg-brand-dark border border-white/10 rounded-xl p-6 mb-8">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Paperclip size={18} /> Materiais Complementares</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentLesson.attachments.map(att => (
                                            <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group">
                                                <div className="p-2 bg-brand-primary/10 text-brand-primary rounded group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors"><FileText size={20} /></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-white truncate">{att.name}</div>
                                                    <div className="text-xs text-gray-500 uppercase">{att.type} • {att.size || 'Download'}</div>
                                                </div>
                                                <Download size={16} className="text-gray-500 group-hover:text-white" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between items-center py-6 border-t border-white/10">
                                {prevLessonId ? (
                                    <button onClick={() => onLessonChange(prevLessonId!)} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group text-left">
                                        <div className="p-3 rounded-full bg-white/5 group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors shrink-0"><ChevronLeft size={20} /></div>
                                        <div className="hidden md:block">
                                            <div className="text-xs text-gray-500 uppercase mb-1">Anterior</div>
                                            <div className="font-bold text-sm leading-tight text-white max-w-[200px] lg:max-w-[300px] line-clamp-2">{flatLessons[currentIndex - 1].title}</div>
                                        </div>
                                    </button>
                                ) : <div></div>}

                                {nextLessonId ? (
                                    <button onClick={() => onLessonChange(nextLessonId!)} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group text-right">
                                        <div className="hidden md:block">
                                            <div className="text-xs text-gray-500 uppercase mb-1">Próxima</div>
                                            <div className="font-bold text-sm leading-tight text-white max-w-[200px] lg:max-w-[300px] line-clamp-2">{flatLessons[currentIndex + 1].title}</div>
                                        </div>
                                        <div className="p-3 rounded-full bg-white/5 group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors shrink-0"><ChevronRight size={20} /></div>
                                    </button>
                                ) : <div></div>}
                            </div>

                            <CommentsSection lessonId={lessonId} user={user} />
                        </div>
                    </>
                ) : (
                    <div className="w-full bg-brand-dark min-h-full p-8 lg:p-16">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-3xl md:text-4xl font-bold text-white">{currentLesson.title}</h1>
                                <button onClick={toggleComplete} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${isCompleted ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                                    {isCompleted ? <CheckCircle size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>}
                                </button>
                            </div>

                            <div className="prose prose-invert prose-xl max-w-none mb-12" {...safeHtml(currentLesson.textContent)}></div>

                            {/* Navigation & Comments also here */}
                            <div className="flex justify-between items-center py-8 border-t border-white/10 mb-8">
                                {prevLessonId ? (<button onClick={() => onLessonChange(prevLessonId!)} className="text-gray-400 hover:text-white font-bold flex items-center gap-2"><ArrowLeft size={16} /> Aula Anterior</button>) : <div></div>}
                                {nextLessonId ? (<button onClick={() => onLessonChange(nextLessonId!)} className="bg-brand-primary text-brand-dark px-6 py-2 rounded font-bold flex items-center gap-2">Próxima Aula <ChevronRight size={16} /></button>) : <div></div>}
                            </div>
                            <CommentsSection lessonId={lessonId} user={user} />
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Sidebar */}
            <div className="player-sidebar w-full lg:w-[380px] flex flex-col h-[400px] lg:h-full overflow-hidden shrink-0">
                {/* Top bar */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-20 bg-brand-card/80 backdrop-blur-xl">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-3 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-primary/40 text-gray-300 hover:text-white text-xs font-semibold transition-colors"
                    >
                        <ArrowLeft size={14} /> Curso
                    </button>
                    {(() => {
                        const completed = flatLessons.filter(l => ProgressService.getProgress(user?.id || '')[l.id]).length;
                        const pct = flatLessons.length ? Math.round((completed / flatLessons.length) * 100) : 0;
                        return (
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 leading-none">Progresso</div>
                                    <div className="text-[13px] font-bold text-white leading-tight mt-0.5">{completed}<span className="text-gray-500">/{flatLessons.length}</span></div>
                                </div>
                                <div
                                    className="player-progress-ring"
                                    style={{ ['--pct' as any]: pct }}
                                >
                                    <span>{pct}%</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Course title */}
                <div className="px-5 py-4 border-b border-white/5">
                    <div className="eyebrow-muted mb-1">Você está assistindo</div>
                    <h3 className="text-[15px] font-bold text-white tracking-tight leading-tight truncate">{course.title}</h3>
                </div>

                {/* Lesson list */}
                <div className="overflow-y-auto flex-1 scrollbar-subtle">
                    {course.modules.map((module, idx) => (
                        <div key={module.id} className="border-b border-white/5 last:border-0">
                            <div className="px-5 py-3 flex items-center gap-3 sticky top-0 bg-brand-card/95 backdrop-blur-sm z-10 border-b border-white/5">
                                <div className="module-number w-7 h-7 text-[10px]">{String(idx + 1).padStart(2, '0')}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[12px] font-bold text-white uppercase tracking-wider truncate">{module.title}</div>
                                    <div className="text-[10px] font-mono text-gray-500 mt-0.5">{module.lessons.length} aulas</div>
                                </div>
                            </div>
                            <div className="p-2 space-y-0.5">
                                {module.lessons.map(lesson => {
                                    const isCompletedLesson = user ? !!ProgressService.getProgress(user.id)[lesson.id] : false;
                                    const isActive = lesson.id === lessonId;
                                    return (
                                        <button
                                            key={lesson.id}
                                            onClick={() => onLessonChange(lesson.id)}
                                            className={`lesson-row ${isActive ? 'active' : ''} ${isCompletedLesson ? 'completed' : ''}`}
                                        >
                                            <div className="lesson-icon-wrap">
                                                {isCompletedLesson
                                                    ? <CheckCircle size={14} />
                                                    : (lesson.type === 'video' ? <Play size={14} /> : <FileText size={14} />)
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-[13px] font-medium leading-snug line-clamp-2 ${isActive ? 'text-white' : 'text-gray-300'}`}>{lesson.title}</div>
                                                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mt-1">
                                                    {lesson.duration ? `${lesson.duration} min` : lesson.type === 'video' ? 'Vídeo' : 'Texto'}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PremiumField: React.FC<{
    id: string; label: string; type?: string; value: string;
    onChange: (v: string) => void; placeholder?: string; icon: React.FC<any>;
    autoComplete?: string; action?: React.ReactNode; onSubmit?: () => void;
}> = ({ id, label, type = 'text', value, onChange, placeholder, icon: Icon, autoComplete, action, onSubmit }) => (
    <div>
        <label htmlFor={id} className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
            <input
                id={id}
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSubmit?.()}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="w-full h-12 bg-brand-inset border border-white/8 rounded-xl pl-10 pr-10 text-white text-sm placeholder:text-gray-600 focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
            {action && <div className="absolute right-3 top-1/2 -translate-y-1/2">{action}</div>}
        </div>
    </div>
);

export const LoginView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgot, setIsForgot] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleAuth = async () => {
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (isForgot) {
                await AuthService.resetPassword(email);
                setSuccessMsg('Email de recuperação enviado! Verifique sua caixa de entrada.');
                setLoading(false);
                return;
            }

            if (isLogin) {
                // Validação básica
                if (!email || !password) {
                    throw new Error('Por favor, preencha email e senha');
                }

                await AuthService.signIn(email, password);
                onLogin();
            } else {
                // Cadastro
                if (!name) throw new Error("Nome é obrigatório");
                if (!email || !password) throw new Error("Email e senha são obrigatórios");

                const { session } = await AuthService.signUp(name, email, password);
                if (session) {
                    onLogin();
                } else {
                    setSuccessMsg("Conta criada com sucesso! Verifique seu email para confirmar o cadastro antes de fazer login.");
                    setIsLogin(true);
                    setPassword('');
                }
            }
        } catch (e: any) {
            console.error('Erro de autenticação:', e);
            setError(e.message || 'Erro na operação. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    const toggleForgot = () => {
        setIsForgot(!isForgot);
        setError('');
        setSuccessMsg('');
    };

    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-dark relative overflow-hidden px-4 py-12">
            {/* Background grid */}
            <div className="absolute inset-0 bg-[image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            {/* Radial green glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,211,102,0.14)_0%,transparent_60%)] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[420px]"
            >
                {/* Glassmorphism card */}
                <div
                    className="bg-brand-card/60 backdrop-blur-2xl border border-white/8 rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)] p-8"
                    style={{ boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), 0 0 60px -20px rgba(37,211,102,0.08)' }}
                >
                    {/* Brand */}
                    <div className="text-center mb-8">
                        <div className="relative inline-block mb-5">
                            <div className="absolute inset-0 bg-brand-primary/25 blur-2xl rounded-full scale-150" />
                            <img src="https://i.imgur.com/FIJkEbs.png" className="relative h-20 mx-auto" alt="Conversapp Academy" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            {isForgot ? 'Recuperar acesso' : (isLogin ? 'Bem-vindo de volta' : 'Criar sua conta')}
                        </h1>
                        <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">
                            {isForgot
                                ? 'Enviaremos um link de redefinição para seu email'
                                : isLogin
                                    ? 'Acesse a área exclusiva de membros'
                                    : 'Comece sua jornada no Conversapp Academy'}
                        </p>
                    </div>

                    {/* Tab switcher */}
                    {!isForgot && (
                        <div className="flex bg-brand-inset/80 p-1 rounded-xl mb-7 border border-white/5">
                            <button
                                onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
                                className={`flex-1 py-2.5 text-[12px] font-mono uppercase tracking-wider rounded-lg transition-all ${isLogin ? 'bg-gradient-premium text-brand-dark font-bold shadow-neon' : 'text-gray-400 hover:text-white'}`}
                            >
                                Entrar
                            </button>
                            <button
                                onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
                                className={`flex-1 py-2.5 text-[12px] font-mono uppercase tracking-wider rounded-lg transition-all ${!isLogin ? 'bg-gradient-premium text-brand-dark font-bold shadow-neon' : 'text-gray-400 hover:text-white'}`}
                            >
                                Cadastrar
                            </button>
                        </div>
                    )}

                    {/* Messages */}
                    <AnimatePresence mode="wait">
                        {successMsg && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex items-start gap-3 p-4 mb-5 bg-brand-primary/10 border border-brand-primary/30 rounded-xl"
                                role="alert"
                                aria-live="polite"
                            >
                                <CheckCircle className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                                <p className="text-[13px] text-brand-aurora leading-relaxed">{successMsg}</p>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex items-start gap-3 p-4 mb-5 bg-red-500/10 border border-red-500/30 rounded-xl"
                                role="alert"
                                aria-live="assertive"
                            >
                                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <p className="text-[13px] text-red-300 leading-relaxed">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-4">
                        {!isLogin && !isForgot && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <PremiumField id="name" label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" icon={UserIcon} autoComplete="name" onSubmit={handleAuth} />
                            </motion.div>
                        )}

                        <PremiumField
                            id="email" label="E-mail" type="email" value={email}
                            onChange={setEmail} placeholder="seu@email.com"
                            icon={Mail} autoComplete="email" onSubmit={handleAuth}
                        />

                        {!isForgot && (
                            <PremiumField
                                id="password" label="Senha"
                                type={showPassword ? 'text' : 'password'}
                                value={password} onChange={setPassword} placeholder="••••••••"
                                icon={Key} autoComplete={isLogin ? 'current-password' : 'new-password'}
                                onSubmit={handleAuth}
                                action={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-500 hover:text-gray-300 transition-colors"
                                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                }
                            />
                        )}

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAuth}
                            disabled={loading}
                            className="btn-primary-premium w-full h-12 text-[13px] justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</>
                                : isForgot ? 'Enviar link de recuperação'
                                : isLogin ? 'Entrar na plataforma'
                                : 'Criar minha conta'}
                        </motion.button>
                    </div>

                    <div className="mt-5 text-center">
                        {isForgot ? (
                            <button onClick={toggleForgot} className="text-[12px] text-gray-400 hover:text-brand-primary transition-colors underline underline-offset-2">
                                Voltar ao login
                            </button>
                        ) : isLogin ? (
                            <button onClick={toggleForgot} className="text-[12px] text-gray-400 hover:text-brand-primary transition-colors">
                                Esqueceu sua senha?
                            </button>
                        ) : null}
                    </div>

                    {/* Footer trust signal */}
                    <div className="mt-7 pt-5 border-t border-white/5 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_#25D366]" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Área exclusiva · Conversapp Academy</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const SortablePageBlock = ({ block, openBlockId, setOpenBlockId, removeBlock, updateBlock }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
    const isOpen = openBlockId === block.id;
    const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 50 : 'auto' };

    const isBanner = block.type === 'hero_banner';

    return (
        <div ref={setNodeRef} style={style} className={`rounded-2xl overflow-hidden border transition-all duration-200 ${isOpen ? 'border-brand-primary/40 shadow-neon' : 'border-white/8 hover:border-white/15'} bg-brand-card`}>
            {/* Block Header */}
            <div className={`flex items-center gap-3 px-4 py-3 ${isOpen ? 'bg-brand-primary/5 border-b border-brand-primary/15' : 'bg-white/3'}`}>
                <button className="text-gray-600 hover:text-gray-300 cursor-grab active:cursor-grabbing p-1 transition-colors shrink-0" {...attributes} {...listeners} title="Arrastar">
                    <GripVertical size={15} />
                </button>

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isBanner ? 'bg-blue-500/15 text-blue-400' : 'bg-brand-primary/15 text-brand-primary'}`}>
                    {isBanner ? <ImageIcon size={15} /> : <ListIcon size={15} />}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{block.content.title || 'Sem título'}</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-gray-600">{isBanner ? 'Banner' : 'Vitrine de Cursos'}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => setOpenBlockId(isOpen ? null : block.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono uppercase tracking-wider transition-all ${isOpen ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/25' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/8'}`}
                    >
                        {isOpen ? 'Fechar' : 'Editar'}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                        title="Remover bloco"
                    >
                        <Trash size={14} />
                    </button>
                </div>
            </div>

            {/* Block Editor */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 bg-black/20 space-y-4">
                            {isBanner && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5">Título</label>
                                        <input value={block.content.title} onChange={e => updateBlock(block.id, { title: e.target.value })} className="w-full bg-brand-surface/60 border border-white/8 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-brand-primary/40 transition-colors" placeholder="Título do Banner" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5">Descrição</label>
                                        <textarea value={block.content.description} onChange={e => updateBlock(block.id, { description: e.target.value })} className="w-full bg-brand-surface/60 border border-white/8 rounded-xl px-3.5 py-2.5 text-[13px] text-white h-20 resize-none focus:outline-none focus:border-brand-primary/40 transition-colors" placeholder="Descrição do Banner" />
                                    </div>
                                    <ImagePicker label="Imagem de Fundo" value={block.content.imageUrl || ''} onChange={val => updateBlock(block.id, { imageUrl: val })} resolutionHint="1920×1080px · proporção 16:9 · JPG/PNG/WebP" allowedTabs={['upload', 'link', 'ai']} />
                                    <div className="border-t border-white/8 pt-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[13px] font-semibold text-white">Botão de Ação (CTA)</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={block.content.showCta} onChange={e => updateBlock(block.id, { showCta: e.target.checked })} className="sr-only peer" />
                                                <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary relative"></div>
                                            </label>
                                        </div>
                                        {block.content.showCta && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <input value={block.content.ctaText} onChange={e => updateBlock(block.id, { ctaText: e.target.value })} className="bg-brand-surface/60 border border-white/8 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-brand-primary/40 transition-colors" placeholder="Texto do botão" />
                                                <input value={block.content.ctaLink || ''} onChange={e => updateBlock(block.id, { ctaLink: e.target.value })} className="bg-brand-surface/60 border border-white/8 rounded-xl px-3.5 py-2.5 text-[13px] text-white font-mono focus:outline-none focus:border-brand-primary/40 transition-colors" placeholder="https://..." />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {!isBanner && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5">Título da Seção</label>
                                        <input value={block.content.title} onChange={e => updateBlock(block.id, { title: e.target.value })} className="w-full bg-brand-surface/60 border border-white/8 rounded-xl px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-brand-primary/40 transition-colors" placeholder="ex: Cursos em Destaque" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <VisualSelector
                                            label="Fonte de Conteúdo"
                                            value={block.content.sourceType || 'all_courses'}
                                            onChange={val => updateBlock(block.id, { sourceType: val })}
                                            options={[{ value: 'all_courses', label: 'Todos os Cursos' }, { value: 'specific_courses', label: 'Selecionar Manualmente' }]}
                                        />
                                        <VisualSelector
                                            label="Estilo de Exibição"
                                            value={block.content.displayStyle || 'carousel'}
                                            onChange={val => updateBlock(block.id, { displayStyle: val })}
                                            options={[{ value: 'carousel', label: 'Carrossel' }, { value: 'grid', label: 'Grade' }]}
                                        />
                                    </div>
                                    {block.content.sourceType === 'specific_courses' && (
                                        <div className="border-t border-white/8 pt-4">
                                            <CourseSelector
                                                selectedIds={block.content.selectedIds || []}
                                                onChange={(ids) => updateBlock(block.id, { selectedIds: ids })}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Quick course list shown in the builder panel "Cursos" tab
const CoursesPanel: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { CourseService.getAll().then(c => { setCourses(c); setLoading(false); }); }, []);
    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-brand-primary/60" />
        </div>
    );
    return (
        <div className="px-4 pt-4 pb-4 space-y-2">
            {courses.length === 0 ? (
                <div className="text-center py-12">
                    <BookOpen size={24} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-[12px] text-gray-500">Nenhum curso ainda.</p>
                    <p className="text-[11px] text-gray-600 mt-1">Crie cursos na aba Cursos do Construtor.</p>
                </div>
            ) : courses.map(c => {
                const totalLessons = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                return (
                    <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-brand-surface/30 border border-white/6">
                        <img src={hqImage(c.coverImage, 200)} alt={c.title} loading="lazy" decoding="async" className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/10 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white truncate">{c.title}</p>
                            <p className="text-[10px] font-mono text-gray-600">{c.modules.length} mód · {totalLessons} aulas</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${c.modules.length > 0 ? 'bg-brand-primary shadow-[0_0_6px_#25D366]' : 'bg-white/20'}`} title={c.modules.length > 0 ? 'Publicado' : 'Vazio'} />
                    </div>
                );
            })}
        </div>
    );
};

const PageBuilder: React.FC = () => {
    const [blocks, setBlocks] = useState<PageBlock[]>([]);
    const [openBlockId, setOpenBlockId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const [previewCourses, setPreviewCourses] = useState<Course[]>([]);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    // Load initial data
    useEffect(() => {
        LayoutService.getBlocks().then(setBlocks);
        CourseService.getAll().then(setPreviewCourses);
    }, []);

    // Auto-save effect
    useEffect(() => {
        if (blocks.length === 0) return; // Don't save empty state on initial load

        setIsSaving(true);
        const timeoutId = setTimeout(async () => {
            try {
                await LayoutService.saveBlocks(blocks);
                setLastSavedTime(new Date());
            } catch (e) {
                console.error("Auto-save failed", e);
            } finally {
                setIsSaving(false);
            }
        }, 2000); // 2 seconds debounce

        return () => clearTimeout(timeoutId);
    }, [blocks]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await LayoutService.saveBlocks(blocks);
            setLastSavedTime(new Date());
        } catch (e: any) {
            console.error("Layout save error:", e);
            alert(`Erro ao salvar no servidor: ${e.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addBlock = (type: BlockType) => {
        const newBlock: PageBlock = {
            id: `blk-${Date.now()}`,
            type,
            content: type === 'hero_banner' ? {
                title: 'Conversapp Academy',
                description: 'Sua plataforma de ensino.',
                imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=90&w=2000',
                showCta: true,
                ctaText: 'Ver Cursos'
            } : {
                title: 'Cursos em Destaque',
                sourceType: 'all_courses',
                displayStyle: 'carousel'
            }
        };
        setBlocks([...blocks, newBlock]);
        setOpenBlockId(newBlock.id);
    };

    const removeBlock = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Excluir Seção?',
            message: 'Tem certeza que deseja excluir esta seção do layout? As alterações só serão aplicadas após Salvar.',
            onConfirm: () => {
                setBlocks(current => current.filter(b => b.id !== id));
                setConfirmModal(null);
            }
        });
    };

    const updateBlock = (id: string, content: any) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, content: { ...b.content, ...content } } : b));
    };

    return (
        <div className="flex h-full overflow-hidden" style={{background:'#050707'}}>
            {confirmModal && <ConfirmDialog {...confirmModal} onCancel={() => setConfirmModal(null)} />}

            {/* ── LEFT: Canvas Preview ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Canvas header bar */}
                <div className="h-11 flex items-center justify-between px-5 shrink-0" style={{background:'#050707', borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-white/10" />
                            <div className="w-3 h-3 rounded-full bg-white/10" />
                            <div className="w-3 h-3 rounded-full bg-white/10" />
                        </div>
                        <span className="text-[11px] font-mono text-gray-600 ml-2">preview · página principal</span>
                    </div>
                    {/* Autosave indicator */}
                    <div className="flex items-center gap-2">
                        <AnimatePresence mode="wait">
                            {isSaving ? (
                                <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex items-center gap-1.5 text-[11px] font-mono text-yellow-400/80">
                                    <Loader2 size={10} className="animate-spin" />
                                    Salvando...
                                </motion.div>
                            ) : lastSavedTime ? (
                                <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex items-center gap-1.5 text-[11px] font-mono text-brand-primary/70">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_6px_#25D366]" />
                                    Salvo automaticamente
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Scrollable canvas */}
                <div className="flex-1 overflow-y-auto scrollbar-subtle" style={{background:'#050707'}}>
                    {blocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-2">
                                <LayoutIcon size={28} className="text-gray-600" />
                            </div>
                            <div>
                                <p className="text-[15px] font-semibold text-gray-400">Canvas vazio</p>
                                <p className="text-[13px] text-gray-600 mt-1">Adicione seções no painel à direita para visualizar a página.</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {blocks.map(block => (
                                <div
                                    key={block.id}
                                    onClick={() => setOpenBlockId(block.id)}
                                    className={`relative group cursor-pointer transition-all duration-200 ${
                                        openBlockId === block.id
                                            ? 'ring-2 ring-inset ring-brand-primary/50'
                                            : 'hover:ring-1 hover:ring-inset hover:ring-white/15'
                                    }`}
                                >
                                    {/* Floating edit pill */}
                                    <div className={`absolute top-3 right-3 z-20 transition-all duration-200 ${openBlockId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider backdrop-blur-md ${
                                            openBlockId === block.id
                                                ? 'bg-brand-primary text-brand-dark shadow-neon'
                                                : 'bg-black/60 text-white border border-white/20'
                                        }`}>
                                            <Pencil size={8} />
                                            {openBlockId === block.id ? 'Editando' : 'Editar'}
                                        </div>
                                    </div>

                                    {block.type === 'hero_banner' ? (
                                        <div className="relative h-[280px] lg:h-[360px] w-full flex items-center justify-center overflow-hidden">
                                            <img src={block.content.imageUrl} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-55" alt="" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-transparent to-brand-dark/70" />
                                            <div className="relative z-10 text-center max-w-3xl px-6">
                                                <h1 className="text-2xl lg:text-4xl font-bold text-white mb-3 drop-shadow-lg leading-tight">{block.content.title}</h1>
                                                <p className="text-sm lg:text-base text-gray-200/90 mb-6 max-w-xl mx-auto leading-relaxed">{block.content.description}</p>
                                                {block.content.showCta && (
                                                    <span className="inline-block bg-brand-primary text-brand-dark px-6 py-2.5 rounded-full font-bold text-sm shadow-neon">
                                                        {block.content.ctaText}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (() => {
                                        const blockPreviewCourses = block.content.sourceType === 'specific_courses' && block.content.selectedIds?.length
                                            ? (block.content.selectedIds as string[]).map((id: string) => previewCourses.find(c => c.id === id)).filter(Boolean) as Course[]
                                            : previewCourses;
                                        const displayCourses = blockPreviewCourses.slice(0, 4);
                                        return (
                                            <div className="px-6 py-10">
                                                <p className="text-[10px] font-mono uppercase tracking-wider text-brand-primary/70 mb-1">Coleção</p>
                                                <h2 className="text-xl font-bold text-white mb-6">{block.content.title}</h2>
                                                <div className={`grid gap-3 ${displayCourses.length > 0 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'}`}>
                                                    {displayCourses.length > 0 ? displayCourses.map(course => {
                                                        const cover = hqImage(course.coverImage || pickImage(COURSE_COVERS, course.id + course.title), 600);
                                                        const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                                                        return (
                                                            <div key={course.id} className="group rounded-xl overflow-hidden bg-brand-card">
                                                                <div className="relative aspect-[16/10] overflow-hidden bg-brand-inset">
                                                                    <img src={cover} alt={course.title} loading="lazy" decoding="async" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                                    <div className="absolute bottom-2 left-2 text-[9px] font-mono uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white/80 px-1.5 py-0.5 rounded">
                                                                        {course.modules.length} mód
                                                                    </div>
                                                                </div>
                                                                <div className="p-3">
                                                                    <p className="text-[12px] font-semibold text-white truncate">{course.title}</p>
                                                                    <p className="text-[10px] text-gray-500 mt-0.5">{totalLessons} aulas</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }) : [0, 1, 2, 3].map(i => (
                                                        <div key={i} className="aspect-[4/3] rounded-xl bg-brand-card flex flex-col items-center justify-center gap-2 text-gray-700">
                                                            <MonitorPlay size={18} />
                                                            <span className="text-[9px] font-mono uppercase tracking-wider">Curso {i + 1}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── RIGHT: Tool Panel ── */}
            <div className="w-[380px] xl:w-[420px] flex flex-col h-full z-30 shrink-0" style={{background:'#050707'}}>

                {/* Panel header */}
                <div className="px-5 py-4 border-b border-white/3 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="eyebrow text-[10px] mb-0.5">Workspace</div>
                            <h2 className="text-[15px] font-bold text-white tracking-tight">Construtor de conteúdo</h2>
                        </div>
                    </div>

                    {/* Tab switcher: Layout / Cursos */}
                    <div className="flex bg-brand-dark/80 p-1 rounded-xl border border-white/6 gap-1">
                        <button
                            onClick={() => setOpenBlockId(null)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold font-mono uppercase tracking-wider transition-all ${
                                openBlockId !== '__courses__'
                                    ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/25'
                                    : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <LayoutIcon size={11} /> Layout
                        </button>
                        <button
                            onClick={() => setOpenBlockId('__courses__')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold font-mono uppercase tracking-wider transition-all ${
                                openBlockId === '__courses__'
                                    ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/25'
                                    : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <BookOpen size={11} /> Cursos
                        </button>
                    </div>
                </div>

                {/* Panel body */}
                <div className="flex-1 overflow-y-auto scrollbar-subtle">
                    {openBlockId === '__courses__' ? (
                        /* Courses quick-view */
                        <CoursesPanel />
                    ) : (
                        /* Layout blocks */
                        <div className="px-4 pt-4 pb-2 space-y-2">
                            {blocks.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-3">
                                        <LayoutIcon size={20} className="text-gray-700" />
                                    </div>
                                    <p className="text-[13px] text-gray-500 font-semibold">Nenhuma seção ainda</p>
                                    <p className="text-[11px] text-gray-600 mt-1">Use os botões abaixo para adicionar.</p>
                                </div>
                            )}
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {blocks.map((block) => (
                                            <SortablePageBlock
                                                key={block.id}
                                                block={block}
                                                openBlockId={openBlockId}
                                                setOpenBlockId={setOpenBlockId}
                                                removeBlock={removeBlock}
                                                updateBlock={updateBlock}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}
                </div>

                {/* Add section footer */}
                {openBlockId !== '__courses__' && (
                    <div className="px-4 py-4 border-t border-white/6 shrink-0">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-gray-700 mb-2.5 px-1">+ Nova seção</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => addBlock('hero_banner')}
                                className="group flex items-center gap-3 p-3 rounded-xl bg-brand-surface/40 hover:bg-blue-500/8 border border-white/6 hover:border-blue-500/25 transition-all text-left"
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/18 flex items-center justify-center shrink-0 transition-colors">
                                    <ImageIcon size={14} className="text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-gray-300 group-hover:text-white transition-colors">Banner</p>
                                    <p className="text-[10px] text-gray-600">Hero com imagem</p>
                                </div>
                            </button>
                            <button
                                onClick={() => addBlock('content_list')}
                                className="group flex items-center gap-3 p-3 rounded-xl bg-brand-surface/40 hover:bg-brand-primary/8 border border-white/6 hover:border-brand-primary/25 transition-all text-left"
                            >
                                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 group-hover:bg-brand-primary/18 flex items-center justify-center shrink-0 transition-colors">
                                    <ListIcon size={14} className="text-brand-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-gray-300 group-hover:text-white transition-colors">Vitrine</p>
                                    <p className="text-[10px] text-gray-600">Grid de cursos</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Builder: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<'courses' | 'pages'>('pages'); // Default to Layout
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingCovers, setIsUpdatingCovers] = useState(false);

    useEffect(() => {
        CourseService.getAll().then(setCourses);
    }, []);

    const batchUpdateCovers = async () => {
        if (!confirm('Atualizar as fotos de capa de todos os cursos?')) return;
        setIsUpdatingCovers(true);
        try {
            for (const course of courses) {
                const mapped = COURSE_COVER_MAP[course.title];
                if (mapped) {
                    const updated = { ...course, coverImage: mapped.cover, bannerImage: mapped.banner };
                    await CourseService.save(updated);
                }
            }
            const refreshed = await CourseService.getAll();
            setCourses(refreshed);
            alert('✅ Capas atualizadas com sucesso!');
        } catch (e) {
            alert('Erro ao atualizar capas.');
        } finally {
            setIsUpdatingCovers(false);
        }
    };

    const handleSave = async (course: Course) => {
        setIsSaving(true);
        try {
            await CourseService.save(course);
            setEditingCourse(course); // Keep editor open and update state
            const updated = await CourseService.getAll();
            setCourses(updated);
        } catch (e) {
            alert('Erro ao salvar');
        } finally {
            setIsSaving(false);
        }
    };

    if (editingCourse) {
        return <CourseContentEditor course={editingCourse} isSaving={isSaving} onBack={() => setEditingCourse(null)} onSave={handleSave} />;
    }

    // Tabs header — shared between both views
    const TabsHeader = ({ compact = false }: { compact?: boolean }) => (
        <div className={`flex items-center justify-between ${compact ? 'px-6 py-3' : 'px-6 lg:px-10 pt-8 pb-6'}`} style={compact ? {background:'#050707', borderBottom:'1px solid rgba(255,255,255,0.04)'} : {}}>
            <div className={`flex items-center ${compact ? 'gap-5' : 'flex-col lg:flex-row gap-4 w-full'}`}>
                {!compact && <div className="w-full lg:w-auto"><div className="eyebrow mb-1 text-[10px]">Workspace</div><h1 className="text-3xl font-bold text-white tracking-tight">Construtor de conteúdo</h1></div>}
                {compact && <h2 className="text-sm font-bold text-white tracking-tight">Construtor de conteúdo</h2>}
                <div className="inline-flex bg-brand-card-raised/60 p-1 rounded-xl border border-white/5">
                    <button onClick={() => setActiveTab('pages')} className={`px-4 py-2 rounded-lg text-[12px] font-mono uppercase tracking-wider transition-all ${activeTab === 'pages' ? 'bg-gradient-premium text-brand-dark font-bold shadow-neon' : 'text-gray-400 hover:text-white'}`}>
                        <LayoutIcon className="w-3.5 h-3.5 inline mr-1.5" /> Layout
                    </button>
                    <button onClick={() => setActiveTab('courses')} className={`px-4 py-2 rounded-lg text-[12px] font-mono uppercase tracking-wider transition-all ${activeTab === 'courses' ? 'bg-gradient-premium text-brand-dark font-bold shadow-neon' : 'text-gray-400 hover:text-white'}`}>
                        <BookOpen className="w-3.5 h-3.5 inline mr-1.5" /> Cursos
                    </button>
                </div>
            </div>
            {activeTab === 'courses' && (
                <div className="flex items-center gap-3 shrink-0">
                    <button onClick={batchUpdateCovers} disabled={isUpdatingCovers || courses.length === 0} className="flex items-center gap-2 px-4 h-10 bg-white/5 hover:bg-brand-primary/10 hover:text-brand-primary border border-white/5 hover:border-brand-primary/30 rounded-xl text-sm text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed" title="Atualizar capas de todos os cursos">
                        {isUpdatingCovers ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                        {isUpdatingCovers ? 'Atualizando...' : 'Atualizar Capas'}
                    </button>
                    <button onClick={() => { const seed = `new-${Date.now()}`; setEditingCourse({ id: `temp-${Date.now()}`, title: 'Novo Curso', description: 'Descrição do curso...', coverImage: pickImage(COURSE_COVERS, seed), bannerImage: pickImage(COURSE_BANNERS, seed + 'b'), author: DEFAULT_AUTHOR, modules: [], totalDuration: 0, progress: 0, tags: [] }); }} className="btn-primary-premium">
                        <Plus size={18} /> Novo curso
                    </button>
                </div>
            )}
        </div>
    );

    // ── LAYOUT TAB: full-screen, sem container restrito ──
    if (activeTab === 'pages') {
        return (
            <div className="flex flex-col h-full min-h-0">
                <TabsHeader compact />
                <div className="flex-1 overflow-hidden min-h-0">
                    <PageBuilder />
                </div>
            </div>
        );
    }

    // ── CURSOS TAB: layout normal com padding ──
    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto pb-24">
            <TabsHeader />
            <div className="mt-6">{(
                <div className="space-y-3">
                    {courses.length === 0 && (
                        <div className="panel-premium p-14 text-center">
                            <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 mb-1">Nenhum curso encontrado.</p>
                            <p className="text-xs text-gray-600">Crie o primeiro curso para começar.</p>
                        </div>
                    )}
                    {courses.map((c, idx) => {
                        const totalLessons = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                        return (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.04 }}
                                className="module-card group"
                            >
                                <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <div className="relative shrink-0">
                                        <div className="absolute -inset-1 bg-gradient-premium opacity-0 group-hover:opacity-50 blur-lg rounded-xl transition-opacity" />
                                        <img src={c.coverImage} alt={c.title} className="relative w-20 h-20 rounded-xl object-cover border border-white/10" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white text-[16px] tracking-tight truncate">{c.title}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                                {c.modules.length} módulos
                                            </span>
                                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                                                {totalLessons} aulas
                                            </span>
                                            {c.author && (
                                                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                                                    · {c.author}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0 self-stretch md:self-auto">
                                        <button
                                            onClick={() => setEditingCourse(c)}
                                            className="flex items-center gap-2 px-4 h-10 bg-white/5 hover:bg-brand-primary/10 hover:text-brand-primary border border-white/5 hover:border-brand-primary/30 rounded-xl text-sm text-white font-medium transition-all"
                                        >
                                            <Edit2 size={14} /> Editar
                                        </button>
                                        <button
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm('Tem certeza que deseja excluir este curso?')) {
                                                    try {
                                                        const id = c.id;
                                                        setCourses(prev => prev.filter(course => course.id !== id));
                                                        await CourseService.remove(id);
                                                        const updated = await CourseService.getAll();
                                                        setCourses(updated);
                                                    } catch (err: any) {
                                                        alert('Erro ao excluir curso: ' + err.message);
                                                    }
                                                }
                                            }}
                                            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/30 text-gray-400 rounded-xl transition-all"
                                            title="Excluir"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}</div>
        </div>
    );
};

export const Analytics: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            UserService.getUsers(),
            CourseService.getAll()
        ]).then(([u, c]) => {
            setUsers(u);
            setCourses(c);
            setLoading(false);
        });
    }, []);

    const totalStudents = users.filter(u => u.role === UserRole.STUDENT).length;
    const totalAdmins = users.filter(u => u.role === UserRole.ADMIN).length;
    const totalMod = users.filter(u => u.role === UserRole.MODERATOR).length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const totalLessons = courses.reduce((acc, c) => acc + c.modules.reduce((a, m) => a + m.lessons.length, 0), 0);
    const totalModules = courses.reduce((acc, c) => acc + c.modules.length, 0);

    // Build monthly user registration chart from real data
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const enrollmentData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const count = users.filter(u => {
            const created = new Date(u.createdAt);
            return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
        }).length;
        return { name: monthNames[d.getMonth()], alunos: count };
    });

    // Role distribution for pie chart
    const roleData = [
        { name: 'Alunos', value: totalStudents || 1, color: '#25D366' },
        { name: 'Moderadores', value: totalMod || 0, color: '#3B82F6' },
        { name: 'Admins', value: totalAdmins || 0, color: '#8B5CF6' },
    ].filter(d => d.value > 0);

    // Course content breakdown
    const courseData = courses.slice(0, 6).map(c => ({
        name: c.title.slice(0, 18) + (c.title.length > 18 ? '…' : ''),
        aulas: c.modules.reduce((a, m) => a + m.lessons.length, 0),
        modulos: c.modules.length,
    }));

    const tooltipStyle = { backgroundColor: '#0B0D0C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' };
    const tooltipItemStyle = { color: '#C8CFCD', fontSize: 12 };

    const StatCard: React.FC<{ label: string; value: string | number; sub?: string; trend?: 'up' | 'neutral'; icon: React.FC<any> }> = ({ label, value, sub, trend, icon: Icon }) => (
        <div className="panel-premium p-6 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">{label}</div>
                <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
                {sub && <div className={`text-[11px] mt-1 flex items-center gap-1 ${trend === 'up' ? 'text-brand-primary' : 'text-gray-500'}`}>
                    {trend === 'up' && <ArrowUp size={11} />}{sub}
                </div>}
            </div>
        </div>
    );

    if (loading) return (
        <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
    );

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto pb-24">
            <div className="mb-10">
                <div className="eyebrow mb-3">Painel</div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Analytics</h1>
                <p className="text-gray-400 text-sm mt-2">Dados reais da sua plataforma — atualizados em tempo real.</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
                <StatCard label="Total de Membros" value={users.length} sub={`${activeUsers} ativos`} trend="up" icon={Users} />
                <StatCard label="Alunos" value={totalStudents} sub={`${totalAdmins} admins · ${totalMod} mods`} icon={BookOpen} />
                <StatCard label="Cursos Publicados" value={courses.length} sub={`${totalModules} módulos`} trend="up" icon={LayoutIcon} />
                <StatCard label="Total de Aulas" value={totalLessons} sub="conteúdo disponível" icon={Play} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                {/* Bar chart — enrollment per month */}
                <div className="panel-premium p-6 xl:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="eyebrow mb-1">Crescimento</div>
                            <h3 className="text-[15px] font-bold text-white">Novos membros por mês</h3>
                        </div>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={enrollmentData} barCategoryGap="35%">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="transparent" tick={{ fill: '#5C6361', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                                <YAxis stroke="transparent" tick={{ fill: '#5C6361', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} cursor={{ fill: 'rgba(37,211,102,0.05)' }} />
                                <Bar dataKey="alunos" fill="#25D366" radius={[6, 6, 0, 0]} name="Novos membros" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie chart — role distribution */}
                <div className="panel-premium p-6">
                    <div className="eyebrow mb-1">Membros</div>
                    <h3 className="text-[15px] font-bold text-white mb-4">Distribuição por função</h3>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={roleData} innerRadius={52} outerRadius={72} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                    {roleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2 mt-3">
                        {roleData.map(d => (
                            <div key={d.name} className="flex items-center justify-between text-[12px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                                    <span className="text-gray-300">{d.name}</span>
                                </div>
                                <span className="font-mono font-bold text-white">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Course content bar chart */}
            {courseData.length > 0 && (
                <div className="panel-premium p-6">
                    <div className="eyebrow mb-1">Conteúdo</div>
                    <h3 className="text-[15px] font-bold text-white mb-6">Aulas por curso</h3>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={courseData} layout="vertical" barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="transparent" tick={{ fill: '#5C6361', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={120} stroke="transparent" tick={{ fill: '#8A928F', fontSize: 11 }} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} cursor={{ fill: 'rgba(37,211,102,0.04)' }} />
                                <Bar dataKey="aulas" fill="#25D366" radius={[0, 6, 6, 0]} name="Aulas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}

type RoleFilter = 'ALL' | UserRole;

const roleBadgeClasses: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 text-purple-300 border-purple-400/30',
    [UserRole.MODERATOR]: 'bg-gradient-to-br from-sky-500/20 to-cyan-500/10 text-sky-300 border-sky-400/30',
    [UserRole.STUDENT]: 'bg-gradient-to-br from-emerald-500/15 to-teal-500/5 text-emerald-300 border-emerald-400/25',
};

const roleLabel: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.MODERATOR]: 'Moderador',
    [UserRole.STUDENT]: 'Aluno',
};

export const UserPanel: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

    // Add user modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.STUDENT, phone: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [addUserError, setAddUserError] = useState<string | null>(null);
    const [createdUserCredentials, setCreatedUserCredentials] = useState<
        { email: string; password: string } | null
    >(null);

    // Edit user modal state
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Delete confirmation state
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Transient feedback toast
    const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    const showToast = (kind: 'success' | 'error', text: string) => {
        setToast({ kind, text });
        window.setTimeout(() => setToast(null), 3200);
    };

    useEffect(() => {
        UserService.getUsers().then(u => {
            setUsers(u);
            setLoading(false);
        });
    }, []);

    const filteredUsers = users.filter(u => {
        if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
        const q = filter.toLowerCase().trim();
        if (!q) return true;
        return (
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phone && u.phone.includes(q))
        );
    });

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === UserRole.ADMIN).length,
        moderators: users.filter(u => u.role === UserRole.MODERATOR).length,
        students: users.filter(u => u.role === UserRole.STUDENT).length,
    };

    const handleAddUser = async () => {
        setIsAdding(true);
        setAddUserError(null);
        // Generate a cryptographically-strong one-time password. The admin will
        // see it once, copy it, and send it to the user through a secure
        // channel. The user is expected to rotate it on first login.
        const oneTimePassword = generateSecurePassword(14);
        try {
            await AuthService.createUser(
                newUser.name,
                newUser.email,
                oneTimePassword,
                newUser.role,
                newUser.phone,
            );
            const updatedUsers = await UserService.getUsers();
            setUsers(updatedUsers);
            setIsAddModalOpen(false);
            setCreatedUserCredentials({ email: newUser.email, password: oneTimePassword });
            setNewUser({ name: '', email: '', role: UserRole.STUDENT, phone: '' });
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Erro desconhecido';
            setAddUserError(msg);
        } finally {
            setIsAdding(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        setIsSavingEdit(true);
        setEditError(null);
        try {
            await UserService.updateUser(editingUser);
            setUsers(prev => prev.map(u => (u.id === editingUser.id ? editingUser : u)));
            setEditingUser(null);
            showToast('success', 'Usuário atualizado com sucesso.');
        } catch (e) {
            setEditError(e instanceof Error ? e.message : 'Erro ao atualizar.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleQuickToggleStatus = async (u: User) => {
        const nextStatus: 'active' | 'inactive' = u.status === 'active' ? 'inactive' : 'active';
        try {
            await UserService.setUserStatus(u.id, nextStatus);
            setUsers(prev => prev.map(x => (x.id === u.id ? { ...x, status: nextStatus } : x)));
            showToast(
                'success',
                nextStatus === 'active' ? 'Usuário reativado.' : 'Usuário suspenso.',
            );
        } catch (e) {
            showToast('error', e instanceof Error ? e.message : 'Erro ao alterar status.');
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            await UserService.deleteUser(userToDelete.id);
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            setUserToDelete(null);
            showToast('success', 'Usuário removido.');
        } catch (e) {
            showToast('error', e instanceof Error ? e.message : 'Erro ao remover.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin text-brand-primary" /></div>;

    const roleFilters: { key: RoleFilter; label: string; count: number }[] = [
        { key: 'ALL', label: 'Todos', count: stats.total },
        { key: UserRole.ADMIN, label: 'Administradores', count: stats.admins },
        { key: UserRole.MODERATOR, label: 'Moderadores', count: stats.moderators },
        { key: UserRole.STUDENT, label: 'Alunos', count: stats.students },
    ];

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-brand-primary/80 font-semibold mb-2">Gestão de acessos</div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Usuários</h1>
                        <p className="text-gray-400 text-sm mt-2 max-w-xl">
                            Adicione, edite, promova ou suspenda membros da sua área de membros.
                            Mudanças de função afetam imediatamente as permissões do usuário.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-brand-primary text-brand-dark px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:brightness-110 shadow-lg shadow-brand-primary/20 transition-all"
                        >
                            <UserPlus size={16} /> Adicionar usuário
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters & search */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Buscar por nome, email ou telefone..."
                        className="w-full bg-brand-card border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/10 outline-none transition"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {roleFilters.map(f => {
                        const active = roleFilter === f.key;
                        return (
                            <button
                                key={f.key}
                                onClick={() => setRoleFilter(f.key)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${active
                                    ? 'bg-brand-primary/15 border-brand-primary/50 text-brand-primary shadow-sm shadow-brand-primary/10'
                                    : 'bg-brand-card border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                {f.label}
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${active ? 'bg-brand-primary/20' : 'bg-white/5'}`}>{f.count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table card */}
            <div className="bg-brand-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.02] text-gray-500 font-semibold uppercase text-[10px] tracking-[0.1em]">
                            <tr>
                                <th className="px-5 py-4">Membro</th>
                                <th className="px-5 py-4 hidden md:table-cell">Contato</th>
                                <th className="px-5 py-4">Função</th>
                                <th className="px-5 py-4 hidden lg:table-cell">Desde</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center text-gray-500 text-sm">
                                        Nenhum usuário encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            )}
                            {filteredUsers.map(u => {
                                const inactive = u.status === 'inactive';
                                return (
                                    <tr
                                        key={u.id}
                                        className={`border-t border-white/5 hover:bg-white/[0.03] transition-colors ${inactive ? 'opacity-60' : ''}`}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative shrink-0">
                                                    <img src={u.avatar} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-brand-card ${inactive ? 'bg-gray-500' : 'bg-emerald-400'}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-white font-medium truncate">{u.name}</div>
                                                    <div className="text-xs text-gray-500 md:hidden truncate">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell">
                                            <div className="text-gray-300 text-sm truncate max-w-[220px]">{u.email}</div>
                                            {u.phone && (
                                                <div className="text-gray-500 text-xs font-mono">{u.phone}</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleBadgeClasses[u.role]}`}>
                                                {u.role === UserRole.ADMIN && <Shield size={10} />}
                                                {u.role === UserRole.MODERATOR && <ShieldCheck size={10} />}
                                                {u.role === UserRole.STUDENT && <UserIcon size={10} />}
                                                {roleLabel[u.role]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500 font-mono">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => handleQuickToggleStatus(u)}
                                                className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${inactive
                                                    ? 'bg-gray-500/10 border-gray-500/30 text-gray-400 hover:text-gray-200'
                                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/60'
                                                    }`}
                                                title={inactive ? 'Reativar usuário' : 'Suspender usuário'}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${inactive ? 'bg-gray-400' : 'bg-emerald-400'}`} />
                                                {inactive ? 'Suspenso' : 'Ativo'}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1 justify-end">
                                                <button
                                                    onClick={() => { setEditingUser(u); setEditError(null); }}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                                    title="Editar"
                                                    aria-label={`Editar ${u.name}`}
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => setUserToDelete(u)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                    title="Excluir"
                                                    aria-label={`Excluir ${u.name}`}
                                                >
                                                    <Trash size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add user modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setIsAddModalOpen(false); setAddUserError(null); }}>
                    <div className="bg-brand-card w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white">Adicionar usuário</h3>
                                <p className="text-xs text-gray-400 mt-1">Uma senha temporária será gerada automaticamente.</p>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setAddUserError(null); }} className="text-gray-400 hover:text-white p-1"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <FieldInput label="Nome completo" value={newUser.name} onChange={v => setNewUser({ ...newUser, name: v })} placeholder="Maria Silva" />
                            <FieldInput label="Email" type="email" value={newUser.email} onChange={v => setNewUser({ ...newUser, email: v })} placeholder="maria@exemplo.com" />
                            <FieldInput label="Telefone" value={newUser.phone} onChange={v => setNewUser({ ...newUser, phone: v })} placeholder="+55 (11) 99999-0000" />
                            <VisualSelector
                                label="Função"
                                value={newUser.role}
                                onChange={val => setNewUser({ ...newUser, role: val })}
                                options={[
                                    { value: UserRole.STUDENT, label: 'Aluno' },
                                    { value: UserRole.MODERATOR, label: 'Moderador' },
                                    { value: UserRole.ADMIN, label: 'Admin' },
                                ]}
                            />
                        </div>
                        {addUserError && (
                            <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{addUserError}</span>
                            </div>
                        )}
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => { setIsAddModalOpen(false); setAddUserError(null); }} className="text-gray-400 hover:text-white px-4 py-2 text-sm font-bold">Cancelar</button>
                            <button onClick={handleAddUser} disabled={isAdding || !newUser.name || !newUser.email} className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {isAdding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {isAdding ? 'Criando...' : 'Criar usuário'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit user modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
                    <div className="bg-brand-card w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <img src={editingUser.avatar} className="w-11 h-11 rounded-full object-cover border border-white/10" alt="" />
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-tight">Editar usuário</h3>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{editingUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white p-1"><X size={18} /></button>
                        </div>

                        <div className="space-y-3">
                            <FieldInput label="Nome" value={editingUser.name} onChange={v => setEditingUser({ ...editingUser, name: v })} />
                            <FieldInput label="Email" type="email" value={editingUser.email} onChange={v => setEditingUser({ ...editingUser, email: v })} />
                            <FieldInput label="Telefone" value={editingUser.phone || ''} onChange={v => setEditingUser({ ...editingUser, phone: v })} />
                            <VisualSelector
                                label="Função"
                                value={editingUser.role}
                                onChange={val => setEditingUser({ ...editingUser, role: val })}
                                options={[
                                    { value: UserRole.STUDENT, label: 'Aluno' },
                                    { value: UserRole.MODERATOR, label: 'Moderador' },
                                    { value: UserRole.ADMIN, label: 'Admin' },
                                ]}
                            />

                            <div className="flex items-center justify-between bg-brand-dark/60 border border-white/10 rounded-xl px-4 py-3">
                                <div>
                                    <div className="text-sm font-semibold text-white">Acesso ativo</div>
                                    <div className="text-xs text-gray-500">Usuário suspenso não consegue fazer login.</div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={editingUser.status === 'active'}
                                    onClick={() => setEditingUser({ ...editingUser, status: editingUser.status === 'active' ? 'inactive' : 'active' })}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${editingUser.status === 'active' ? 'bg-brand-primary' : 'bg-white/15'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editingUser.status === 'active' ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {editError && (
                            <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{editError}</span>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white px-4 py-2 text-sm font-bold">Cancelar</button>
                            <button onClick={handleSaveEdit} disabled={isSavingEdit} className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-2">
                                {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {isSavingEdit ? 'Salvando...' : 'Salvar alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
            {userToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !isDeleting && setUserToDelete(null)}>
                    <div className="bg-brand-card w-full max-w-sm rounded-2xl border border-red-500/30 p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Remover usuário?</h3>
                                <p className="text-xs text-gray-400">Esta ação não pode ser desfeita.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300">
                            Você está prestes a remover <strong className="text-white">{userToDelete.name}</strong>. O perfil será excluído do sistema, mas a conta de autenticação pode precisar ser removida manualmente no Supabase.
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setUserToDelete(null)} disabled={isDeleting} className="text-gray-400 hover:text-white px-4 py-2 text-sm font-bold">Cancelar</button>
                            <button onClick={handleDelete} disabled={isDeleting} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 disabled:opacity-50 flex items-center gap-2">
                                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {isDeleting ? 'Removendo...' : 'Sim, remover'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Created credentials modal */}
            {createdUserCredentials && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-brand-card w-full max-w-md rounded-2xl border border-brand-primary/40 p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-primary/15 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-brand-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Usuário criado</h3>
                                <p className="text-xs text-gray-400">Copie a senha agora — ela não será exibida novamente.</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="bg-brand-dark border border-white/10 rounded-lg px-3 py-2">
                                <div className="text-[10px] uppercase tracking-wide text-gray-500">Email</div>
                                <div className="text-sm text-white font-mono break-all">{createdUserCredentials.email}</div>
                            </div>
                            <div className="bg-brand-dark border border-brand-primary/30 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Senha temporária</div>
                                    <div className="text-sm text-brand-primary font-mono truncate">{createdUserCredentials.password}</div>
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(createdUserCredentials.password)}
                                    className="shrink-0 p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                                    title="Copiar senha"
                                    aria-label="Copiar senha"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setCreatedUserCredentials(null)}
                                className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110"
                            >
                                Entendi, já copiei
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.95 }}
                        className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2 text-sm ${toast.kind === 'success'
                            ? 'bg-brand-card border-brand-primary/40 text-white'
                            : 'bg-brand-card border-red-500/40 text-white'
                            }`}
                    >
                        {toast.kind === 'success'
                            ? <CheckCircle className="w-4 h-4 text-brand-primary" />
                            : <AlertCircle className="w-4 h-4 text-red-400" />}
                        {toast.text}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/** Small labelled input used across modals — keeps visual consistency. */
const FieldInput: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}> = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</span>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="mt-1 w-full bg-brand-dark/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/10 outline-none transition"
        />
    </label>
);

export const UserProfile: React.FC<{ user: User, onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
    const [formData, setFormData] = useState(user);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            console.log('💾 Salvando perfil...', formData);
            await UserService.updateUser(formData);
            onUpdate(formData);
            console.log('✅ Perfil salvo com sucesso!');

            // Show success feedback
            alert('Perfil atualizado com sucesso!');
        } catch (e) {
            console.error('❌ Erro ao salvar perfil:', e);
            alert("Erro ao salvar perfil: " + (e instanceof Error ? e.message : 'Erro desconhecido'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>

            <div className="bg-brand-card border border-white/10 rounded-xl p-8 space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="relative group shrink-0">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        <img src={formData.avatar} className="w-40 h-40 rounded-full object-cover border-4 border-brand-dark shadow-2xl" />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                        >
                            <Camera size={32} className="text-white" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome Completo</label>
                            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded-lg px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome de Exibição (Comentários)</label>
                            <input value={formData.displayName || ''} onChange={e => setFormData({ ...formData, displayName: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded-lg px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors" placeholder={formData.name.split(' ')[0]} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Instagram</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-gray-500 text-sm">@</span>
                                <input value={formData.instagram || ''} onChange={e => setFormData({ ...formData, instagram: e.target.value.replace('@', '') })} className="w-full bg-brand-dark border border-white/20 rounded-lg px-4 py-3 pl-8 text-white focus:border-brand-primary outline-none transition-colors" placeholder="seu_usuario" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email</label>
                        <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded-lg px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Telefone</label>
                        <input
                            value={formData.phone || ''}
                            onChange={e => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length > 11) val = val.slice(0, 11);
                                if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                                if (val.length > 4) val = `${val.slice(0, 4)} ${val.slice(4)}`; // Fix space for 9
                                if (val.length > 10) val = `${val.slice(0, 10)}-${val.slice(10)}`;
                                setFormData({ ...formData, phone: val });
                            }}
                            className="w-full bg-brand-dark border border-white/20 rounded-lg px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors"
                            placeholder="(99) 9 9999-9999"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome da Empresa</label>
                        <input value={formData.companyName || ''} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded-lg px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors" />
                    </div>
                </div>

                <div className="pt-6 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="bg-brand-primary text-brand-dark px-8 py-3 rounded-lg font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-2">
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
}

export const ModerationView: React.FC = () => {
    const [allComments, setAllComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        const data = await CommentService.getAllComments();
        setAllComments(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleAction = async (comment: Comment, status: 'approved' | 'rejected') => {
        setActionInProgress(comment.id);
        try {
            await CommentService.updateStatus(comment.id, comment.lessonId, status);
            if (status === 'rejected') {
                setAllComments(prev => prev.filter(c => c.id !== comment.id));
            } else {
                setAllComments(prev => prev.map(c => c.id === comment.id ? { ...c, status: 'approved' } : c));
            }
        } catch (e) {
            console.error('Failed to update comment status', e);
        } finally {
            setActionInProgress(null);
        }
    };

    const tabs: { key: 'pending' | 'approved' | 'rejected'; label: string; color: string }[] = [
        { key: 'pending', label: 'Pendentes', color: 'text-yellow-400' },
        { key: 'approved', label: 'Aprovados', color: 'text-brand-primary' },
        { key: 'rejected', label: 'Rejeitados', color: 'text-red-400' },
    ];

    const filtered = allComments.filter(c => c.status === activeTab);
    const counts = {
        pending: allComments.filter(c => c.status === 'pending').length,
        approved: allComments.filter(c => c.status === 'approved').length,
        rejected: allComments.filter(c => c.status === 'rejected').length,
    };

    const formatDate = (ts: string) => {
        try {
            return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        } catch { return ts; }
    };

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8">
                <div className="eyebrow mb-1">Gestão</div>
                <div className="flex items-center justify-between">
                    <h1 className="text-[28px] font-bold text-white tracking-tight">Comentários</h1>
                    <button
                        onClick={load}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white text-[12px] font-mono uppercase tracking-wider transition-colors"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`panel-premium p-4 text-left transition-all ${activeTab === t.key ? 'ring-1 ring-brand-primary/40 bg-brand-primary/5' : 'hover:bg-white/5'}`}
                    >
                        <div className={`text-2xl font-bold ${t.color}`}>{counts[t.key]}</div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-gray-500 mt-0.5">{t.label}</div>
                    </button>
                ))}
            </div>

            {/* Tab panel */}
            <div className="panel-premium overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-white/5">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`px-6 py-4 text-[12px] font-bold font-mono uppercase tracking-wider transition-colors relative ${
                                activeTab === t.key
                                    ? `${t.color} border-b-2 border-current bg-white/3`
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/3'
                            }`}
                        >
                            {t.label}
                            {counts[t.key] > 0 && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === t.key ? 'bg-current/20' : 'bg-white/8 text-gray-400'}`}>
                                    {counts[t.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 size={28} className="animate-spin text-brand-primary" />
                        <p className="text-[13px] text-gray-500 font-mono">Carregando comentários...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <MessageSquare size={36} className="text-gray-700" />
                        <p className="text-[14px] font-semibold text-gray-500">
                            {activeTab === 'pending' ? 'Nenhum comentário pendente' :
                             activeTab === 'approved' ? 'Nenhum comentário aprovado' :
                             'Nenhum comentário rejeitado'}
                        </p>
                        <p className="text-[12px] text-gray-600">
                            {activeTab === 'pending' ? 'Todos os comentários foram moderados.' :
                             'Os comentários aparecerão aqui após serem moderados.'}
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="divide-y divide-white/5">
                            {filtered.map(c => (
                                <motion.div
                                    key={c.id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                                    className="p-5 flex gap-4 hover:bg-white/2 transition-colors"
                                >
                                    <img
                                        src={c.userAvatar || DEFAULT_AVATAR}
                                        alt={c.userName}
                                        className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div>
                                                <span className="text-[14px] font-semibold text-white">{c.userName}</span>
                                                <span className="ml-2 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                                                    Aula: {c.lessonId?.slice(0, 12) || '—'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-600 font-mono shrink-0">{formatDate(c.timestamp)}</span>
                                        </div>
                                        <p className="text-[13px] text-gray-300 bg-black/20 px-3 py-2.5 rounded-lg mb-3 leading-relaxed border border-white/5">
                                            "{c.text}"
                                        </p>
                                        {activeTab === 'pending' && (
                                            <div className="flex gap-2">
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleAction(c, 'approved')}
                                                    disabled={actionInProgress === c.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 rounded-lg text-[11px] font-bold font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
                                                >
                                                    {actionInProgress === c.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                                                    Aprovar
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleAction(c, 'rejected')}
                                                    disabled={actionInProgress === c.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[11px] font-bold font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
                                                >
                                                    {actionInProgress === c.id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                                                    Rejeitar
                                                </motion.button>
                                            </div>
                                        )}
                                        {activeTab === 'approved' && (
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle size={12} className="text-brand-primary" />
                                                <span className="text-[11px] font-mono text-brand-primary uppercase tracking-wider">Aprovado</span>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleAction(c, 'rejected')}
                                                    disabled={actionInProgress === c.id}
                                                    className="ml-3 flex items-center gap-1 px-2.5 py-1 bg-red-500/8 hover:bg-red-500/15 text-red-400 border border-red-500/15 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle size={10} /> Remover
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

export const IntegrationsView: React.FC = () => {
    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newHook, setNewHook] = useState({ name: '', url: '', event: 'user.created' });

    useEffect(() => {
        loadWebhooks();
    }, []);

    const loadWebhooks = async () => {
        setLoading(true);
        const data = await WebhookService.getWebhooks();
        setWebhooks(data);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!newHook.name || !newHook.url) return;
        try {
            await WebhookService.createWebhook(newHook.name, newHook.url, newHook.event);
            setNewHook({ name: '', url: '', event: 'user.created' });
            setIsAdding(false);
            loadWebhooks();
        } catch (e: any) { alert('Erro: ' + e.message); }
    };

    const handleToggle = async (id: string, active: boolean) => {
        await WebhookService.toggleWebhook(id, active);
        loadWebhooks();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este webhook?')) {
            await WebhookService.deleteWebhook(id);
            loadWebhooks();
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-8">Integrações</h1>

            {/* Webhooks Section */}
            <div className="bg-brand-card border border-white/10 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-500/20 rounded-lg text-pink-500">
                            <Webhook size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Webhooks</h3>
                            <p className="text-sm text-gray-400">Notifique sistemas externos sobre eventos na plataforma.</p>
                        </div>
                    </div>
                    <button onClick={() => setIsAdding(!isAdding)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                        {isAdding ? <X size={16} /> : <Plus size={16} />} {isAdding ? 'Cancelar' : 'Novo Webhook'}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-black/20 p-4 rounded-lg mb-6 border border-white/5 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label>
                                <input value={newHook.name} onChange={e => setNewHook({ ...newHook, name: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-brand-primary outline-none" placeholder="Ex: Zapier" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL de Destino</label>
                                <input value={newHook.url} onChange={e => setNewHook({ ...newHook, url: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-brand-primary outline-none" placeholder="https://..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Evento</label>
                                <select value={newHook.event} onChange={e => setNewHook({ ...newHook, event: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-brand-primary outline-none">
                                    <option value="user.created">Novo Usuário</option>
                                    <option value="course.completed">Curso Concluído</option>
                                    <option value="lesson.completed">Aula Concluída</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={handleAdd} className="bg-brand-primary text-brand-dark px-6 py-2 rounded font-bold text-sm w-full hover:brightness-110">Salvar Webhook</button>
                    </div>
                )}

                <div className="space-y-3">
                    {loading && <div className="text-center py-4 text-gray-500"><Loader2 className="animate-spin inline mr-2" /> Carregando...</div>}
                    {!loading && webhooks.length === 0 && !isAdding && <p className="text-center py-4 text-gray-500">Nenhum webhook configurado.</p>}
                    {webhooks.map(wh => (
                        <div key={wh.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${wh.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <div>
                                    <div className="font-bold text-white text-sm">{wh.name}</div>
                                    <div className="text-xs text-gray-500 font-mono flex items-center gap-2"><ArrowRight size={10} /> {wh.url}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] uppercase bg-white/10 text-gray-300 px-2 py-1 rounded border border-white/5">{wh.event_type}</span>
                                <div className="h-4 w-px bg-white/10"></div>
                                <button onClick={() => handleToggle(wh.id, !wh.active)} title={wh.active ? "Desativar" : "Ativar"}>
                                    {wh.active ? <ToggleRight className="text-brand-primary" size={24} /> : <ToggleLeft className="text-gray-600" size={24} />}
                                </button>
                                <button onClick={() => handleDelete(wh.id)} className="text-gray-600 hover:text-red-400 p-1"><Trash size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* API Documentation */}
            <div className="bg-brand-card border border-white/10 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">API de Cadastro</h3>
                        <p className="text-sm text-gray-400">Use esta API para cadastrar usuários externamente via webhook.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Endpoint</label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-black/40 border border-white/10 rounded px-4 py-3 text-brand-primary font-mono text-sm">
                                POST https://supa.conversapp.app.br/functions/v1/create-user
                            </code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText('https://supa.conversapp.app.br/functions/v1/create-user');
                                    alert('URL copiada!');
                                }}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                                title="Copiar URL"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Exemplo de Requisição (JSON)</label>
                        <div className="relative">
                            <pre className="bg-black/40 border border-white/10 rounded p-4 text-xs text-gray-300 font-mono overflow-x-auto">
                                {`{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "phone": "(11) 98765-4321",
  "role": "STUDENT"
}`}
                            </pre>
                            <button
                                onClick={() => {
                                    const example = `{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "phone": "(11) 98765-4321",
  "role": "STUDENT"
}`;
                                    navigator.clipboard.writeText(example);
                                    alert('Exemplo copiado!');
                                }}
                                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                                title="Copiar exemplo"
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <p className="text-xs text-blue-400 flex items-center gap-2">
                            <AlertCircle size={14} />
                            <span><strong>Nota:</strong> O campo "role" pode ser: STUDENT, MODERATOR ou ADMIN. A senha padrão será "mudar123".</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">Outras Configurações</h2>
                <div className="bg-brand-card border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-brand-primary/20 rounded-lg text-brand-primary">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Inteligência Artificial</h3>
                            <p className="text-sm text-gray-400">Configure a chave da Google Gemini API para geração de conteúdo e imagens.</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase">API Key (Gemini)</label>
                        <div className="flex gap-2">
                            <input type="password" value="**************************" disabled className="flex-1 bg-brand-dark border border-white/20 rounded px-4 py-2 text-white font-mono opacity-50" />
                            <button className="px-4 bg-white/10 hover:bg-white/20 rounded text-white font-bold text-sm">Alterar</button>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><ShieldCheck size={12} /> Chave armazenada de forma segura.</p>
                    </div>
                </div>

                <div className="bg-brand-card border border-white/10 rounded-xl p-6 opacity-50">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                            <Video size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Vimeo / YouTube</h3>
                            <p className="text-sm text-gray-400">Integração nativa para upload de vídeos.</p>
                        </div>
                    </div>
                    <button className="text-xs uppercase font-bold text-white bg-white/10 px-3 py-1 rounded">Em Breve</button>
                </div>
            </div>
        </div>
    );
}
