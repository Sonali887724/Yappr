import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
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

      if (error.response) {
        // Server responded with an error
        setError(
          error.response.data?.message ||
            "Login failed. Please check your details."
        );
      } else if (error.request) {
        // Request was sent but server did not respond
        setError(
          "Unable to connect to the server. Please try again."
        );
      } else {
        // Something went wrong before request was sent
        setError(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
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
                disabled={isLoading}
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
                disabled={isLoading}
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
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
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
              disabled={isLoading}
            >
              G
            </button>

            <button
              type="button"
              className="social-button apple"
              disabled={isLoading}
            >
              
            </button>

            <button
              type="button"
              className="social-button facebook"
              disabled={isLoading}
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
              disabled={isLoading}
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