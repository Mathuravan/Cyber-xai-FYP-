const API = "http://127.0.0.1:8000"

export const signup = async (username, email, password) => {

  const res = await fetch(`${API}/signup`, {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      username,
      email,
      password
    })

  })

  if (!res.ok) {
    throw new Error()
  }

  return res.json()

}

export const login = async (username, password) => {

  const res = await fetch(`${API}/login`, {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      username,
      password
    })

  })

  if (!res.ok) {
    throw new Error()
  }

  return res.json()

}