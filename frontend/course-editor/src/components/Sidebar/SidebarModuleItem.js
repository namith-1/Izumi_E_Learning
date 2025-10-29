import React from 'react';
// CSS is imported in Sidebar.js

const SidebarModuleItem = ({
  module,
  onSelectModule,
  onAddSubModule,
  onRemoveModule,
  selectedModuleId
}) => {
  const isActive = module.id === selectedModuleId;
  return (
    <li className="sidebar-module-item">
      <div className={`sidebar-module-title ${isActive ? 'active' : ''}`}>
        <span onClick={() => onSelectModule(module.id)}>
          {module.title || "Untitled Module"}
        </span>
        <div className="sidebar-module-actions">
          <button title="Add Sub-Module" className="btn-icon" onClick={() => onAddSubModule(module)}>
            +
          </button>
          <button title="Remove Module" className="btn-icon btn-remove-icon" onClick={() => onRemoveModule(module.id)}>
            &times;
          </button>
        </div>
      </div>
      {module.subModules && module.subModules.length > 0 && (
        <ul className="sidebar-submodule-list">
          {module.subModules.map((subMod) => (
            <SidebarModuleItem
              key={subMod.id}
              module={subMod}
              onSelectModule={onSelectModule}
              onAddSubModule={onAddSubModule}
              onRemoveModule={onRemoveModule}
              selectedModuleId={selectedModuleId}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default SidebarModuleItem;