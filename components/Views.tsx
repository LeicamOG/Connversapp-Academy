
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, CheckCircle, Clock, ArrowLeft, Plus, Edit2, 
  Trash, GripVertical, Loader2, Sparkles, LogIn, Image as ImageIcon, Layout as LayoutIcon, Type as TypeIcon,
  Save, RefreshCw, Palette, UserPlus, MoreHorizontal, UserX, Shield, Video, Layers, ChevronDown, ChevronUp, FileVideo, Youtube, Link as LinkIcon, X, Settings, List, Grid, Search, Filter, MonitorPlay, Upload, Camera, ToggleLeft, ToggleRight, User as UserIcon, ChevronRight, Check, FileText, Paperclip, Bold, Italic, ListOrdered, List as ListIcon, Download, MessageSquare, ThumbsUp, CornerDownRight, ShieldAlert, ArrowUp, ArrowDown, ChevronLeft, Heading1, Heading2, Quote, ShieldCheck, Pencil, AlertTriangle, ExternalLink,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, Strikethrough, Underline, Link2, Send, BookOpen, Webhook, Key, Copy, Eye, XCircle, CheckSquare, AlertCircle, Globe, BarChart2, PieChart, Mail
} from 'lucide-react';
import { Course, Lesson, Module, PageBlock, ThemeConfig, User, UserRole, BlockType, DisplayStyle, AspectRatio, VideoProvider, Attachment, Comment, BlockContent } from '../types';
import { getFirstLesson, CommentService, DEFAULT_AVATAR } from '../services/data';
import { UserService, LayoutService, SettingsService, AuthService, CourseService } from '../services/supabase';
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

// --- AI Setup ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  if (url.trim().startsWith('<iframe')) {
    const srcMatch = url.match(/src="([^"]+)"/);
    return srcMatch ? srcMatch[1] : url;
  }

  return url;
};

// --- Reusable Components ---

