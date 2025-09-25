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

