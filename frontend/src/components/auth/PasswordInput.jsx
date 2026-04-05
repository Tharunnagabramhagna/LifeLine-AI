import React, { useState } from 'react';

export default function PasswordInput({ value, onChange, placeholder = "Enter password", id = "password", label = "Password" }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-field-group">
      <label htmlFor={id} className="auth-label">{label}</label>
      <div className="auth-password-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="auth-input-true auth-password-input"
        />
        <button 
          type="button" 
          className="auth-eye-button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? '👁' : '🔒'}
        </button>
      </div>
    </div>
  );
}
