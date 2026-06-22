import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { signup } from "../services/authService"
import ThemeToggle from "../components/ThemeToggle"
import "../styles/auth.css"

export default function Signup() {

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {

    e.preventDefault()

    try {

      await signup(username, email, password)

      navigate("/")

    } catch (err) {

      setMessage(err.message || "Signup failed")

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
          Create Account
        </h2>

        <p className="auth-subtitle">
          Join CyberXAI Platform
        </p>

        <form onSubmit={handleSubmit}>

          <div className="input-group">

            <label>Username</label>

            <input
              placeholder="Mathuravan"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

          </div>

          <div className="input-group">

            <label>Email</label>

            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            Create Account
          </button>

        </form>

        <p>{message}</p>

        <div className="auth-footer">

          Already have an account?

          <Link to="/">
            Login
          </Link>

        </div>

        </div>
      </div>
    </div>

  )

}