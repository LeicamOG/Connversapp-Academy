
import React, { useState, useEffect, useRef } from 'react';
import {
    Play, CheckCircle, Clock, ArrowLeft, Plus, Edit2,
    Trash, GripVertical, Loader2, Sparkles, LogIn, Image as ImageIcon, Layout as LayoutIcon, Type as TypeIcon,
    Save, RefreshCw, Palette, UserPlus, MoreHorizontal, UserX, Shield, Video, Layers, ChevronDown, ChevronUp, FileVideo, Youtube, Link as LinkIcon, X, Settings, List, Grid, Search, Filter, MonitorPlay, Upload, Camera, ToggleLeft, ToggleRight, User as UserIcon, ChevronRight, Check, FileText, Paperclip, Bold, Italic, ListOrdered, List as ListIcon, Download, MessageSquare, ThumbsUp, CornerDownRight, ShieldAlert, ArrowUp, ArrowDown, ChevronLeft, Heading1, Heading2, Quote, ShieldCheck, Pencil, AlertTriangle, ExternalLink,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, Strikethrough, Underline, Link2, Send, BookOpen, Webhook, Key, Copy, Eye, XCircle, CheckSquare, AlertCircle, Globe, BarChart2, PieChart, Mail, ArrowRight
} from 'lucide-react';
import { Course, Lesson, Module, PageBlock, ThemeConfig, User, UserRole, BlockType, DisplayStyle, AspectRatio, VideoProvider, Attachment, Comment, BlockContent } from '../types';
import { getFirstLesson, DEFAULT_AVATAR } from '../services/data';
import { UserService, LayoutService, SettingsService, AuthService, CourseService, CommentService, ProgressService, WebhookService } from '../services/supabase';
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
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{label}</label>
            <div className="bg-brand-dark border border-white/20 rounded-lg overflow-hidden">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                {allowedTabs.length > 1 && (
                    <div className="flex border-b border-white/20 overflow-x-auto">
                        {allowedTabs.includes('upload') && <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase transition-colors ${activeTab === 'upload' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Upload</button>}
                        {allowedTabs.includes('link') && <button onClick={() => setActiveTab('link')} className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase transition-colors ${activeTab === 'link' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Link</button>}
                        {allowedTabs.includes('ai') && <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase transition-colors ${activeTab === 'ai' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Sparkles className="inline w-3 h-3 mr-1" />IA</button>}
                    </div>
                )}

                <div className="p-4">
                    {activeTab === 'link' && (
                        <div className="flex gap-2">
                            <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-black border border-white/20 rounded px-3 py-2 text-white text-xs focus:border-brand-primary outline-none" placeholder="https://..." />
                        </div>
                    )}
                    {activeTab === 'upload' && (
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/20 rounded p-4 text-center cursor-pointer hover:bg-white/5 transition-colors">
                            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Clique para selecionar um arquivo</span>
                        </div>
                    )}
                    {activeTab === 'ai' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-xs font-bold">Gerador de Imagens com IA</span>
                            </div>

                            {previewUrl ? (
                                <div className="space-y-3 animate-in fade-in zoom-in duration-200">
                                    <div className="relative aspect-video rounded-lg overflow-hidden border border-white/20 group">
                                        <img key={previewUrl} src={previewUrl} className="w-full h-full object-cover" alt="AI Preview" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-white text-xs underline">Ver Original</a>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPreviewUrl(null)}
                                            className="flex-1 py-2 px-3 bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 rounded text-xs font-bold transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => { onChange(previewUrl); setPreviewUrl(null); setAiPrompt(''); }}
                                            className="flex-1 py-2 px-3 bg-purple-500 text-white hover:bg-purple-600 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={14} /> Usar Imagem
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Descreva a imagem que deseja gerar... Ex: Uma ilustração moderna de estudantes aprendendo com tecnologia"
                                        className="w-full bg-black border border-white/20 rounded px-3 py-2 text-white text-xs focus:border-brand-primary outline-none resize-none"
                                        rows={3}
                                    />
                                    <button
                                        onClick={handleAIGenerate}
                                        disabled={isGeneratingAI || !aiPrompt.trim()}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded text-xs flex items-center justify-center gap-2 transition-all"
                                    >
                                        {isGeneratingAI ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Gerando...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                Gerar com IA
                                            </>
                                        )}
                                    </button>
                                    {resolutionHint && (
                                        <div className="bg-white/5 border border-white/10 rounded p-2 text-center">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Resolução da Imagem</p>
                                            <p className="text-xs text-brand-primary font-mono font-bold">{resolutionHint}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {value && (
                    <div className="relative group min-h-[200px] border-t border-white/20 bg-black/50 overflow-hidden">
                        <img src={value} className="w-full h-full object-contain max-h-[400px]" alt="Preview" />

                        <div
                            onClick={() => (activeTab === 'upload' || allowedTabs.includes('upload')) ? fileInputRef.current?.click() : null}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                        >
                            <Edit2 size={24} className="mb-2" />
                            <span className="font-bold text-sm">Clique para alterar</span>
                            {resolutionHint && <span className="text-xs text-gray-300 mt-1">{resolutionHint}</span>}
                        </div>

                        <button onClick={(e) => { e.stopPropagation(); onChange(''); }} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:scale-110"><X size={12} /></button>
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
    const handleLink = () => { const url = prompt("Digite a URL:"); if (url) execCmd('createLink', url); };

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
    const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (

        <div ref={setNodeRef} style={style} className="bg-brand-dark border border-white/10 rounded-lg mb-4">
            <div className="p-4 flex items-center gap-3 border-b border-white/5">
                <div className="text-gray-500 cursor-grab p-2 hover:text-white" {...attributes} {...listeners}><GripVertical size={20} /></div>
                <input
                    value={module.title}
                    onChange={(e) => onUpdateModule(e.target.value)}
                    className="flex-1 bg-transparent text-white font-bold text-lg focus:outline-none border-b border-transparent focus:border-brand-primary placeholder:text-gray-600"
                    placeholder="Nome do Módulo"
                />
                <button onClick={() => onDeleteModule(module.id)} className="text-gray-500 hover:text-red-400 p-2"><Trash size={18} /></button>
            </div>
            <div className="p-4 space-y-2">
                <SortableContext items={lessons.map((l: any) => l.id)} strategy={verticalListSortingStrategy}>
                    {lessons.map((lesson: any, lIdx: number) => (
                        <SortableLessonItem key={lesson.id} lesson={lesson} lIdx={lIdx} onEdit={() => onEditLesson(lesson)} onDelete={() => onDeleteLesson(mIdx, lesson.id)} />
                    ))}
                </SortableContext>
                <button onClick={() => onAddLesson(mIdx)} className="w-full py-3 border border-dashed border-white/20 rounded text-xs text-gray-400 hover:text-white mt-4 flex justify-center items-center gap-2 transition-colors hover:border-brand-primary"><Plus size={14} /> Adicionar Aula</button>
            </div>
        </div>
    );
}

function SortableLessonItem({ lesson, onEdit, onDelete }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
    const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-brand-card rounded border border-white/10 group hover:border-white/30 transition-colors">
            <div className="text-gray-600 cursor-grab p-1 hover:text-white" {...attributes} {...listeners}><GripVertical size={16} /></div>
            <div className="flex-1 text-sm text-gray-200 font-medium">{lesson.title}</div>
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="text-blue-400 hover:text-blue-300 p-2"><Edit2 size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-gray-500 hover:text-red-400 p-2"><Trash size={16} /></button>
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

    return (
        <div className="bg-brand-card min-h-screen pb-20">
            {confirmModal && <ConfirmDialog {...confirmModal} onCancel={() => setConfirmModal(null)} />}
            <div className="bg-brand-dark/50 border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
                    <h2 className="text-lg font-bold text-white">{formData.title}</h2>
                </div>
                <button
                    disabled={isSaving}
                    onClick={() => onSave(formData)}
                    className="px-6 py-2 bg-brand-primary text-brand-dark font-bold text-sm rounded flex items-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={16} /> Salvar
                        </>
                    )}
                </button>
            </div>
            <div className="max-w-4xl mx-auto p-8 space-y-6">
                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded-xl px-4 py-3 text-white text-xl font-bold mb-2 placeholder:text-gray-600" placeholder="Título do Curso" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImagePicker label="Imagem de Capa (Quadrada)" value={formData.coverImage} onChange={val => setFormData({ ...formData, coverImage: val })} resolutionHint="1:1 - ex: 500x500px" allowedTabs={['upload', 'link', 'ai']} />
                    <ImagePicker label="Banner Original (Wide)" value={formData.bannerImage} onChange={val => setFormData({ ...formData, bannerImage: val })} resolutionHint="16:9 - ex: 1920x1080px" allowedTabs={['upload', 'link', 'ai']} />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descrição do Curso</label>
                    <RichTextEditor value={formData.description} onChange={val => setFormData({ ...formData, description: val })} />
                </div>

                <div className="border-t border-white/10 pt-6"></div>

                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Layers size={20} /> Estrutura do Curso</h3>
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
                <button onClick={addModule} className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-gray-400 font-bold mt-4 hover:border-brand-primary hover:text-white transition-colors flex flex-col items-center gap-2"><Plus size={24} /> Adicionar Novo Módulo</button>
            </div>
            {editingLesson && <LessonEditorModal isOpen={true} lesson={editingLesson.lesson} isNew={!formData.modules[editingLesson.moduleIndex].lessons.find(l => l.id === editingLesson.lesson.id)} onClose={() => setEditingLesson(null)} onSave={saveLesson} />}
        </div>
    );
};

export const HomeView: React.FC<{ courses: Course[], onCourseClick: (id: string) => void, searchQuery: string }> = ({ courses, onCourseClick, searchQuery }) => {
    const [blocks, setBlocks] = useState<PageBlock[]>([]);
    useEffect(() => { LayoutService.getBlocks().then(setBlocks); }, []);
    const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="pb-20">
            {blocks.length === 0 && (
                <div className="px-4 lg:px-8 max-w-7xl mx-auto pt-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Cursos Disponíveis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCourses.map(course => (
                            <div key={course.id} onClick={() => onCourseClick(course.id)} className="bg-brand-card rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-brand-primary/30 transition-all">
                                <div className="relative aspect-video"><img src={course.coverImage} className="w-full h-full object-cover" /></div>
                                <div className="p-4"><h3 className="font-bold text-white">{course.title}</h3></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {blocks.map(block => (
                <div key={block.id}>
                    {block.type === 'hero_banner' && (
                        <div className="relative h-[500px] w-full flex items-center justify-center overflow-hidden mb-8 group">
                            <img src={block.content.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                            <div className="relative z-10 text-center max-w-4xl px-4">
                                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{block.content.title}</h1>
                                <p className="text-xl text-gray-200 mb-8">{block.content.description}</p>
                                {block.content.showCta && <button className="bg-brand-primary text-brand-dark px-8 py-3 rounded-full font-bold text-lg hover:brightness-110">{block.content.ctaText}</button>}
                            </div>
                        </div>
                    )}
                    {block.type === 'content_list' && (
                        <div className="px-4 lg:px-8 max-w-7xl mx-auto mb-12">
                            <h2 className="text-2xl font-bold text-white mb-6">{block.content.title}</h2>
                            <div className={`grid gap-6 ${block.content.displayStyle === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'flex overflow-x-auto pb-4 snap-x'}`}>
                                {filteredCourses.map(course => (
                                    <div key={course.id} onClick={() => onCourseClick(course.id)} className={`bg-brand-card rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-brand-primary/30 transition-all ${block.content.displayStyle === 'grid' ? '' : 'min-w-[300px] snap-center'}`}>
                                        <div className="relative aspect-video"><img src={course.coverImage} className="w-full h-full object-cover" /></div>
                                        <div className="p-4"><h3 className="font-bold text-white">{course.title}</h3></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export const CourseDetailView: React.FC<{ course: Course, onBack: () => void, onLessonSelect: (id: string) => void }> = ({ course, onBack, onLessonSelect }) => {
    return (
        <div className="pb-20">
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <img src={course.bannerImage} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
                <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full"><ArrowLeft size={20} /></button>
                <div className="absolute bottom-0 left-0 w-full p-8 flex items-end gap-8">
                    <img src={course.coverImage} className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-xl border-4 border-brand-dark shadow-2xl" />
                    <div className="mb-2"><h1 className="text-3xl font-bold text-white">{course.title}</h1><div dangerouslySetInnerHTML={{ __html: course.description }} className="text-gray-300 line-clamp-2"></div></div>
                </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 mt-8 space-y-4">
                {course.modules.map((module, idx) => (
                    <div key={module.id} className="bg-brand-card border border-white/5 rounded-xl overflow-hidden">
                        <div className="p-4 bg-white/5 border-b border-white/5"><h3 className="font-bold text-white">{module.title}</h3></div>
                        {module.lessons.map(lesson => (
                            <button key={lesson.id} onClick={() => onLessonSelect(lesson.id)} className="w-full p-4 flex items-center gap-4 hover:bg-white/5 text-left border-b border-white/5">
                                <Play size={16} className="text-gray-500" />
                                <div className="flex-1 text-gray-200">{lesson.title}</div>
                            </button>
                        ))}
                    </div>
                ))}
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
        if (user && user.id && lessonId) {
            const progress = ProgressService.getProgress(user.id);
            setIsCompleted(!!progress[lessonId]);
        }
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

                            <div dangerouslySetInnerHTML={{ __html: currentLesson.description }} className="prose prose-invert prose-lg text-gray-300 mb-8 max-w-none"></div>

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

                            <div className="prose prose-invert prose-xl max-w-none mb-12" dangerouslySetInnerHTML={{ __html: currentLesson.textContent || '' }}></div>

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

            {/* Sidebar */}
            <div className="w-full lg:w-96 bg-brand-card border-l border-white/10 flex flex-col h-[400px] lg:h-full overflow-hidden shrink-0">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-brand-card z-10">
                    <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-bold"><ArrowLeft size={16} /> Voltar</button>
                    <div className="text-xs text-gray-500 font-bold uppercase">{Math.round((flatLessons.filter(l => ProgressService.getProgress(user?.id || '')[l.id]).length / flatLessons.length) * 100)}% Concluído</div>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {course.modules.map((module, idx) => (
                        <div key={module.id} className="border-b border-white/5 last:border-0">
                            <div className="px-5 py-3 bg-white/5 text-xs font-bold text-gray-400 uppercase flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
                                {module.title}
                                <span className="text-[10px] bg-black/30 px-2 py-1 rounded">{module.lessons.length} aulas</span>
                            </div>
                            <div className="divide-y divide-white/5">
                                {module.lessons.map(lesson => {
                                    const isCompletedLesson = user ? !!ProgressService.getProgress(user.id)[lesson.id] : false;
                                    const isActive = lesson.id === lessonId;
                                    return (
                                        <button
                                            key={lesson.id}
                                            onClick={() => onLessonChange(lesson.id)}
                                            className={`w-full text-left p-4 flex items-start gap-3 transition-colors hover:bg-white/5 ${isActive ? 'bg-brand-primary/5 border-l-4 border-brand-primary pl-3' : 'border-l-4 border-transparent pl-3'}`}
                                        >
                                            <div className={`mt-1 ${isCompletedLesson ? 'text-green-500' : (isActive ? 'text-brand-primary' : 'text-gray-600')}`}>
                                                {isCompletedLesson ? <CheckCircle size={16} className="fill-green-500/10" /> : (lesson.type === 'video' ? <Play size={16} className={isActive ? 'fill-brand-primary' : ''} /> : <FileText size={16} />)}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`text-sm font-medium leading-snug ${isActive ? 'text-white' : 'text-gray-400'}`}>{lesson.title}</div>
                                                <div className="text-xs text-gray-600 mt-1">{lesson.duration ? `${lesson.duration} min` : 'Vídeo'}</div>
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-dark bg-grid relative overflow-hidden">
            {/* Grid pattern já está aplicado via bg-grid */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>

            <div className="relative z-10 p-8 bg-brand-card/50 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="text-center mb-6">
                    <img src="https://i.imgur.com/FIJkEbs.png" className="h-32 mx-auto mb-2" alt="Logo" />
                    <h1 className="text-2xl font-bold text-white">
                        {isForgot ? 'Recuperar Senha' : (isLogin ? 'Bem-vindo de volta' : 'Criar Conta')}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {isForgot ? 'Digite seu email para receber um link de redefinição' : (isLogin ? 'Acesse sua conta para continuar' : 'Comece sua jornada de aprendizado')}
                    </p>
                </div>

                {!isForgot && (
                    <div className="flex bg-brand-dark p-1 rounded-lg mb-6 border border-white/10">
                        <button onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }} className={`flex-1 py-2 text-sm font-bold rounded transition-colors ${isLogin ? 'bg-brand-primary text-brand-dark shadow-lg' : 'text-gray-400 hover:text-white'}`}>Entrar</button>
                        <button onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }} className={`flex-1 py-2 text-sm font-bold rounded transition-colors ${!isLogin ? 'bg-brand-primary text-brand-dark shadow-lg' : 'text-gray-400 hover:text-white'}`}>Cadastrar</button>
                    </div>
                )}

                <div className="space-y-4">
                    {error && <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm text-center">{error}</div>}
                    {successMsg && <div className="p-3 bg-green-500/20 border border-green-500 rounded text-green-200 text-sm text-center">{successMsg}</div>}

                    {!isLogin && !isForgot && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome Completo</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleAuth()}
                                    placeholder="Seu Nome"
                                    className="w-full bg-brand-dark border border-white/10 rounded-lg py-3 pl-10 text-white focus:border-brand-primary outline-none transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleAuth()}
                                placeholder="seu@email.com"
                                className="w-full bg-brand-dark border border-white/10 rounded-lg py-3 pl-10 text-white focus:border-brand-primary outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {!isForgot && (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Senha</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleAuth()}
                                    placeholder="••••••••"
                                    className="w-full bg-brand-dark border border-white/10 rounded-lg py-3 pl-10 text-white focus:border-brand-primary outline-none transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    <motion.button
                        whileTap={buttonTap}
                        onClick={handleAuth}
                        disabled={loading}
                        className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-brand-primary/20 flex justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isForgot ? 'Enviar Link' : (isLogin ? 'Entrar na Plataforma' : 'Criar Conta Grátis'))}
                    </motion.button>
                </div>

                <div className="mt-6 text-center space-y-2">
                    {isForgot ? (
                        <button onClick={toggleForgot} className="text-xs text-gray-400 hover:text-white transition-colors">Voltar ao Login</button>
                    ) : (
                        isLogin && <button onClick={toggleForgot} className="text-xs text-gray-400 hover:text-white transition-colors">Esqueceu sua senha?</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const SortablePageBlock = ({ block, openBlockId, setOpenBlockId, removeBlock, updateBlock }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
    const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div ref={setNodeRef} style={style} className="bg-brand-card border border-white/10 rounded-xl overflow-hidden mb-4">
            <div className="p-4 flex items-center gap-4 bg-white/5 border-b border-white/5">
                <div className="text-gray-500 cursor-grab p-2 hover:text-white" {...attributes} {...listeners}>
                    <GripVertical size={20} />
                </div>
                <div className="p-2 bg-brand-dark rounded text-gray-400">
                    {block.type === 'hero_banner' ? <ImageIcon size={20} /> : <ListIcon size={20} />}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-white">{block.content.title || 'Sem título'}</h3>
                    <p className="text-xs text-gray-400 uppercase">{block.type === 'hero_banner' ? 'Banner Principal' : 'Vitrine de Cursos'}</p>
                </div>
                <button onClick={() => setOpenBlockId(openBlockId === block.id ? null : block.id)} className="px-4 py-2 bg-white/5 rounded text-sm font-bold hover:bg-white/10 text-white transition-colors">
                    {openBlockId === block.id ? 'Fechar' : 'Editar'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="p-2 text-gray-500 hover:text-red-400 transition-colors"><Trash size={18} /></button>
            </div>

            {openBlockId === block.id && (
                <div className="p-6 border-t border-white/5 animate-in slide-in-from-top-2 bg-black/20">
                    {block.type === 'hero_banner' && (
                        <div className="space-y-4">
                            <input value={block.content.title} onChange={e => updateBlock(block.id, { title: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded px-4 py-2 text-white" placeholder="Título do Banner" />
                            <textarea value={block.content.description} onChange={e => updateBlock(block.id, { description: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded px-4 py-2 text-white h-24" placeholder="Descrição do Banner"></textarea>
                            <ImagePicker label="Imagem de Fundo" value={block.content.imageUrl || ''} onChange={val => updateBlock(block.id, { imageUrl: val })} allowedTabs={['upload', 'link', 'ai']} />

                            <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="font-bold text-white text-sm">Botão de Ação (CTA)</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={block.content.showCta} onChange={e => updateBlock(block.id, { showCta: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                    </label>
                                </div>

                                {block.content.showCta && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                        <input value={block.content.ctaText} onChange={e => updateBlock(block.id, { ctaText: e.target.value })} className="bg-brand-dark border border-white/20 rounded px-4 py-2 text-white" placeholder="Texto do Botão" />
                                        <input value={block.content.ctaLink || ''} onChange={e => updateBlock(block.id, { ctaLink: e.target.value })} className="bg-brand-dark border border-white/20 rounded px-4 py-2 text-white font-mono text-sm" placeholder="https://..." />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {block.type === 'content_list' && (
                        <div className="space-y-4">
                            <input value={block.content.title} onChange={e => updateBlock(block.id, { title: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded px-4 py-2 text-white" placeholder="Título da Seção (ex: Cursos Recentes)" />
                            <div className="grid grid-cols-2 gap-4">
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

                            {/* Specific Courses Selector */}
                            {block.content.sourceType === 'specific_courses' && (
                                <CourseSelector
                                    selectedIds={block.content.selectedIds || []}
                                    onChange={(ids) => updateBlock(block.id, { selectedIds: ids })}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const PageBuilder: React.FC = () => {
    const [blocks, setBlocks] = useState<PageBlock[]>([]);
    const [openBlockId, setOpenBlockId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    // Load initial data
    useEffect(() => {
        LayoutService.getBlocks().then(setBlocks);
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
                title: 'Novo Banner',
                description: 'Descrição do banner...',
                imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2000',
                showCta: true,
                ctaText: 'Saiba Mais'
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
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
            {confirmModal && <ConfirmDialog {...confirmModal} onCancel={() => setConfirmModal(null)} />}
            {/* Left: Immediate Preview */}
            <div className="flex-1 bg-black relative overflow-y-auto custom-scrollbar">
                <div className="w-full max-w-full mx-auto min-h-full pb-20 pt-8 px-4 lg:px-8">
                    <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded text-xs text-gray-400 font-mono uppercase border border-white/10 pointer-events-none z-10">Live Preview</div>

                    {blocks.length === 0 && (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Adicione seções no painel à direita para começar.</p>
                        </div>
                    )}

                    {blocks.map(block => (
                        <div
                            key={block.id}
                            className={`relative group border-2 transition-all cursor-pointer ${openBlockId === block.id ? 'border-brand-primary' : 'border-transparent hover:border-white/20'}`}
                            onClick={() => setOpenBlockId(block.id)}
                        >
                            {/* Edit Overlay on Hover */}
                            <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 flex items-center justify-center">
                                <span className="text-brand-primary font-bold text-sm bg-black/80 px-3 py-1 rounded border border-brand-primary/50">Clique para Editar</span>
                            </div>

                            {block.type === 'hero_banner' ? (
                                <div className="relative h-[300px] md:h-[400px] w-full flex items-center justify-center overflow-hidden">
                                    <img src={block.content.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                    <div className="relative z-10 text-center max-w-4xl px-4">
                                        <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">{block.content.title}</h1>
                                        <p className="text-base md:text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{block.content.description}</p>
                                        {block.content.showCta && <button className="bg-brand-primary text-brand-dark px-6 md:px-8 py-2 md:py-3 rounded-full font-bold text-base md:text-lg">{block.content.ctaText}</button>}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 md:py-12">
                                    <h2 className="text-xl md:text-2xl font-bold text-white mb-6">{block.content.title}</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="bg-brand-card aspect-video rounded-lg border border-white/10 flex items-center justify-center text-gray-600">
                                                <span className="text-xs uppercase font-bold">Preview do Curso</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Tools & Sortable List */}
            <div className="w-full md:w-96 lg:w-[420px] xl:w-[480px] bg-brand-card border-l border-white/10 flex flex-col h-full z-30 shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-brand-card sticky top-0 z-20">
                    <h2 className="font-bold text-white text-sm md:text-base">Layout</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 hidden md:inline-block">
                            {isSaving ? <span className="flex items-center gap-1 text-yellow-500 font-mono"><Loader2 size={10} className="animate-spin" /> Salvando...</span> : (lastSavedTime ? <span className="text-green-500/50 font-mono">Salvo às {lastSavedTime.toLocaleTimeString()}</span> : '')}
                        </span>
                        <button id="save-layout-btn" onClick={handleSave} disabled={isSaving} className="bg-brand-primary text-brand-dark p-2 rounded text-xs font-bold hover:brightness-110 flex items-center gap-2 disabled:opacity-50">
                            <Save size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 custom-scrollbar">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3">
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

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                        <button onClick={() => addBlock('hero_banner')} className="p-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-brand-primary flex flex-col items-center gap-2 transition-colors text-xs text-center">
                            <ImageIcon size={20} />
                            <span className="font-bold">Banner</span>
                        </button>
                        <button onClick={() => addBlock('content_list')} className="p-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-brand-primary flex flex-col items-center gap-2 transition-colors text-xs text-center">
                            <ListIcon size={20} />
                            <span className="font-bold">Lista de Cursos</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Builder: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<'courses' | 'pages'>('pages'); // Default to Layout

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        CourseService.getAll().then(setCourses);
    }, []);

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

    return (
        <div className="p-8 max-w-7xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Construtor</h1>
                    <div className="flex bg-brand-light/5 p-1 rounded-lg inline-flex">
                        <button onClick={() => setActiveTab('pages')} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === 'pages' ? 'bg-brand-primary text-brand-dark' : 'text-gray-400 hover:text-white'}`}>Layout</button>
                        <button onClick={() => setActiveTab('courses')} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === 'courses' ? 'bg-brand-primary text-brand-dark' : 'text-gray-400 hover:text-white'}`}>Cursos</button>
                    </div>
                </div>
                {activeTab === 'courses' && (
                    <button
                        onClick={() => setEditingCourse({
                            id: `temp-${Date.now()}`,
                            title: 'Novo Curso',
                            description: 'Descrição do curso...',
                            coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000',
                            bannerImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2000',
                            author: 'Admin',
                            modules: [],
                            totalDuration: 0,
                            progress: 0,
                            tags: []
                        })}
                        className="bg-brand-primary text-brand-dark px-4 py-2 rounded font-bold flex items-center gap-2 hover:brightness-110"
                    >
                        <Plus size={18} /> Novo Curso
                    </button>
                )}
            </div>

            {activeTab === 'pages' ? <PageBuilder /> : (
                <div className="grid gap-4">
                    {courses.length === 0 && <div className="text-gray-400 text-center py-10">Nenhum curso encontrado. Crie o primeiro!</div>}
                    {courses.map(c => (
                        <div key={c.id} className="bg-brand-card p-6 rounded-xl border border-white/10 flex justify-between items-center group hover:border-brand-primary/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <img src={c.coverImage} className="w-16 h-16 rounded object-cover" />
                                <div>
                                    <h3 className="font-bold text-white text-lg">{c.title}</h3>
                                    <p className="text-sm text-gray-400">{c.modules.length} módulos • {c.modules.reduce((acc, m) => acc + m.lessons.length, 0)} aulas</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingCourse(c)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white font-medium flex items-center gap-2 transition-colors">
                                    <Edit2 size={16} /> Editar
                                </button>
                                <button
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={async (e) => {
                                        e.stopPropagation(); // Prevent opening edit on bg click
                                        console.log('🗑️ Delete course request:', c.id);
                                        if (confirm('Tem certeza que deseja excluir este curso?')) {
                                            try {
                                                const id = c.id;
                                                // Optimistic Update
                                                setCourses(prev => prev.filter(course => course.id !== id));
                                                await CourseService.remove(id);
                                                // Sync
                                                const updated = await CourseService.getAll();
                                                setCourses(updated);
                                            } catch (err: any) {
                                                console.error('Delete error:', err);
                                                alert('Erro ao excluir curso: ' + err.message);
                                            }
                                        }
                                    }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                                    <Trash size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const Analytics: React.FC = () => {
    // Mock Data for Visualization
    const enrollmentData = [
        { name: 'Jan', students: 45 }, { name: 'Fev', students: 52 }, { name: 'Mar', students: 48 },
        { name: 'Abr', students: 61 }, { name: 'Mai', students: 55 }, { name: 'Jun', students: 67 },
    ];

    const completionData = [
        { name: 'Concluído', value: 400, color: '#00D766' },
        { name: 'Em andamento', value: 300, color: '#3B82F6' },
        { name: 'Não iniciado', value: 100, color: '#6B7280' },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-8">Analytics</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-brand-card p-6 rounded-xl border border-white/10">
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Total de Alunos</h3>
                    <div className="text-3xl font-bold text-white">1,248</div>
                    <div className="text-green-500 text-xs mt-1 flex items-center gap-1"><ArrowUp size={12} /> +12% esse mês</div>
                </div>
                <div className="bg-brand-card p-6 rounded-xl border border-white/10">
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Taxa de Conclusão</h3>
                    <div className="text-3xl font-bold text-white">68%</div>
                    <div className="text-green-500 text-xs mt-1 flex items-center gap-1"><ArrowUp size={12} /> +5% esse mês</div>
                </div>
                <div className="bg-brand-card p-6 rounded-xl border border-white/10">
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Tempo Médio</h3>
                    <div className="text-3xl font-bold text-white">12h 30m</div>
                    <div className="text-gray-500 text-xs mt-1">por curso</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-brand-card p-6 rounded-xl border border-white/10 h-80">
                    <h3 className="text-white font-bold mb-4">Novos Alunos (Semestral)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={enrollmentData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1E1E24', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ fill: '#ffffff10' }}
                            />
                            <Bar dataKey="students" fill="#00D766" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-brand-card p-6 rounded-xl border border-white/10 h-80">
                    <h3 className="text-white font-bold mb-4">Status dos Cursos</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie
                                data={completionData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {completionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1E1E24', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                            <Legend />
                        </RePieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export const UserPanel: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Add User Form State
    const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.STUDENT, phone: '' });
    const [isadding, setIsAdding] = useState(false);

    useEffect(() => {
        UserService.getUsers().then(u => {
            setUsers(u);
            setLoading(false);
        });
    }, []);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(filter.toLowerCase()) ||
        u.email.toLowerCase().includes(filter.toLowerCase()) ||
        (u.phone && u.phone.includes(filter))
    );

    const handleAddUser = async () => {
        setIsAdding(true);
        try {
            await AuthService.createUser(newUser.name, newUser.email, 'mudar123', newUser.role, newUser.phone); // Default password for manual creation
            const updatedUsers = await UserService.getUsers();
            setUsers(updatedUsers);
            setIsAddModalOpen(false);
            setNewUser({ name: '', email: '', role: UserRole.STUDENT, phone: '' });
            alert('Usuário criado com sucesso! Senha padrão: mudar123');
        } catch (e: any) {
            alert('Erro ao criar usuário: ' + e.message);
        } finally {
            setIsAdding(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin text-brand-primary" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Usuários</h1>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                        <input
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            placeholder="Buscar por nome, email ou telefone..."
                            className="bg-brand-card border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-brand-primary outline-none w-64"
                        />
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-brand-primary text-brand-dark px-4 py-2 rounded font-bold text-sm flex items-center gap-2 hover:brightness-110">
                        <Plus size={16} /> Adicionar Usuário
                    </button>
                    <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-bold text-sm">Exportar CSV</button>
                </div>
            </div>

            <div className="bg-brand-card rounded-xl overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-black/20 text-gray-200 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Telefone</th>
                                <th className="p-4">Função</th>
                                <th className="p-4">Data Cadastro</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" />
                                        <span className="text-white font-medium">{u.name}</span>
                                    </td>
                                    <td className="p-4">{u.email}</td>
                                    <td className="p-4 font-mono text-xs">{u.phone || '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${u.role === 'ADMIN' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' : (u.role === 'MODERATOR' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-gray-500/30 text-gray-400 bg-gray-500/10')}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-mono">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                                    <td className="p-4">
                                        <span className="flex items-center gap-1.5 text-green-400 text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Ativo
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex gap-2 justify-end">
                                        <button className="text-gray-400 hover:text-white p-1" title="Mais opções"><MoreHorizontal size={16} /></button>
                                        <button onClick={() => { if (window.confirm(`Tem certeza que deseja excluir o usuário ${u.name}?`)) alert('Funcionalidade de exclusão em desenvolvimento'); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir"><Trash size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-brand-card w-full max-w-md rounded-xl border border-white/20 p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">Adicionar Usuário</h3>
                        <div className="space-y-3">
                            <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded px-4 py-2 text-white" placeholder="Nome Completo" />
                            <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded px-4 py-2 text-white" placeholder="Email" />
                            <input value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} className="w-full bg-brand-dark border border-white/20 rounded px-4 py-2 text-white" placeholder="Telefone" />
                            <VisualSelector
                                label="Função"
                                value={newUser.role}
                                onChange={val => setNewUser({ ...newUser, role: val })}
                                options={[{ value: UserRole.STUDENT, label: 'Aluno' }, { value: UserRole.MODERATOR, label: 'Moderador' }, { value: UserRole.ADMIN, label: 'Admin' }]}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white px-4 py-2 text-sm font-bold">Cancelar</button>
                            <button onClick={handleAddUser} disabled={isadding} className="bg-brand-primary text-brand-dark px-4 py-2 rounded text-sm font-bold hover:brightness-110 disabled:opacity-50">
                                {isadding ? 'Criando...' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

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
    // Mock
    const comments: Comment[] = [
        { id: '1', userId: 'u1', userName: 'João Silva', userAvatar: DEFAULT_AVATAR, lessonId: 'l1', text: 'Excelente aula! Muito didático.', timestamp: new Date().toISOString(), status: 'pending', likes: 0, likedBy: [] },
        { id: '2', userId: 'u2', userName: 'Maria Souza', userAvatar: DEFAULT_AVATAR, lessonId: 'l1', text: 'Fiquei com dúvida no minuto 5:30.', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'pending', likes: 0, likedBy: [] }
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-8">Moderação</h1>

            <div className="bg-brand-card border border-white/10 rounded-xl overflow-hidden">
                <div className="flex border-b border-white/10">
                    <button className="px-6 py-4 text-sm font-bold text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5">Pendentes (2)</button>
                    <button className="px-6 py-4 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5">Aprovados</button>
                    <button className="px-6 py-4 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5">Rejeitados</button>
                </div>

                <div className="divide-y divide-white/5">
                    {comments.map(c => (
                        <div key={c.id} className="p-6 flex gap-4">
                            <img src={c.userAvatar} className="w-10 h-10 rounded-full" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-white">{c.userName}</h4>
                                        <span className="text-xs text-gray-500">Aula: Introdução ao Marketing</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{new Date(c.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-300 text-sm bg-black/20 p-3 rounded mb-4">"{c.text}"</p>
                                <div className="flex gap-3">
                                    <button className="px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded text-xs font-bold flex items-center gap-2">
                                        <CheckCircle size={14} /> Aprovar
                                    </button>
                                    <button className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded text-xs font-bold flex items-center gap-2">
                                        <XCircle size={14} /> Rejeitar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
