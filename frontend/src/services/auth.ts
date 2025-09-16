export interface LoginData {
    email: string;
    password: string;
}

export const loginUser = async (data: LoginData) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: "POST",
        credentials: 'include', // Include cookies for CORS
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

