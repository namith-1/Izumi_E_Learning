import React, { useState, useEffect, useRef } from 'react';
import './ModuleEditor.css'; // Import the CSS

// --- [MODIFIED] ModuleEditor Component ---
const ModuleEditor = ({ module, onSaveModule }) => {
  
  const [title, setTitle] = useState(module.title);
  const [url, setUrl] = useState(module.url);
  const [type, setType] = useState(module.type || 'lesson'); // New state
  const [quizData, setQuizData] = useState(module.quizData || { questions: [] }); // New state

  const editorRef = useRef(null);
  const imageUploadRef = useRef(null);
  const imageAlignment = useRef('full'); // Stores 'left', 'right', or 'full'

  // --- Refs for resizing state ---
  const isResizing = useRef(false);
  const targetImage = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Sync simple inputs when module prop changes
  useEffect(() => {
    setTitle(module.title);
    setUrl(module.url);
    setType(module.type || 'lesson');
    setQuizData(module.quizData || { questions: [] });
    if (editorRef.current) {
      editorRef.current.innerHTML = module.text || "<p>Start writing your content here...</p>";
    }
  }, [module]);
  
  // Logic for handling the image upload
  useEffect(() => {
    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_FILE_SIZE) {
        alert(`Error: Image file is too large! Please upload an image smaller than 2MB.`);
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'User uploaded image';

        switch (imageAlignment.current) {
          case 'left': img.className = 'img-float-left'; break;
          case 'right': img.className = 'img-float-right'; break;
          case 'full': default: img.className = 'img-full'; break;
        }

        // Insert image at cursor position or append
        if (editorRef.current) {
            editorRef.current.focus();
            // Basic insertion - for a real rich text editor, use Selection API
            // Here we just append for simplicity if selection is lost
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(img);
            } else {
                editorRef.current.appendChild(img);
            }
        }
      };
      reader.readAsDataURL(file);
      event.target.value = ''; // Reset input
    };

    const inputElement = imageUploadRef.current;
    if (inputElement) {
      inputElement.addEventListener('change', handleImageUpload);
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('change', handleImageUpload);
      }
    };
  }, []);

  // --- Image Resizing Logic ---
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.target.tagName === 'IMG' && editorRef.current.contains(e.target)) {
        e.preventDefault(); // Prevent default drag behavior
        isResizing.current = true;
        targetImage.current = e.target;
        startX.current = e.clientX;
        startWidth.current = parseInt(window.getComputedStyle(e.target).width, 10);
        
        // Add global listeners for drag and drop
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handleMouseMove = (e) => {
      if (!isResizing.current || !targetImage.current) return;
      const dx = e.clientX - startX.current;
      const newWidth = startWidth.current + dx;
      if (newWidth > 50) { // Minimum width constraint
        targetImage.current.style.width = `${newWidth}px`;
        targetImage.current.style.height = 'auto'; // Maintain aspect ratio
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      targetImage.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      if (editor) {
        editor.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);


  const handleSave = () => {
    onSaveModule({
      ...module,
      title,
      url,
      text: editorRef.current ? editorRef.current.innerHTML : '',
      type,
      quizData
    });
  };

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const triggerImageUpload = (alignment) => {
    imageAlignment.current = alignment;
    if (imageUploadRef.current) {
      imageUploadRef.current.click();
    }
  };

  // Helper to add a question
  const addQuestion = () => {
    setQuizData(prev => ({
      questions: [
        ...(prev.questions || []),
        { question: '', options: ['', '', '', ''], answer: '' }
      ]
    }));
  };

  // Helper to update question
  const updateQuestion = (index, field, value) => {
    const newQuestions = [...(quizData.questions || [])];
    newQuestions[index][field] = value;
    setQuizData({ questions: newQuestions });
  };

  // Helper to update option
  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...(quizData.questions || [])];
    newQuestions[qIndex].options[oIndex] = value;
    setQuizData({ questions: newQuestions });
  };

  // Helper to remove question
  const removeQuestion = (index) => {
      const newQuestions = (quizData.questions || []).filter((_, i) => i !== index);
      setQuizData({ questions: newQuestions });
  };

  return (
    <div className="module-editor">
      <h2>Edit Module</h2>
      <div className="module-editor-content">
        <div className="module-inputs">
          <div className="form-group">
            <label>Module Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="form-control">
                <option value="lesson">Lesson</option>
                <option value="quiz">Quiz</option>
            </select>
          </div>
          <div className="form-group">
            <label>Module Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Module Title"
              className="form-control"
            />
          </div>
        </div>

        {type === 'lesson' ? (
            <>
                <div className="form-group">
                    <label>Video URL (Optional)</label>
                    <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="form-control"
                    />
                </div>

                <div className="form-group">
                <label>Content</label>
                
                {/* Toolbar */}
                <div className="rich-editor-toolbar">
                    <button className="btn-editor" onClick={() => execCmd('bold')} title="Bold"><b>B</b></button>
                    <button className="btn-editor" onClick={() => execCmd('italic')} title="Italic"><i>I</i></button>
                    <button className="btn-editor" onClick={() => execCmd('underline')} title="Underline"><u>U</u></button>
                    <button className="btn-editor" onClick={() => execCmd('formatBlock', 'H1')} title="Heading 1">H1</button>
                    <button className="btn-editor" onClick={() => execCmd('formatBlock', 'H2')} title="Heading 2">H2</button>
                    <button className="btn-editor" onClick={() => execCmd('formatBlock', 'P')} title="Paragraph">P</button>
                    <button className="btn-editor" onClick={() => execCmd('insertUnorderedList')} title="Bullet List">• List</button>
                    <button className="btn-editor" onClick={() => execCmd('insertOrderedList')} title="Numbered List">1. List</button>
                    
                    <div style={{ width: '1px', background: '#ccc', margin: '0 5px' }}></div>
                    
                    <button className="btn-editor" onClick={() => triggerImageUpload('left')} title="Image Left">🖼️ Left</button>
                    <button className="btn-editor" onClick={() => triggerImageUpload('full')} title="Image Center">🖼️ Center</button>
                    <button className="btn-editor" onClick={() => triggerImageUpload('right')} title="Image Right">🖼️ Right</button>
                    
                    {/* Hidden File Input */}
                    <input 
                    type="file" 
                    ref={imageUploadRef} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                    />
                </div>

                {/* Editable Area */}
                <div
                    ref={editorRef}
                    className="rich-editor-area"
                    contentEditable
                    suppressContentEditableWarning={true}
                ></div>
                </div>
            </>
        ) : (
            <div className="quiz-editor">
                <h4>Quiz Questions</h4>
                {(quizData.questions || []).map((q, qIndex) => (
                    <div key={qIndex} className="quiz-question-card" style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
                        <div className="form-group">
                            <label>Question {qIndex + 1}</label>
                            <input 
                                type="text" 
                                className="form-control"
                                value={q.question}
                                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                placeholder="Enter question text"
                            />
                        </div>
                        <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                            {q.options.map((opt, oIndex) => (
                                <div key={oIndex} className="option-input" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input 
                                        type="radio" 
                                        name={`correct-${qIndex}`}
                                        checked={q.answer === opt && opt !== ''}
                                        onChange={() => updateQuestion(qIndex, 'answer', opt)}
                                    />
                                    <input 
                                        type="text"
                                        className="form-control"
                                        value={opt}
                                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                        placeholder={`Option ${oIndex + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-danger btn-sm" style={{ marginTop: '10px' }} onClick={() => removeQuestion(qIndex)}>Remove Question</button>
                    </div>
                ))}
                <button className="btn btn-secondary" onClick={addQuestion}>+ Add Question</button>
            </div>
        )}

        <div className="module-editor-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Module Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleEditor;
