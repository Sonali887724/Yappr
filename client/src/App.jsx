import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import Register from "./pages/Register";
import Login from "./pages/Login";

import "./App.css";


function ChatApp() {

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  const [socket, setSocket] = useState(null);


  // Get logged-in user from localStorage
  useEffect(() => {

    const savedUser =
      localStorage.getItem("user");


    if (savedUser) {

      setCurrentUser(
        JSON.parse(savedUser)
      );

    }

  }, []);


  // Get users from backend
  // This runs only after currentUser is loaded
  useEffect(() => {

    if (!currentUser) {
      return;
    }


    const token =
      localStorage.getItem("token");


    if (!token) {
      return;
    }


    axios
      .get(
        "http://localhost:5000/api/users",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      .then((response) => {

        console.log(
          "Users fetched successfully:",
          response.data
        );


        setUsers(response.data);

      })
      .catch((error) => {

        console.error(
          "Error fetching users:",
          error
        );

      });

  }, [currentUser]);


  // Create ONE Socket.IO connection
  useEffect(() => {

    if (!currentUser) {
      return;
    }


    console.log(
      "Connecting Socket.IO for:",
      currentUser.name
    );


    const newSocket =
      io("http://localhost:5000");


    setSocket(newSocket);


    // Socket connected
    newSocket.on("connect", () => {

      console.log(
        "Connected to Socket.IO:",
        newSocket.id
      );


      // Join current user's room
      newSocket.emit(
        "join",
        currentUser._id
      );

    });


    // Listen for status changes
    newSocket.on(
      "user_status_changed",
      (data) => {

        console.log(
          "Status changed:",
          data.userId,
          data.status
        );


        // Update users list
        setUsers((previousUsers) =>
          previousUsers.map((user) =>
            user._id === data.userId
              ? {
                  ...user,
                  status: data.status
                }
              : user
          )
        );


        // Update selected user's status
        setSelectedUser((previousUser) => {

          if (
            previousUser &&
            previousUser._id === data.userId
          ) {

            return {
              ...previousUser,
              status: data.status
            };

          }


          return previousUser;

        });

      }
    );


    // Cleanup Socket.IO connection
    return () => {

      console.log(
        "Disconnecting Socket.IO for:",
        currentUser.name
      );


      newSocket.disconnect();

      setSocket(null);

    };

  }, [currentUser]);


  // Select first chat user
  useEffect(() => {

    if (
      !currentUser ||
      users.length === 0
    ) {
      return;
    }


    if (selectedUser) {
      return;
    }


    const firstChatUser =
      users.find(
        (user) =>
          user._id !== currentUser._id
      );


    if (firstChatUser) {

      setSelectedUser(
        firstChatUser
      );

    }

  }, [
    currentUser,
    users,
    selectedUser
  ]);


  // Logout
  const handleLogout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("user");


    if (socket) {

      socket.disconnect();

    }


    setCurrentUser(null);

    setSelectedUser(null);

    setSocket(null);


    window.location.href =
      "/login";

  };


  return (
    <div className="app">

      {/* Logged-in user */}

      {currentUser && (

        <div className="current-user-selector">

          <label>
            Logged in as:
          </label>


          <strong>
            {currentUser.name}
          </strong>


          <button
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      )}


      <Sidebar
        users={users.filter(
          (user) =>
            user._id !== currentUser?._id
        )}
        selectedUser={selectedUser}
        setSelectedUser={
          setSelectedUser
        }
      />


      {selectedUser &&
        currentUser && (

          <ChatWindow
            selectedUser={
              selectedUser
            }
            currentUser={
              currentUser
            }
            socket={socket}
          />

        )}

    </div>
  );
}


/*
  Protected Route

  This checks whether the user
  has logged in before allowing
  access to the chat.
*/
function ProtectedRoute({
  children
}) {

  const token =
    localStorage.getItem("token");


  if (!token) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  return children;
}


function App() {

  return (
    <BrowserRouter>

      <Routes>

        {/* Protected Chat */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatApp />
            </ProtectedRoute>
          }
        />


        {/* Register */}

        <Route
          path="/register"
          element={
            <Register />
          }
        />


        {/* Login */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        {/* Unknown URL */}

        <Route
          path="*"
          element={
            <Navigate to="/" />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;