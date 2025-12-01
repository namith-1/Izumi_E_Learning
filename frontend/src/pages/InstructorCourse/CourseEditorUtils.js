import { BookOpen, FileText, Video, CheckSquare, Layers } from 'lucide-react';

export const COURSE_DATA_PATH = 'local_course_draft'; 
export const QUIZ_API_PATH = '/quiz-placeholder'; 

export const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

export const createNewModule = (type = 'text', parentId = null) => ({
    id: generateId(),
    parentId: parentId,
    type: type, 
    title: type === 'intro' ? 'Course Introduction' : `New ${type.charAt(0).toUpperCase() + type.slice(1)} Module`,
    description: '',
    text: type === 'text' ? 'Start writing your content here...' : '',
    videoLink: type === 'video' ? 'https://www.youtube.com/embed/dQw4w9WgXcQ' : '',
    quizUrl: type === 'quiz' ? QUIZ_API_PATH : '',
    children: [], 
});

export const initialCourseStructure = {
    rootModule: createNewModule('intro', null),
    modules: {}, 
    courseTitle: "Untitled Course",
    courseDescription: "A description for the entire course.",
    subject: "General",
};

// Returns the Component (not an element) so it can be used as <Icon />
export const getModuleIcon = (type) => {
    switch (type) {
        case 'intro': return BookOpen;
        case 'text': return FileText;
        case 'video': return Video;
        case 'quiz': return CheckSquare;
        default: return Layers;
    }
};

export const deleteModuleFromStructure = (modules, moduleId) => {
    const moduleToDelete = modules[moduleId];
    if (!moduleToDelete) return modules;
    
    const moduleIdsToDelete = [moduleId];
    const findChildrenToDelete = (children) => {
        children.forEach(childId => {
            moduleIdsToDelete.push(childId);
            if (modules[childId] && modules[childId].children) {
                findChildrenToDelete(modules[childId].children);
            }
        });
    };
    findChildrenToDelete(moduleToDelete.children);

    if (moduleToDelete.parentId && modules[moduleToDelete.parentId]) {
        modules[moduleToDelete.parentId].children = modules[moduleToDelete.parentId].children.filter(id => id !== moduleId);
    }
    
    const newModules = { ...modules };
    moduleIdsToDelete.forEach(id => delete newModules[id]);
    return newModules;
};