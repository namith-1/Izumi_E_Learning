
const addModuleToTree = (modules, parentId, newModule) => {
  if (!parentId) {
    return [...modules, newModule];
  }
  
  return modules.map(mod => {
    if (String(mod.id) === String(parentId)) {
      console.log(`Found parent ${mod.id}, adding submodule`);
      return { 
        ...mod, 
        subModules: [...(mod.subModules || []), newModule] 
      };
    }
    
    const currentSubModules = mod.subModules || [];
    if (currentSubModules.length > 0) {
      const updatedSubModules = addModuleToTree(currentSubModules, parentId, newModule);
      // Optimization: Only return new object if submodules actually changed
      if (updatedSubModules !== currentSubModules) {
          return { 
            ...mod, 
            subModules: updatedSubModules
          };
      }
    }
    return mod;
  });
};

// Test Case 1: Add to root
let modules = [];
let newMod1 = { id: '1', title: 'Root 1' };
modules = addModuleToTree(modules, null, newMod1);
console.log('Step 1:', JSON.stringify(modules, null, 2));

// Test Case 2: Add submodule to Root 1
let newMod2 = { id: '2', title: 'Sub 1' };
modules = addModuleToTree(modules, '1', newMod2);
console.log('Step 2:', JSON.stringify(modules, null, 2));

// Test Case 3: Add submodule to Sub 1 (Deep nesting)
let newMod3 = { id: '3', title: 'Sub-Sub 1' };
modules = addModuleToTree(modules, '2', newMod3);
console.log('Step 3:', JSON.stringify(modules, null, 2));

// Test Case 4: Add another to Root 1
let newMod4 = { id: '4', title: 'Sub 2' };
modules = addModuleToTree(modules, '1', newMod4);
console.log('Step 4:', JSON.stringify(modules, null, 2));
