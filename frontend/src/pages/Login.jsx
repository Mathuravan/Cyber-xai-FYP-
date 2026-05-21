import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { login } from "../services/authService"
import "../styles/auth.css"

export default function Login() {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const navigate = useNavigate()

  const handleSubmit = async (e) => {

    e.preventDefault()

    try {

      const data = await login(username, password)

      localStorage.setItem("cyberxai_token", data.token)
      localStorage.setItem("cyberxai_user", data.user)



      navigate("/dashboard")

    } catch {

      setError("Invalid login credentials")

    }

  }

  return (

    <div className="auth-container">

      <div className="auth-card">

        <h2 className="auth-title">
          Welcome Back
        </h2>

        <p className="auth-subtitle">
          Sign in to CyberXAI
        </p>

        <form onSubmit={handleSubmit}>

          <div className="input-group">

            <label>Username</label>

            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

          </div>

          <div className="input-group">

            <label>Password</label>

            <input
              type="password"
              placeholder="Password123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </div>

          <button className="auth-button">
            Sign In
          </button>

        </form>

        {error && <p className="error">{error}</p>}

        <div className="auth-footer">

          Don't have an account?

          <Link to="/signup">
            Sign Up
          </Link>

        </div>

      </div>

    </div>

  )

}