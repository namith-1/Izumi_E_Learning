import React, { useState, useEffect } from 'react';
import './App.css'; // Global styles

// Import Components
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import CourseDetails from './components/CourseDetails/CourseDetails';
import ModuleEditor from './components/ModuleEditor/ModuleEditor';
import Footer from './components/Footer/Footer';
import ConfirmationModal from './components/ConfirmationModal/ConfirmationModal';

// Import Helpers
import { getQueryParam, ensureModuleIDs, findModuleById } from './utils/helpers';

function App() {
  // --- State ---
  const [courseID, setCourseID] = useState(null);
  const [course, setCourse] = useState({
    title: '', subject: '', tagline: '', overview: '', price: 0,
    whatYouWillLearn: [], modules: [],
  });
  const [wywInput, setWywInput] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null); // null = Course Details

  // --- Effects ---
  useEffect(() => {
    const id = getQueryParam('courseId');
    if (id && id !== '404') {
      setCourseID(id);
      loadCourse(id);
    }
  }, []);

  // --- Data Loading ---
  const loadCourse = (id) => {
    fetch(`/course/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse({
          title: data.title || '', subject: data.subject || '',
          tagline: data.tagline || '', overview: data.overview || '',
          price: data.price || 0,
          whatYouWillLearn: Array.isArray(data.whatYouWillLearn) ? data.whatYouWillLearn : [],
          modules: data.modules ? ensureModuleIDs(data.modules) : [],
        });
      })
      .catch((error) => console.error('Error loading course:', error));
  };

  // --- Data Saving ---
  const handleSaveClick = () => setIsConfirmModalOpen(true);
  const executeSave = () => {
    setIsConfirmModalOpen(false);
    setSelectedModuleId(null);
    const payload = { ...course, price: Number(course.price) || 0 };
    const url = courseID ? `/save-course-changes?courseId=${courseID}` : '/save-course';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message || 'Course saved successfully!');
      window.location.href = '/dashboard';
    })
    .catch((err) => console.error('Error saving course:', err));
  };

  // --- Course Detail Handlers ---
  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setCourse((prev) => ({ ...prev, [name]: value }));
  };
  const handleWywInputChange = (e) => {
    setWywInput(e.target.value);
  };
  const handleWywKeydown = (e) => {
    if (e.key === 'Enter' && wywInput.trim()) {
      e.preventDefault();
      setCourse((prev) => ({
        ...prev,
        whatYouWillLearn: [...prev.whatYouWillLearn, wywInput.trim()],
      }));
      setWywInput('');
    }
  };
  const removeWywItem = (indexToRemove) => {
    setCourse((prev) => ({
      ...prev,
      whatYouWillLearn: prev.whatYouWillLearn.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // --- Module Handlers ---
  const addModule = (parentModule = null) => {
    const newModule = {
      id: Date.now() + Math.random(), title: 'New Module',
      text: '<p>Start writing your content here...</p>', url: '', subModules: []
    };
    if (parentModule === null) {
      setCourse(prev => ({ ...prev, modules: [...prev.modules, newModule] }));
    } else {
      const addRecursive = (modules) => {
        return modules.map(mod => {
          if (mod.id === parentModule.id) {
            return { ...mod, subModules: [...mod.subModules, newModule] };
          }
          if (mod.subModules && mod.subModules.length > 0) {
            return { ...mod, subModules: addRecursive(mod.subModules) };
          } return mod;
        });
      };
      setCourse(prev => ({ ...prev, modules: addRecursive(prev.modules) }));
    }
    setSelectedModuleId(newModule.id);
  };

  const removeModule = (moduleIdToRemove) => {
    const removeRecursive = (modules) => {
      return modules.filter(mod => mod.id !== moduleIdToRemove)
        .map(mod => {
          if (mod.subModules && mod.subModules.length > 0) {
            return { ...mod, subModules: removeRecursive(mod.subModules) };
          } return mod;
        });
    };
    setCourse(prev => ({ ...prev, modules: removeRecursive(prev.modules) }));
    if (selectedModuleId === moduleIdToRemove) setSelectedModuleId(null);
  };
  
  const handleSaveModule = (updatedModule) => {
    const updateRecursive = (modules) => {
      return modules.map(mod => {
        if (mod.id === updatedModule.id) {
          return updatedModule;
        }
        if (mod.subModules && mod.subModules.length > 0) {
          return { ...mod, subModules: updateRecursive(mod.subModules) };
        } return mod;
      });
    };
    setCourse(prev => ({ ...prev, modules: updateRecursive(prev.modules) }));
  };

  // --- Derived State ---
  const selectedModule = findModuleById(course.modules, selectedModuleId);

  // --- Render ---
  return (
    <div className="App">
      <Navbar />
      <main className="editor-layout">
        <Sidebar
          modules={course.modules}
          selectedModuleId={selectedModuleId}
          onSelectModule={setSelectedModuleId}
          onAddModule={addModule}
          onRemoveModule={removeModule}
        />
        <div className="content-editor">
          {selectedModule ? (
            <ModuleEditor module={selectedModule} onSaveModule={handleSaveModule} />
          ) : (
            <CourseDetails
              course={course}
              onCourseChange={handleCourseChange}
              wywInput={wywInput}
              onWywInputChange={handleWywInputChange}
              onWywInputKeyDown={handleWywKeydown}
              onRemoveWywItem={removeWywItem}
            />
          )}
        </div>
      </main>

      {selectedModuleId === null && (
        <Footer courseID={courseID} onSaveClick={handleSaveClick} />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeSave}
        title="Confirm Save"
      >
        Are you sure you want to save this course?
      </ConfirmationModal>
    </div>
  );
}

export default App;