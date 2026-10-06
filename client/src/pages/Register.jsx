import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    setMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        {
          name,
          email,
          password,
        }
      );

      console.log(response.data);

      setMessage("Registration successful!");

      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Registration error:", error);

      if (error.response) {
        // Server responded with an error
        setMessage(
          error.response.data?.message ||
            "Registration failed. Please check your details."
        );
      } else if (error.request) {
        // Request was sent but server did not respond
        setMessage(
          "Unable to connect to the server. Please try again."
        );
      } else {
        // Something went wrong before request was sent
        setMessage(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Decorations */}
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

        {/* Heading */}
        <div className="auth-heading">
          <h1>Create Account</h1>

          <p>
            Join Yappr and start chatting
          </p>
        </div>

        {/* Character */}
        <div className="auth-character">
          <img
            src="/images/yappr-girl.png"
            alt="Yappr girl"
            className="yappr-girl"
          />
        </div>

        {/* Registration Form */}
        <div className="auth-form-card">

          {message && (
            <div
              className={
                message === "Registration successful!"
                  ? "auth-success"
                  : "auth-error"
              }
            >
              {message}
            </div>
          )}

          <form onSubmit={handleRegister}>

            {/* Name */}
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                👤
              </div>

              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                ✉️
              </div>

              <input
                type="email"
                placeholder="Email Address"
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
                placeholder="Create Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                disabled={isLoading}
              />
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading
                ? "Creating account..."
                : "Create Account"}
            </button>

          </form>

          {/* Login Link */}
          <p className="auth-switch">
            Already have an account?

            <button
              type="button"
              onClick={() =>
                (window.location.href = "/login")
              }
              disabled={isLoading}
            >
              Login
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Register;