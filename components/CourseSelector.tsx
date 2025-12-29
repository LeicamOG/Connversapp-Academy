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

const SortableCourseItem: React.FC<{ course: Course, onRemove: () => void }> = ({ course, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: course.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-brand-dark border border-white/10 p-3 rounded-lg mb-2">
            <div className="text-gray-500 cursor-grab hover:text-white" {...attributes} {...listeners}>
                <GripVertical size={16} />
            </div>
            <img src={course.coverImage} className="w-10 h-10 object-cover rounded" />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{course.title}</div>
            </div>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove();
                }}
                className="text-gray-500 hover:text-red-400 p-1 hover:bg-white/10 rounded transition-colors"
                title="Remover curso"
            >
                <X size={16} />
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
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cursos Selecionados (Arraste para ordenar)</label>
                <div className="bg-black/20 rounded-lg p-2 min-h-[50px]">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
                            {selectedCourses.map(course => (
                                <SortableCourseItem key={course.id} course={course} onRemove={() => { if (window.confirm('Tem certeza que deseja remover este curso?')) toggleSelection(course.id); }} />
                            ))}
                        </SortableContext>
                    </DndContext>
                    {selectedCourses.length === 0 && <div className="text-xs text-center text-gray-600 py-4">Nenhum curso selecionado</div>}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Adicionar Cursos</label>
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar curso..."
                    className="w-full bg-brand-dark border border-white/20 rounded px-3 py-2 text-xs text-white mb-2"
                />
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {availableCourses.map(course => (
                        <div key={course.id} onClick={() => toggleSelection(course.id)} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer transition-colors group">
                            <img src={course.coverImage} className="w-8 h-8 object-cover rounded" />
                            <span className="text-xs text-gray-300 group-hover:text-white flex-1 truncate">{course.title}</span>
                            <Plus size={14} className="text-brand-primary opacity-0 group-hover:opacity-100" />
                        </div>
                    ))}
                    {availableCourses.length === 0 && <div className="text-xs text-center text-gray-600 py-2">Nenhum curso disponível</div>}
                </div>
            </div>
        </div>
    );
};
