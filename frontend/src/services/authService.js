export const API_BASE = "http://127.0.0.1:8000";

// =======================
// SIGNUP
// =======================
export const signup = async (username, email, password) => {

  const res = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      email,
      password
    })
  });

  if (!res.ok) {
    throw new Error("Signup failed");
  }

  return res.json();

};

// =======================
// LOGIN
// =======================
export const login = async (username, password) => {

  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      password
    })
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  const data = await res.json();

  // Save auth
  localStorage.setItem(
    "cyberxai_user",
    JSON.stringify(data.user || username)
  );

  localStorage.setItem(
    "cyberxai_token",
    data.token || "logged_in"
  );

  return data;

};

// =======================
// AUTH HELPERS
// =======================
export const isAuthenticated = () => {

  return Boolean(
    localStorage.getItem("cyberxai_user")
  );

};

export const clearAuth = () => {

  localStorage.removeItem("cyberxai_user");

  localStorage.removeItem("cyberxai_token");

};

export const getToken = () => {

  return localStorage.getItem(
    "cyberxai_token"
  );

};