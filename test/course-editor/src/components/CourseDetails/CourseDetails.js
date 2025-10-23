import React from 'react';
import './CourseDetails.css';

const CourseDetails = ({
  course,
  onCourseChange,
  wywInput,
  onWywInputChange,
  onWywInputKeyDown,
  onRemoveWywItem
}) => {
  return (
    <>
      <h1>Course Details</h1>
      <section className="form-section">
        <h2>General Information</h2>
        <div className="form-group">
          <label htmlFor="courseTitle">Course Title</label>
          <input
            id="courseTitle" name="title"
            placeholder="e.g., Introduction to React"
            value={course.title} onChange={onCourseChange}
          />
        </div>
        <div className="grid-col-2">
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject" name="subject"
              placeholder="e.g., Web Development"
              value={course.subject} onChange={onCourseChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Price ($)</label>
            <input
              type="number" id="price" name="price"
              placeholder="0"
              value={course.price} onChange={onCourseChange}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="tagline">Tagline</label>
          <input
            id="tagline" name="tagline"
            placeholder="A short, catchy tagline for the course"
            value={course.tagline} onChange={onCourseChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="overview">Overview</label>
          <textarea
            id="overview" name="overview"
            placeholder="A detailed description of the course..."
            rows="5"
            value={course.overview} onChange={onCourseChange}
          ></textarea>
        </div>
      </section>

      <section className="form-section">
        <h2>Learning Outcomes</h2>
         <div className="form-group">
          <label htmlFor="whatYouWillLearnInput">
            What will students learn? (Press Enter to add)
          </label>
          <input
            id="whatYouWillLearnInput"
            placeholder="e.g., How to use React Hooks"
            value={wywInput}
            onChange={onWywInputChange}
            onKeyDown={onWywInputKeyDown}
          />
          <ul id="whatYouWillLearnList">
            {course.whatYouWillLearn.map((item, idx) => (
              <li key={idx}>
                <span>{item}</span>
                <button className="btn-remove" onClick={() => onRemoveWywItem(idx)}>
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
};

export default CourseDetails;