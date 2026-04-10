import React, { useState } from 'react';

export default function PasswordInput({ value, onChange, placeholder = "Enter password", id = "password", label = "Password" }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-field-group mb-6 relative">
      <label htmlFor={id} className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 opacity-80">{label}</label>
      <div className="relative group">
        <input
          type={showPassword ? "text" : "password"}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="pr-12"
        />
        <button 
          type="button" 
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors text-xl"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <span title="Hide">👁️</span>
          ) : (
            <span title="Show">🔒</span>
          )}
        </button>
      </div>
    </div>
  );
}
