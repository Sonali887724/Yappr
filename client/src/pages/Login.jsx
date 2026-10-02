import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.response?.data?.message ||
          "Login failed"
      );
    }
  };

  return (
    <div className="auth-page">

      {/* Background decorations */}
      <div className="auth-decoration cloud cloud-one">
        ☁
      </div>

      <div className="auth-decoration cloud cloud-two">
        ☁
      </div>

      <div className="auth-decoration flower flower-one">
        🌷
      </div>

      <div className="auth-card">

        {/* Heart */}
        <div className="auth-heart">
          ♥
        </div>

        {/* Heading */}
        <div className="auth-heading">
          <h1>Welcome Back</h1>

          <p>
            Login to continue your journey
          </p>
        </div>

        {/* 3D Yappr Girl */}
        <div className="auth-character">
          <img
            src="/images/yappr-girl.png"
            alt="Yappr girl"
            className="yappr-girl"
          />
        </div>

        {/* Login form */}
        <div className="auth-form-card">

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className="auth-input-wrapper">

              <div className="auth-input-icon">
                👤
              </div>

              <input
                type="email"
                placeholder="Email or Username"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

            </div>

            {/* Password */}
            <div className="auth-input-wrapper">

              <div className="auth-input-icon">
                🔒
              </div>

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

              <span className="password-eye">
                ◉
              </span>

            </div>

            <div className="forgot-password">
              Forgot Password?
            </div>

            <button
              type="submit"
              className="auth-button"
            >
              Login
            </button>

          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span></span>

            <p>or continue with</p>

            <span></span>
          </div>

          {/* Social buttons */}
          <div className="social-buttons">

            <button
              type="button"
              className="social-button google"
            >
              G
            </button>

            <button
              type="button"
              className="social-button apple"
            >
              
            </button>

            <button
              type="button"
              className="social-button facebook"
            >
              f
            </button>

          </div>

          {/* Register */}
          <p className="auth-switch">

            Don't have an account?

            <button
              type="button"
              onClick={() =>
                navigate("/register")
              }
            >
              Sign Up
            </button>

          </p>

        </div>

      </div>
    </div>
  );
}

export default Login;