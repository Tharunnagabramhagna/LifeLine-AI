export const checkPasswordStrength = (password) => {
  if (!password) return 0;

  let score = 0;

  if (password.length >= 6) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  return score;
};

export const getPasswordStrengthLabel = (score) => {
  if (score <= 1)
    return { label: "Weak", color: "#ff4d4d", width: "25%" };

  if (score === 2)
    return { label: "Medium", color: "#ffcc00", width: "50%" };

  if (score === 3)
    return { label: "Good", color: "#a5d610", width: "75%" };

  return { label: "Strong", color: "#00ff99", width: "100%" };
};

export const getPasswordSuggestions = (password) => {
  const suggestions = [];

  if (password.length < 6)
    suggestions.push("Use at least 6 characters");

  if (!/[A-Z]/.test(password))
    suggestions.push("Add an uppercase letter");

  if (!/[0-9]/.test(password))
    suggestions.push("Include a number");

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    suggestions.push("Add a special character");

  return suggestions;
};
