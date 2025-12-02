import React from 'react';
import SidebarModuleItem from './SidebarModuleItem';
import './Sidebar.css';

const Sidebar = ({
  modules,
  selectedModuleId,
  expandedModules,
  onSelectModule,
  onToggleExpand,
  onAddModule,
  onDeleteModule
}) => {
  return (
    <aside className="sidebar">
      <section className="form-section">
        <h2>Course Editor</h2>

        <div
          className={`sidebar-module-title ${selectedModuleId === null ? 'active' : ''}`}
          onClick={() => onSelectModule(null)} // Select Course Details
        >
          <span>Course Details</span>
        </div>

        <hr className="sidebar-divider" />

        <h3>Modules</h3>
        <button className="btn btn-primary" onClick={() => onAddModule(null)}>
          + Add Top-Level Module
        </button>
        <ul id="modules" className="sidebar-module-list">
          {modules.map((mod) => (
            <SidebarModuleItem
              key={mod.id}
              module={mod}
              onSelectModule={onSelectModule}
              onToggleExpand={onToggleExpand}
              onAddSubModule={onAddModule}
              onDeleteModule={onDeleteModule}
              selectedModuleId={selectedModuleId}
              isExpanded={!!expandedModules[mod.id]}
              expandedModules={expandedModules}
            />
          ))}
        </ul>
      </section>
    </aside>
  );
};

export default Sidebar;
