import React, { useState, useEffect } from 'react';
import './CourseDetails.css';

const CourseDetails = ({ course, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    tagline: '',
    overview: '',
    price: '',
    thumbnail: '',
    whatYouWillLearn: []
  });
  
  const [wywInput, setWywInput] = useState('');

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        subject: course.subject || '',
        tagline: course.tagline || '',
        overview: course.overview || '',
        price: course.price || '',
        thumbnail: course.thumbnail || '',
        whatYouWillLearn: Array.isArray(course.whatYouWillLearn) ? course.whatYouWillLearn : []
      });
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, thumbnail: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Learning Outcomes Handlers ---
  const handleWywKeyDown = (e) => {
    if (e.key === 'Enter' && wywInput.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        whatYouWillLearn: [...prev.whatYouWillLearn, wywInput.trim()]
      }));
      setWywInput('');
    }
  };

  const removeWywItem = (index) => {
    setFormData(prev => ({
      ...prev,
      whatYouWillLearn: prev.whatYouWillLearn.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="course-details-editor">
      <h2>Course Details</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Course Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label>Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. Web Development"
            />
          </div>
          <div className="form-group half">
            <label>Price ($)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="form-control"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Tagline</label>
          <input
            type="text"
            name="tagline"
            value={formData.tagline}
            onChange={handleChange}
            className="form-control"
            placeholder="Short catchy description"
          />
        </div>

        <div className="form-group">
          <label>Overview</label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            className="form-control"
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label>What will students learn? (Press Enter to add)</label>
          <input
            type="text"
            value={wywInput}
            onChange={(e) => setWywInput(e.target.value)}
            onKeyDown={handleWywKeyDown}
            className="form-control"
            placeholder="e.g. React Hooks"
          />
          <ul className="wyw-list">
            {formData.whatYouWillLearn.map((item, index) => (
              <li key={index}>
                {item}
                <button type="button" className="btn-remove-item" onClick={() => removeWywItem(index)}>
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="form-group">
          <label>Thumbnail Image</label>
          <div className="thumbnail-upload-container">
            {formData.thumbnail && (
              <img 
                src={formData.thumbnail} 
                alt="Course Thumbnail" 
                className="thumbnail-preview" 
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="form-control-file"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save Course Details
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseDetails;
