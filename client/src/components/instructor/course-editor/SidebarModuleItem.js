import React from 'react';
import { FaChevronRight, FaChevronDown, FaPlus, FaTrash } from 'react-icons/fa';

const SidebarModuleItem = ({
  module,
  onSelectModule,
  onToggleExpand,
  onAddSubModule,
  onDeleteModule,
  selectedModuleId,
  isExpanded,
  expandedModules
}) => {
  const isActive = module.id === selectedModuleId;
  const subModules = module.subModules || [];
  const hasSubModules = subModules.length > 0;

  // Debug log
  if (!hasSubModules && module.title === "Root Module") {
    console.log(`SidebarModuleItem: Module ${module.title} has no submodules.`, module);
  }

  return (
    <li className="sidebar-module-item">
      <div className={`sidebar-module-title ${isActive ? 'active' : ''}`}>
        <div className="module-title-left">
          <span 
            className="toggle-icon" 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (hasSubModules) {
                onToggleExpand(module.id); 
              }
            }}
            style={{ cursor: hasSubModules ? 'pointer' : 'default', opacity: hasSubModules ? 1 : 0.3 }}
          >
            {hasSubModules ? (isExpanded ? <FaChevronDown /> : <FaChevronRight />) : '•'}
          </span>
          
          <span className="module-label" onClick={() => onSelectModule(module.id)}>
            {module.title || "Untitled Module"}
            {/* Debug info: show count of submodules */}
            {hasSubModules && <span style={{fontSize: '0.7em', color: '#888', marginLeft: '5px'}}>({subModules.length})</span>}
          </span>
        </div>

        <div className="sidebar-module-actions">
          <button 
            title="Add Sub-Module" 
            className="btn-icon" 
            onClick={(e) => { e.stopPropagation(); onAddSubModule(module.id); }}
          >
            <FaPlus />
          </button>
          <button 
            title="Delete Module" 
            className="btn-icon btn-remove-icon" 
            onClick={(e) => { e.stopPropagation(); onDeleteModule(module.id); }}
          >
            <FaTrash />
          </button>
        </div>
      </div>
      
      {hasSubModules && isExpanded && (
        <ul className="sidebar-submodule-list">
          {subModules.map((subMod) => (
            <SidebarModuleItem
              key={subMod.id}
              module={subMod}
              onSelectModule={onSelectModule}
              onToggleExpand={onToggleExpand}
              onAddSubModule={onAddSubModule}
              onDeleteModule={onDeleteModule}
              selectedModuleId={selectedModuleId}
              isExpanded={!!expandedModules[subMod.id]}
              expandedModules={expandedModules}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default SidebarModuleItem;