const ImagePicker: React.FC<{ label: string; value: string; onChange: (val: string) => void }> = ({ label, value, onChange }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'search' | 'ai' | 'link'>('ai');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    if (!searchQuery) return;
    const mockImages = Array.from({length: 4}).map((_, i) => 
        `https://image.pollinations.ai/prompt/${encodeURIComponent(searchQuery)}?width=800&height=600&nologo=true&seed=${Math.random()}`
    );
    setGeneratedImages(mockImages);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt || !process.env.API_KEY) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: aiPrompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      const newImages: string[] = [];
      if (response.candidates && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                  const base64String = part.inlineData.data;
                  const mimeType = part.inlineData.mimeType || 'image/png';
                  newImages.push(`data:${mimeType};base64,${base64String}`);
              }
          }
      }
      setGeneratedImages(newImages);
    } catch (e) {
      console.error("AI Generation failed", e);
      alert("Erro ao gerar imagem. Verifique a chave de API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { onChange(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{label}</label>
      <div className="bg-brand-dark border border-white/20 rounded-lg overflow-hidden">
         <div className="flex border-b border-white/20 overflow-x-auto">
            <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase whitespace-nowrap transition-colors ${activeTab === 'ai' ? 'bg-brand-primary/20 text-brand-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Sparkles size={12} className="inline mr-1" /> Gerar imagem com IA
            </button>
            <button onClick={() => setActiveTab('search')} className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase transition-colors ${activeTab === 'search' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Busca</button>
            <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase transition-colors ${activeTab === 'upload' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Upload</button>
            <button onClick={() => setActiveTab('link')} className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase transition-colors ${activeTab === 'link' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Link</button>
         </div>

         <div className="p-4">
            {activeTab === 'link' && (
                <div className="flex gap-2">
                  <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-black border border-white/20 rounded px-3 py-2 text-white text-xs focus:border-brand-primary outline-none" placeholder="https://..." />
                </div>
            )}
            {activeTab === 'upload' && (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/20 rounded p-4 text-center cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Clique para selecionar um arquivo</span>
                </div>
            )}
            {activeTab === 'search' && (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="flex-1 bg-black border border-white/20 rounded px-3 py-2 text-white text-xs focus:border-brand-primary outline-none" placeholder="Ex: Escritório moderno, paisagem natural..." />
                        <button onClick={handleSearch} className="px-3 bg-white/10 hover:bg-white/20 rounded text-white"><Search size={16}/></button>
                    </div>
                    {generatedImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {generatedImages.map((url, i) => (
                                <img key={i} src={url} onClick={() => onChange(url)} className="w-full h-24 object-cover rounded cursor-pointer hover:ring-2 hover:ring-brand-primary" />
                            ))}
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'ai' && (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiGenerate()} className="flex-1 bg-black border border-white/20 rounded px-3 py-2 text-white text-xs focus:border-brand-primary outline-none" placeholder="Descreva a imagem que deseja criar..." />
                        <button onClick={handleAiGenerate} disabled={isGenerating} className="px-3 bg-brand-primary hover:brightness-110 disabled:opacity-50 rounded text-brand-dark font-bold">
                            {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                        </button>
                    </div>
                    {generatedImages.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                            {generatedImages.map((url, i) => (
                                <img key={i} src={url} onClick={() => onChange(url)} className="w-full h-32 object-cover rounded cursor-pointer hover:ring-2 hover:ring-brand-primary" />
                            ))}
                        </div>
                    )}
                </div>
            )}
         </div>
         {value && (
             <div className="h-32 bg-cover bg-center border-t border-white/20 relative group">
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" style={{ backgroundImage: `url(${value})` }}></div>
                 <img src={value} className="w-full h-full object-cover" />
                 <button onClick={() => onChange('')} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
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
  const execCmd = (command: string, arg: string = '') => { document.execCommand(command, false, arg); if(editorRef.current) { editorRef.current.focus(); } };
  const preventFocusLoss = (e: React.MouseEvent) => { e.preventDefault(); };
  const handleLink = () => { const url = prompt("Digite a URL:"); if(url) execCmd('createLink', url); };

  return (
    <div className="border border-white/20 rounded-lg overflow-hidden bg-brand-dark flex flex-col h-64">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-white/5 border-b border-white/10 shrink-0">
         <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('undo'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white"><Undo size={14}/></button>
         <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('redo'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white"><Redo size={14}/></button>
         <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('bold'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white"><Bold size={14}/></button>
         <button onMouseDown={(e) => { preventFocusLoss(e); execCmd('italic'); }} className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white"><Italic size={14}/></button>
      </div>
      <div ref={editorRef} className="flex-1 p-4 text-white focus:outline-none prose prose-invert max-w-none text-sm overflow-y-auto" contentEditable onInput={(e) => onChange(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: value }}></div>
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
  return (
    <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-400 uppercase">Materiais</label>
        <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
           <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
           <Paperclip className="mx-auto text-gray-400 mb-2" />
           <p className="text-xs text-gray-500">Clique para anexar</p>
        </div>
    </div>
  );
};

const LessonEditorModal: React.FC<{ isOpen: boolean, lesson: Lesson, isNew: boolean, onClose: () => void, onSave: (l: Lesson) => void }> = ({ isOpen, lesson, isNew, onClose, onSave }) => {
  const [formData, setFormData] = useState<Lesson>(lesson);
  
  useEffect(() => { if(isOpen) setFormData(lesson); }, [isOpen, lesson]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div className="bg-brand-card w-full max-w-4xl rounded-xl shadow-2xl border border-white/20 flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 border-b border-white/20">
             <h3 className="text-xl font-bold text-white">{isNew ? 'Criar Nova Aula' : 'Editar Aula'}</h3>
             <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
             <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-brand-dark border border-white/20 rounded px-4 py-3 text-white text-lg" placeholder="Título da Aula" />
             <input value={formData.videoUrl || ''} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="w-full bg-black border border-white/10 rounded px-4 py-3 text-white font-mono text-sm" placeholder="URL do Vídeo / Iframe" />
             <RichTextEditor value={formData.description || ''} onChange={val => setFormData({...formData, description: val})} />
          </div>
          <div className="p-6 border-t border-white/20 flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-2 text-gray-400 font-bold text-sm">Cancelar</button>
             <button onClick={() => { onSave(formData); onClose(); }} className="px-6 py-2 bg-brand-primary text-brand-dark font-bold text-sm rounded">Salvar</button>
          </div>
       </div>
    </div>
  );
};

function SortableModuleItem({ module, mIdx, onUpdateModule, onDeleteModule, lessons, onAddLesson, onEditLesson, onDeleteLesson, onMoveModule, onMoveLesson }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0 : 1 };
  
  return (
    <div ref={setNodeRef} style={style} className="bg-brand-dark border border-white/10 rounded-lg mb-4">
        <div className="p-4 flex items-center gap-3 border-b border-white/5">
            <div className="text-gray-500 cursor-grab p-2" {...attributes} {...listeners}><GripVertical size={20} /></div>
            <span className="text-white font-bold text-lg flex-1">{module.title}</span>
            <button onClick={() => onDeleteModule(module.id)} className="text-gray-500 hover:text-red-400 p-2"><Trash size={18} /></button>
        </div>
        <div className="p-4 space-y-2">
            <SortableContext items={lessons.map((l: any) => l.id)} strategy={verticalListSortingStrategy}>
                {lessons.map((lesson: any, lIdx: number) => (
                    <SortableLessonItem key={lesson.id} lesson={lesson} lIdx={lIdx} onEdit={() => onEditLesson(lesson)} onDelete={() => onDeleteLesson(mIdx, lesson.id)} onMove={() => {}} />
                ))}
            </SortableContext>
            <button onClick={() => onAddLesson(mIdx)} className="w-full py-3 border border-dashed border-white/20 rounded text-xs text-gray-400 hover:text-white mt-4 flex justify-center items-center gap-2"><Plus size={14} /> Adicionar Aula</button>
        </div>
    </div>
  );
}

function SortableLessonItem({ lesson, onEdit, onDelete }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
    const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0 : 1 };
    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-brand-card rounded border border-white/10 group">
            <div className="text-gray-600 cursor-grab p-1" {...attributes} {...listeners}><GripVertical size={16} /></div>
            <div className="flex-1 text-sm text-gray-200">{lesson.title}</div>
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="text-blue-400 p-2"><Edit2 size={16} /></button>
                <button onClick={onDelete} className="text-gray-500 hover:text-red-400 p-2"><Trash size={16} /></button>
            </div>
        </div>
    );
}

const CourseContentEditor: React.FC<{ course: Course, onBack: () => void, onSave: (c: Course) => void }> = ({ course, onBack, onSave }) => {
    const [formData, setFormData] = useState<Course>(course);
    const [editingLesson, setEditingLesson] = useState<{ lesson: Lesson, moduleIndex: number } | null>(null);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setFormData(prev => {
            const oldIndex = prev.modules.findIndex(m => m.id === active.id);
            if (oldIndex !== -1) {
                 const newIndex = prev.modules.findIndex(m => m.id === over.id);
                 return { ...prev, modules: arrayMove(prev.modules, oldIndex, newIndex) };
            }
            return prev;
        });
    };

    const addModule = () => setFormData({ ...formData, modules: [...formData.modules, { id: `mod-${Date.now()}`, title: 'Novo Módulo', lessons: [] }] });
    const deleteModule = (id: string) => setFormData({ ...formData, modules: formData.modules.filter(m => m.id !== id) });
    const addLesson = (idx: number) => setEditingLesson({ lesson: { id: `less-${Date.now()}`, title: 'Nova Aula', description: '', duration: 0, type: 'video', thumbnail: '', attachments: [], isCompleted: false, progress: 0 }, moduleIndex: idx });
    
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
             <div className="bg-brand-dark/50 border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
                 <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"><ArrowLeft size={20}/></button>
                     <h2 className="text-lg font-bold text-white">{formData.title}</h2>
                 </div>
                 <button onClick={() => onSave(formData)} className="px-6 py-2 bg-brand-primary text-brand-dark font-bold text-sm rounded flex items-center gap-2"><Save size={16}/> Salvar</button>
             </div>
             <div className="max-w-4xl mx-auto p-8">
                 <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-brand-dark border border-white/20 rounded px-4 py-3 text-white mb-6" placeholder="Título do Curso" />
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={formData.modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                        {formData.modules.map((module, idx) => (
                            <SortableModuleItem key={module.id} module={module} mIdx={idx} lessons={module.lessons} onUpdateModule={() => {}} onDeleteModule={deleteModule} onAddLesson={() => addLesson(idx)} onEditLesson={(l: Lesson) => setEditingLesson({ lesson: l, moduleIndex: idx })} onDeleteLesson={() => {}} onMoveModule={() => {}} onMoveLesson={() => {}} />
                        ))}
                    </SortableContext>
                 </DndContext>
                 <button onClick={addModule} className="w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-gray-400 font-bold mt-8 flex flex-col items-center gap-2"><Plus size={24} /> Adicionar Novo Módulo</button>
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
            {blocks.map(block => block.type === 'hero_banner' && (
                <div key={block.id} className="relative h-[500px] w-full flex items-center justify-center overflow-hidden mb-8 group">
                    <img src={block.content.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="relative z-10 text-center max-w-4xl px-4">
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{block.content.title}</h1>
                        <p className="text-xl text-gray-200 mb-8">{block.content.description}</p>
                        {block.content.showCta && <button className="bg-brand-primary text-brand-dark px-8 py-3 rounded-full font-bold text-lg hover:brightness-110">{block.content.ctaText}</button>}
                    </div>
                </div>
            ))}
            <div className="px-4 lg:px-8 max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6">Cursos Disponíveis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCourses.map(course => (
                        <div key={course.id} onClick={() => onCourseClick(course.id)} className="bg-brand-card rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-brand-primary/30 transition-all">
                            <div className="relative aspect-video"><img src={course.coverImage} className="w-full h-full object-cover" /></div>
                            <div className="p-4"><h3 className="font-bold text-white">{course.title}</h3><p className="text-xs text-gray-400">{course.author}</p></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const CourseDetailView: React.FC<{ course: Course, onBack: () => void, onLessonSelect: (id: string) => void }> = ({ course, onBack, onLessonSelect }) => {
    return (
        <div className="pb-20">
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <img src={course.bannerImage} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
                <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full"><ArrowLeft size={20}/></button>
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

export const PlayerView: React.FC<{ course: Course, lessonId: string, onBack: () => void, onLessonChange: (id: string) => void }> = ({ course, lessonId, onBack, onLessonChange }) => {
    let currentLesson: Lesson | undefined;
    for (const m of course.modules) { const found = m.lessons.find(l => l.id === lessonId); if (found) { currentLesson = found; break; } }
    if (!currentLesson) return <div>Lesson not found</div>;
    const embedUrl = convertToEmbedUrl(currentLesson.videoUrl || '', currentLesson.provider || 'embed_url');

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex-1 bg-black flex flex-col overflow-y-auto">
                <div className="w-full bg-black aspect-video max-h-[70vh] flex items-center justify-center relative shadow-2xl">
                    {currentLesson.type === 'video' ? <iframe src={embedUrl} className="w-full h-full" frameBorder="0" allow="autoplay; fullscreen" allowFullScreen></iframe> : <div className="p-8 prose prose-invert" dangerouslySetInnerHTML={{ __html: currentLesson.textContent || '' }}></div>}
                </div>
                <div className="p-8"><h1 className="text-2xl font-bold text-white">{currentLesson.title}</h1><div dangerouslySetInnerHTML={{ __html: currentLesson.description }} className="text-gray-300 mt-4"></div></div>
            </div>
            <div className="w-full lg:w-80 bg-brand-card border-l border-white/10 flex flex-col h-full overflow-y-auto">
                <button onClick={onBack} className="p-4 border-b border-white/10 text-gray-400 hover:text-white flex items-center gap-2"><ArrowLeft size={16}/> Voltar ao Curso</button>
                {course.modules.map((module, idx) => (
                    <div key={module.id}><div className="px-4 py-2 bg-white/5 text-xs font-bold text-gray-400 uppercase">{module.title}</div>
                        {module.lessons.map(lesson => (
                            <button key={lesson.id} onClick={() => onLessonChange(lesson.id)} className={`w-full text-left p-4 border-b border-white/5 ${lesson.id === lessonId ? 'bg-brand-primary/10 text-brand-primary' : 'text-gray-300'}`}>{lesson.title}</button>
                        ))}
                    </div>
                ))}
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
              if (email === 'maciel.eduardof@gmail.com') {
                  try {
                      await AuthService.signIn(email, password);
                  } catch (e) {
                      try {
                          await AuthService.createUser("Eduardo Maciel", email, password, UserRole.ADMIN);
                          await AuthService.signIn(email, password);
                      } catch (createError) {
                          throw e;
                      }
                  }
              } else {
                  await AuthService.signIn(email, password);
              }
              onLogin();
          } else {
              if (!name) throw new Error("Nome é obrigatório");
              const { session } = await AuthService.signUp(name, email, password);
              if (session) {
                  onLogin();
              } else {
                  setSuccessMsg("Conta criada com sucesso! Verifique seu email para confirmar o cadastro antes de fazer login.");
                  setIsLogin(true); // Switch to login view so they can login after verifying
                  setPassword(''); 
              }
          }
      } catch (e: any) {
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
    <div className="min-h-screen flex items-center justify-center bg-brand-dark relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b')] bg-cover bg-center opacity-10"></div>
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
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu Nome" className="w-full bg-brand-dark border border-white/10 rounded-lg py-3 pl-10 text-white focus:border-brand-primary outline-none transition-colors" />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full bg-brand-dark border border-white/10 rounded-lg py-3 pl-10 text-white focus:border-brand-primary outline-none transition-colors" />
                    </div>
                </div>

                {!isForgot && (
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Senha</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-brand-dark border border-white/10 rounded-lg py-3 pl-10 text-white focus:border-brand-primary outline-none transition-colors" />
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

export const Builder: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    CourseService.getAll().then(setCourses);
  }, []);

  const handleSave = async (course: Course) => {
    await CourseService.save(course);
    setEditingCourse(null);
    const updated = await CourseService.getAll();
    setCourses(updated);
  };

  if (editingCourse) {
    return <CourseContentEditor course={editingCourse} onBack={() => setEditingCourse(null)} onSave={handleSave} />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Construtor de Cursos</h1>
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
        </div>
        <div className="grid gap-4">
            {courses.length === 0 && <div className="text-gray-400 text-center py-10">Nenhum curso encontrado. Crie o primeiro!</div>}
            {courses.map(c => (
                <div key={c.id} className="bg-brand-card p-6 rounded-xl border border-white/10 flex justify-between items-center group hover:border-brand-primary/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <img src={c.coverImage} className="w-16 h-16 rounded object-cover" />
                        <div>
                            <h3 className="font-bold text-white text-lg">{c.title}</h3>
                            <p className="text-sm text-gray-400">{c.modules.length} módulos • {c.author}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setEditingCourse(c)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white font-medium flex items-center gap-2 transition-colors">
                            <Edit2 size={16}/> Editar
                        </button>
                         <button onClick={async () => {
                             if(confirm('Tem certeza que deseja excluir?')) {
                                 await CourseService.delete(c.id);
                                 setCourses(await CourseService.getAll());
                             }
                         }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                            <Trash size={16}/>
                        </button>
                    </div>
                </div>
            ))}
        </div>
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
                     <div className="text-green-500 text-xs mt-1 flex items-center gap-1"><ArrowUp size={12}/> +12% esse mês</div>
                 </div>
                 <div className="bg-brand-card p-6 rounded-xl border border-white/10">
                     <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Taxa de Conclusão</h3>
                     <div className="text-3xl font-bold text-white">68%</div>
                     <div className="text-green-500 text-xs mt-1 flex items-center gap-1"><ArrowUp size={12}/> +5% esse mês</div>
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
                                contentStyle={{backgroundColor: '#1E1E24', border: '1px solid #333', borderRadius: '8px'}} 
                                itemStyle={{color: '#fff'}}
                                cursor={{fill: '#ffffff10'}}
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
                            <Tooltip contentStyle={{backgroundColor: '#1E1E24', border: '1px solid #333', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
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

    useEffect(() => { 
        UserService.getUsers().then(u => {
            setUsers(u);
            setLoading(false);
        }); 
    }, []);

    if (loading) return <div className="p-8"><Loader2 className="animate-spin text-brand-primary" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Usuários</h1>
                <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-bold text-sm">Exportar CSV</button>
            </div>
            <div className="bg-brand-card rounded-xl overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-black/20 text-gray-200 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Função</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" />
                                        <span className="text-white font-medium">{u.name}</span>
                                    </td>
                                    <td className="p-4">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${u.role === 'ADMIN' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' : (u.role === 'MODERATOR' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-gray-500/30 text-gray-400 bg-gray-500/10')}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="flex items-center gap-1.5 text-green-400 text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Ativo
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-gray-400 hover:text-white p-1"><MoreHorizontal size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export const UserProfile: React.FC<{ user: User, onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
    const [formData, setFormData] = useState(user);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await UserService.updateUser(formData);
            onUpdate(formData);
        } catch(e) {
            console.error(e);
            alert("Erro ao salvar perfil");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>
            
            <div className="bg-brand-card border border-white/10 rounded-xl p-8 space-y-6">
                <div className="flex items-start gap-6">
                    <div className="relative group">
                         <img src={formData.avatar} className="w-24 h-24 rounded-full object-cover border-2 border-white/10" />
                         <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                             <Camera size={20} className="text-white" />
                         </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome Completo</label>
                            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-brand-dark border border-white/20 rounded-lg px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors" />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Avatar URL</label>
                            <div className="flex gap-2">
                                <input value={formData.avatar} onChange={e => setFormData({...formData, avatar: e.target.value})} className="flex-1 bg-brand-dark border border-white/20 rounded-lg px-4 py-3 text-white focus:border-brand-primary outline-none transition-colors text-sm font-mono" />
                                <button className="px-4 bg-white/5 hover:bg-white/10 rounded-lg text-white"><Sparkles size={18}/></button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email</label>
                    <input value={formData.email} disabled className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed" />
                    <p className="text-xs text-gray-500 mt-2">O email não pode ser alterado.</p>
                </div>

                <div className="pt-6 flex justify-end">
                     <button onClick={handleSave} disabled={isSaving} className="bg-brand-primary text-brand-dark px-8 py-3 rounded-lg font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-2">
                         {isSaving && <Loader2 className="animate-spin" size={18}/>}
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
                                        <CheckCircle size={14}/> Aprovar
                                    </button>
                                    <button className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded text-xs font-bold flex items-center gap-2">
                                        <XCircle size={14}/> Rejeitar
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
    return (
        <div className="p-8 max-w-4xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-8">Integrações & Configurações</h1>
            
            <div className="space-y-6">
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
                        <p className="text-xs text-gray-500 flex items-center gap-1"><ShieldCheck size={12}/> Chave armazenada de forma segura.</p>
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
