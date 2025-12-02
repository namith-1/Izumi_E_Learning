export function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

export const ensureModuleIDs = (modules) => {
  return modules.map(mod => ({
    ...mod,
    id: mod.id || Date.now() + Math.random(),
    subModules: mod.subModules ? ensureModuleIDs(mod.subModules) : []
  }));
};

export const findModuleById = (modules, id) => {
  for (const mod of modules) {
    if (mod.id === id) return mod;
    if (mod.subModules) {
      const found = findModuleById(mod.subModules, id);
      if (found) return found;
    }
  }
  return null;
};

export const addModuleToTree = (modules, parentId, newModule) => {
  // console.log('addModuleToTree called', { parentId, newModule });
  if (!parentId) {
    return [...modules, newModule];
  }
  
  return modules.map(mod => {
    if (String(mod.id) === String(parentId)) {
      // console.log('Found parent, adding submodule', mod.id);
      return { 
        ...mod, 
        subModules: [...(mod.subModules || []), newModule] 
      };
    }
    
    const currentSubModules = mod.subModules || [];
    if (currentSubModules.length > 0) {
      return { 
        ...mod, 
        subModules: addModuleToTree(currentSubModules, parentId, newModule) 
      };
    }
    return mod;
  });
};

export const deleteModuleFromTree = (modules, moduleId) => {
  return modules.filter(mod => mod.id !== moduleId).map(mod => {
    if (mod.subModules && mod.subModules.length > 0) {
      return {
        ...mod,
        subModules: deleteModuleFromTree(mod.subModules, moduleId)
      };
    }
    return mod;
  });
};

export const updateModuleInTree = (modules, moduleId, updatedModule) => {
  return modules.map(mod => {
    if (mod.id === moduleId) {
      return updatedModule;
    }
    if (mod.subModules && mod.subModules.length > 0) {
      return {
        ...mod,
        subModules: updateModuleInTree(mod.subModules, moduleId, updatedModule)
      };
    }
    return mod;
  });
};

export const getExpandedTitles = (modules, expandedModules) => {
  let titles = [];
  const traverse = (mods) => {
    mods.forEach(mod => {
      if (expandedModules[mod.id]) {
        titles.push(mod.title);
      }
      if (mod.subModules) {
        traverse(mod.subModules);
      }
    });
  };
  traverse(modules);
  return titles;
};

export const getExpandedIdsFromTitles = (modules, titles) => {
  let ids = {};
  const traverse = (mods) => {
    mods.forEach(mod => {
      if (titles.includes(mod.title)) {
        ids[mod.id] = true;
      }
      if (mod.subModules) {
        traverse(mod.subModules);
      }
    });
  };
  traverse(modules);
  return ids;
};
