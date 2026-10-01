import { useState } from "react";
import axios from "axios";

function Register() {

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");


  const handleRegister = async (e) => {

    e.preventDefault();

    setMessage("");


    try {

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name,
          email,
          password
        }
      );


      console.log(
        "Registration successful:",
        response.data
      );


      setMessage(
        "Registration successful!"
      );


      // Clear form
      setName("");
      setEmail("");
      setPassword("");

    } catch (error) {

      console.error(
        "Registration error:",
        error
      );


      setMessage(
        error.response?.data?.message ||
        "Registration failed"
      );

    }

  };


  return (
    <div className="register-page">

      <div className="register-box">

        <h1>Yappr</h1>

        <h2>Create Account</h2>


        <form onSubmit={handleRegister}>

          {/* Name */}

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />


          {/* Email */}

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />


          {/* Password */}

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />


          {/* Register button */}

          <button type="submit">
            Register
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

export default Register;