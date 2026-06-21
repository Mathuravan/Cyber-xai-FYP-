import { useState } from "react"
import { signup } from "../services/authService"
import { Link } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"
import "../styles/auth.css"

export default function Signup() {

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {

    e.preventDefault()

    try {

      await signup(username, email, password)

      setMessage("Account created successfully")

    } catch {

      setMessage("Signup failed")

    }

  }

  return (

    <div className="auth-container">
      <ThemeToggle floating />

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

  )

}