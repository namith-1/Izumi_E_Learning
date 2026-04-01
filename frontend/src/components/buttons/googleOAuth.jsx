import React from 'react';

const GoogleOAuthButton = () => {
  const handleGoogleLogin = () => {
    // Redirecting to the backend Google Auth route
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <button 
      type="button" 
      onClick={handleGoogleLogin} 
      className="btn-google"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginTop: '10px',
        padding: '10px',
        cursor: 'pointer'
      }}
    >
      <img 
        src="/google-icon.svg" 
        alt="Google" 
        style={{ width: '20px', marginRight: '8px' }} 
        onError={(e) => e.target.style.display='none'} // Prevents crash if image is missing
      /> 
      Continue with Google
    </button>
  );
};

export default GoogleOAuthButton;