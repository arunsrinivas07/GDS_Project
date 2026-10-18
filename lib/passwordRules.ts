export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export function evaluatePassword(password: string): {
  isValid: boolean;
  score: number;
  requirements: PasswordRequirement[];
} {
  const requirements: PasswordRequirement[] = [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      id: "uppercase",
      label: "At least one uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "At least one lowercase letter (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "At least one number (0-9)",
      met: /[0-9]/.test(password),
    },
    {
      id: "special",
      label: "At least one special character (!@#$%^&* etc.)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const isValid = metCount === requirements.length;

  return {
    isValid,
    score: metCount,
    requirements,
  };
}
