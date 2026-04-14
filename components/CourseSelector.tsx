import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { CourseService } from '../services/supabase';
import { Check, GripVertical, Plus, Trash, X } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CourseSelectorProps {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

const SortableCourseItem: React.FC<{ course: Course, index: number, onRemove: () => void }> = ({ course, index, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: course.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 50 : 'auto' };

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center gap-3 bg-brand-surface/50 border rounded-xl p-2.5 mb-2 transition-all ${isDragging ? 'border-brand-primary/40 shadow-neon' : 'border-white/8'}`}>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-gray-600 w-4 text-right">{index + 1}</span>
                <button className="text-gray-600 hover:text-gray-300 cursor-grab active:cursor-grabbing p-0.5 transition-colors" {...attributes} {...listeners}>
                    <GripVertical size={14} />
                </button>
            </div>
            <img src={course.coverImage} className="w-9 h-9 object-cover rounded-lg shrink-0 ring-1 ring-white/10" />
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{course.title}</p>
            </div>
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                title="Remover"
            >
                <X size={13} />
            </button>
        </div>
    );
};

export const CourseSelector: React.FC<CourseSelectorProps> = ({ selectedIds, onChange }) => {
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        CourseService.getAll().then(setAllCourses);
    }, []);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = selectedIds.indexOf(active.id as string);
            const newIndex = selectedIds.indexOf(over.id as string);
            onChange(arrayMove(selectedIds, oldIndex, newIndex));
        }
    };

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(sid => sid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectedCourses = selectedIds.map(id => allCourses.find(c => c.id === id)).filter(Boolean) as Course[];
    const availableCourses = allCourses.filter(c => !selectedIds.includes(c.id) && c.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-4">
            {/* Selected courses (draggable) */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                        Cursos selecionados
                    </label>
                    {selectedCourses.length > 0 && (
                        <span className="text-[10px] font-mono text-gray-600">{selectedCourses.length} curso{selectedCourses.length !== 1 ? 's' : ''} · arraste para reordenar</span>
                    )}
                </div>
                <div className="bg-black/20 rounded-xl p-2 min-h-[52px] border border-white/5">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
                            {selectedCourses.map((course, i) => (
                                <SortableCourseItem
                                    key={course.id}
                                    course={course}
                                    index={i}
                                    onRemove={() => toggleSelection(course.id)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    {selectedCourses.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-5 gap-1">
                            <p className="text-[12px] text-gray-600">Nenhum curso selecionado</p>
                            <p className="text-[10px] text-gray-700">Escolha cursos abaixo</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Available courses */}
            <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">Adicionar cursos</label>
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar curso..."
                    className="w-full bg-brand-surface/60 border border-white/8 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-brand-primary/40 transition-colors mb-2"
                />
                <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5 scrollbar-subtle">
                    {availableCourses.map(course => (
                        <button
                            key={course.id}
                            onClick={() => toggleSelection(course.id)}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group text-left"
                        >
                            <img src={course.coverImage} className="w-9 h-9 object-cover rounded-lg ring-1 ring-white/8 shrink-0" />
                            <span className="text-[13px] text-gray-400 group-hover:text-white flex-1 truncate">{course.title}</span>
                            <div className="w-6 h-6 rounded-lg bg-brand-primary/10 group-hover:bg-brand-primary/20 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                                <Plus size={12} className="text-brand-primary" />
                            </div>
                        </button>
                    ))}
                    {availableCourses.length === 0 && (
                        <p className="text-[12px] text-center text-gray-600 py-3">
                            {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Todos os cursos já foram adicionados'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
