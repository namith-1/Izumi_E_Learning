import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ModuleEditor.css'; // Import the CSS

// --- [MODIFIED] ModuleEditor Component ---
const ModuleEditor = ({ module, onSaveModule }) => {
  
  const [title, setTitle] = useState(module.title);
  const [url, setUrl] = useState(module.url);
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
        
        insertElementAtEnd(img);

        if (imageAlignment.current.includes('left') || imageAlignment.current.includes('right')) {
          const p = document.createElement('p');
          p.innerHTML = '&nbsp;';
          insertElementAtEnd(p);
        }
      };
      
      reader.readAsDataURL(file);
      event.target.value = '';
    };

    const uploader = imageUploadRef.current;
    uploader.addEventListener('change', handleImageUpload);
    return () => uploader.removeEventListener('change', handleImageUpload);
  }, []);

  // --- Mouse Move handler (for resizing) ---
  const handleResizeMove = useCallback((e) => {
    if (!isResizing.current) return;
    const deltaX = e.clientX - startX.current;
    const newWidth = startWidth.current + deltaX;
    if (targetImage.current) {
      targetImage.current.style.width = `${newWidth}px`;
      targetImage.current.style.height = 'auto';
    }
  }, []);

  // --- Mouse Up handler (to stop resizing) ---
  const handleResizeStop = useCallback(() => {
      if (!isResizing.current || !targetImage.current) return;
      let originalFloatClass = '';
      if (targetImage.current.classList.contains('img-float-left')) {
          originalFloatClass = 'img-float-left';
      } else if (targetImage.current.classList.contains('img-float-right')) {
          originalFloatClass = 'img-float-right';
      }
      isResizing.current = false;
      targetImage.current.style.cursor = 'pointer';
      targetImage.current.style.width = targetImage.current.style.width;
      targetImage.current.style.height = 'auto';
      targetImage.current.className = originalFloatClass;
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeStop);
  }, [handleResizeMove]);

  // --- Effect to add 'dblclick' listener for resizing ---
  useEffect(() => {
    const handleResizeStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault(); 
        isResizing.current = true;
        targetImage.current = e.target;
        startX.current = e.clientX;
        startWidth.current = e.target.offsetWidth;
        e.target.style.cursor = 'col-resize';
        window.addEventListener('mousemove', handleResizeMove);
        window.addEventListener('mouseup', handleResizeStop);
      }
    };
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('dblclick', handleResizeStart);
    }
    return () => {
      if (editor) {
        editor.removeEventListener('dblclick', handleResizeStart);
      }
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeStop);
    };
  }, [handleResizeMove, handleResizeStop]);

  const insertElementAtEnd = (el) => {
    if (!editorRef.current) return;
    editorRef.current.appendChild(el);
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    editorRef.current.focus();
  };
  
  // Toolbar handlers
  const addTitle = () => {
    const titleEl = document.createElement('h1');
    titleEl.textContent = 'New Title';
    insertElementAtEnd(titleEl);
  };
  const addHeading = () => {
    const heading = document.createElement('h2');
    heading.textContent = 'New Heading';
    insertElementAtEnd(heading);
  };
  const addText = () => {
    const p = document.createElement('p');
    p.textContent = 'Start writing your new paragraph here. Lorem ipsum dolor sit amet...';
    insertElementAtEnd(p);
  };
  const addImage = (alignment) => {
    imageAlignment.current = alignment;
    imageUploadRef.current.click();
  };

  const handleSave = () => {
    const currentHTML = editorRef.current.innerHTML;
    onSaveModule({
      ...module,
      title: title,
      url: url,
      text: currentHTML
    });
  };

  return (
    <section className="form-section module-editor-content">
      <input 
        type="file" 
        ref={imageUploadRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
      />

      <div className="form-group">
        <label htmlFor="moduleTitle">Module Title</label>
        <input
          id="moduleTitle"
          type="text"
          name="title"
          placeholder="Module Title"
          value={title}
          onInput={(e) => setTitle(e.target.value)}
        />
      </div>
        
      <div className="rich-editor-toolbar">
        <button onClick={addTitle} className="btn-editor">Add Title</button>
        <button onClick={addHeading} className="btn-editor">Add Heading</button>
        <button onClick={addText} className="btn-editor">Add Paragraph</button>
        <div className="h-8 w-px bg-gray-200 mx-2"></div>
        <button onClick={() => addImage('left')} className="btn-editor">Image Left</button>
        <button onClick={() => addImage('right')} className="btn-editor">Image Right</button>
        <button onClick={() => addImage('full')} className="btn-editor">Image Full</button>
      </div>

      <div className="module-inputs">
        <div className="form-group">
          <label>Module Content</label>
          <div
            ref={editorRef}
            contentEditable="true"
            className="rich-editor-area"
            dangerouslySetInnerHTML={{ __html: module.text || "<p>Start writing your content here...</p>" }}
          />
          <p className="text-xs text-gray-500 mt-1">Note: Images are saved directly into the course data. Double-click an image to resize its width.</p>
        </div>

        <div className="form-group">
          <label htmlFor="moduleUrl">Module Video URL (Optional)</label>
          <input
            id="moduleUrl"
            type="url"
            name="url"
            placeholder="Module URL (e.g., video link)"
            value={url}
            onInput={(e) => setUrl(e.target.value)}
          />
        </div>
      </div>

      <div className="module-editor-actions">
        <button className="btn btn-primary" onClick={handleSave}>
          Save Module
        </button>
      </div>
    </section>
  );
};

export default ModuleEditor;