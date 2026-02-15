import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, GitBranch, ChevronDown } from 'lucide-react';
import { getModuleIcon } from './CourseEditorUtils';

// --- Sub-component: Actions Menu ---
const ModuleActions = ({ module, onAction, isRoot }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div className="module-actions-wrapper">
            <button 
                className="module-actions-btn" 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                title="Options"
            >
                <GitBranch size={16} />
            </button>
            {isMenuOpen && (
                <div ref={menuRef} className="module-actions-menu">
                    <button onClick={(e) => { e.stopPropagation(); onAction('add', module.id); setIsMenuOpen(false); }}>
                        <Plus size={14} className="text-green-600" /> Add Sub-Module
                    </button>
                    {!isRoot && (
                        <button onClick={(e) => { e.stopPropagation(); onAction('delete', module.id); setIsMenuOpen(false); }}>
                            <Trash2 size={14} className="text-red-600" /> Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Sub-component: Tree Item ---
const ModuleTreeItem = ({ modules, moduleId, onSelect, onAction, selectedId, rootId }) => {
    const module = modules[moduleId];
    if (!module) return null;

    // FIX: Get the component from the util
    const ModuleIcon = getModuleIcon(module.type);
    
    const isSelected = module.id === selectedId;
    const hasChildren = module.children && module.children.length > 0;
    const isRoot = module.id === rootId;

    return (
        <li>
            <div 
                className={`module-item ${isSelected ? 'active' : ''}`}
                onClick={() => onSelect(module.id)}
            >
                <div className="module-title-wrapper">
                    {hasChildren ? <ChevronDown size={14} /> : <div style={{width:14}} />}
                    {/* Render the icon component safely */}
                    {/* <ModuleIcon size={16} className="module-icon-type" /> */}
                    <span className="module-title-text">{module.title}</span>
                </div>
                
                <ModuleActions 
                    module={module} 
                    onAction={onAction} 
                    isRoot={isRoot} 
                />
            </div>
            
            {hasChildren && (
                <ul className="module-children-list">
                    {module.children.map(childId => (
                        <ModuleTreeItem 
                            key={childId}
                            modules={modules}
                            moduleId={childId}
                            onSelect={onSelect}
                            onAction={onAction}
                            selectedId={selectedId}
                            rootId={rootId}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

// --- Main Tree Component ---
const ModuleTree = ({ modules, rootId, selectedId, onSelect, onAction }) => {
    return (
        <ul className="module-tree-list">
            <ModuleTreeItem 
                modules={modules}
                moduleId={rootId}
                onSelect={onSelect}
                onAction={onAction}
                selectedId={selectedId}
                rootId={rootId}
            />
        </ul>
    );
};

export default ModuleTree;