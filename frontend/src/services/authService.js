export const API_BASE = "http://127.0.0.1:8000";

// =======================
// HANDLE API ERRORS
// =======================
async function handleResponseError(res) {
  try {
    const data = await res.json();

    throw new Error(
      data.detail || "Request failed"
    );
  } catch (err) {
    if (err.message) {
      throw err;
    }

    throw new Error(
      "Request failed"
    );
  }
}

// =======================
// SIGNUP
// =======================
export const signup = async (
  username,
  email,
  password
) => {
  const res = await fetch(
    `${API_BASE}/signup`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        username,
        email,
        password,
      }),
    }
  );

  if (!res.ok) {
    await handleResponseError(res);
  }

  return res.json();
};

// =======================
// LOGIN
// =======================
export const login = async (
  username,
  password
) => {
  const res = await fetch(
    `${API_BASE}/login`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        username,
        password,
      }),
    }
  );

  if (!res.ok) {
    await handleResponseError(res);
  }

  const data = await res.json();

  // SAVE USER
  localStorage.setItem(
    "cyberxai_user",
    JSON.stringify(data.user)
  );

  // SAVE TOKEN
  localStorage.setItem(
    "cyberxai_token",
    data.token
  );

  return data;
};

// =======================
// AUTH HELPERS
// =======================
export const isAuthenticated =
  () => {
    return Boolean(
      localStorage.getItem(
        "cyberxai_token"
      )
    );
  };

export const logout = () => {
  localStorage.removeItem(
    "cyberxai_user"
  );

  localStorage.removeItem(
    "cyberxai_token"
  );
};

// KEEP OLD CODE COMPATIBLE
export const clearAuth =
  logout;

export const getToken = () => {
  return localStorage.getItem(
    "cyberxai_token"
  );
};