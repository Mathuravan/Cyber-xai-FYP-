import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { login } from "../services/authService"
import ThemeToggle from "../components/ThemeToggle"
import "../styles/auth.css"

export default function Login() {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const navigate = useNavigate()

  const handleSubmit = async (e) => {

    e.preventDefault()

    try {

      await login(username, password)

      navigate("/dashboard")

    } catch (err) {

      setError(err.message || "Invalid login credentials")

    }

  }

  return (

    <div className="auth-container">
      <ThemeToggle floating />

      <div className="auth-shell">
        <div className="auth-brand">
          <span className="auth-brand-mark">CX</span>
          <span className="auth-brand-name">CyberXAI</span>
          <span className="auth-brand-tag">Intrusion Detection Platform</span>
        </div>

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
    </div>

  )

}