export interface LoginData {
    email: string;
    password: string;
}

export const loginUser = async (data: LoginData) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to login");
    }
    return res.json();
};

export interface RegisterData {
    fullname: string;
    email: string;
    password: string;
    role: string;
}

export const registerUser = async (data: RegisterData) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/register`, {
        method: "POST",
        credentials: 'include', // Include cookies for CORS
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to register");
    }
    return res.json();
};

// Resend verification email
export const resendVerificationEmail = async (email: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/resend-verification`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to resend verification email");
    }
    return res.json();
};

export interface UpdateProfileData {
    fullname: string;
    email: string;
}

export const updateUserProfile = async (data: UpdateProfileData) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
        method: "PATCH",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update profile");
    }
    return res.json();
};

// Request password reset - Supabase will send email
export const requestPasswordReset = async (email: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/request-password-reset`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to request password reset' }));
        throw new Error(err.message || 'Failed to request password reset');
    }

    return res.json();
};

// Reset password with new password (no OTP needed, handled by Supabase magic link)
export const resetPassword = async (token: string, newPassword: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to reset password' }));
        throw new Error(err.message || 'Failed to reset password');
    }

    return res.json();
};
