// src/utils/helpers.js

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