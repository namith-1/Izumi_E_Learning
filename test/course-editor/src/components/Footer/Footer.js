import React from 'react';
import './Footer.css';

const Footer = ({ courseID, onSaveClick }) => {
  return (
    <footer className="save-footer">
      {courseID ? (
        <button className="btn btn-save" onClick={onSaveClick}>
          Save Changes
        </button>
      ) : (
        <button className="btn btn-save" onClick={onSaveClick}>
          Save Course
        </button>
      )}
    </footer>
  );
};

export default Footer;