import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  const navigate = useNavigate();


  const handleLogin = async (e) => {

    e.preventDefault();

    setMessage("");


    try {

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password
        }
      );


      console.log(
        "Login successful:",
        response.data
      );


      // Get token and user from backend
      const token = response.data.token;

      const user = response.data.user;


      // Save login information
      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );


      setMessage(
        "Login successful!"
      );


      // Go to chat application
      navigate("/");

    } catch (error) {

      console.error(
        "Login error:",
        error
      );


      setMessage(
        error.response?.data?.message ||
        "Login failed"
      );

    }

  };


  return (
    <div className="register-page">

      <div className="register-box">

        <h1>Yappr</h1>

        <h2>Login</h2>


        <form onSubmit={handleLogin}>

          {/* Email */}

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />


          {/* Password */}

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />


          {/* Login button */}

          <button type="submit">
            Login
          </button>

        </form>


        {/* Result message */}

        {message && (
          <p>
            {message}
          </p>
        )}

      </div>

    </div>
  );
}

export default Login;