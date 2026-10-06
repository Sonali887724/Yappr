import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

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
import Profile from "./pages/Profile";

import "./styles/app.css";
import "./styles/sidebar.css";
import "./styles/chat.css";
import "./styles/auth.css";
import "./styles/responsive.css";


function ChatApp() {

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [socket, setSocket] =
    useState(null);


  // =====================================================
  // FETCH MY CONVERSATIONS
  // =====================================================

  const fetchConversations = async () => {

    if (!currentUser) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {

      const response =
        await axios.get(
          `${API_URL}/api/conversations`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );


      console.log(
        "Conversations fetched:",
        response.data
      );


      const chatUsers =
        response.data
          .map(
            (conversation) => {

              const otherUser =
                conversation.participants.find(
                  (user) =>
                    user._id !==
                    currentUser._id
                );


              if (!otherUser) {
                return null;
              }


              return {

                ...otherUser,

                lastMessage:
                  conversation.lastMessage

              };

            }
          )
          .filter(Boolean);


      console.log(
        "Chat users:",
        chatUsers
      );


      setUsers(chatUsers);


    } catch (error) {

      console.error(
        "Error fetching conversations:",
        error
      );

    }

  };


  // =====================================================
  // GET CURRENT USER FROM BACKEND
  // =====================================================

  useEffect(() => {

    const fetchCurrentUser = async () => {

      const token =
        localStorage.getItem("token");


      if (!token) {
        return;
      }


      try {

        const response =
          await axios.get(
            `${API_URL}/api/profile`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );


        const latestUser =
          response.data.user;


        setCurrentUser(
          latestUser
        );


        localStorage.setItem(
          "user",
          JSON.stringify(latestUser)
        );


      } catch (error) {

        console.error(
          "Error fetching current user:",
          error
        );


        const savedUser =
          localStorage.getItem("user");


        if (savedUser) {

          setCurrentUser(
            JSON.parse(savedUser)
          );

        }

      }

    };


    fetchCurrentUser();

  }, []);


  // =====================================================
  // FETCH CONVERSATIONS
  // =====================================================

  useEffect(() => {

    fetchConversations();

  }, [currentUser]);


  // =====================================================
  // SOCKET.IO CONNECTION
  // =====================================================

  useEffect(() => {

    if (!currentUser) {
      return;
    }


    console.log(
      "Connecting Socket.IO for:",
      currentUser.name
    );


    const newSocket =
      io(`${API_URL}`);


    setSocket(newSocket);


    newSocket.on("connect", () => {

      console.log(
        "Connected to Socket.IO:",
        newSocket.id
      );


      newSocket.emit(
        "join",
        currentUser._id
      );

    });


    // USER ONLINE / OFFLINE STATUS

    newSocket.on(
      "user_status_changed",
      (data) => {

        console.log(
          "Status changed:",
          data.userId,
          data.status
        );


        setUsers(
          (previousUsers) =>

            previousUsers.map(
              (user) =>

                user._id === data.userId
                  ? {
                      ...user,
                      status: data.status
                    }
                  : user
            )
        );


        setSelectedUser(
          (previousUser) => {

            if (
              previousUser &&
              previousUser._id ===
                data.userId
            ) {

              return {

                ...previousUser,

                status: data.status

              };

            }


            return previousUser;

          }
        );

      }
    );


    return () => {

      console.log(
        "Disconnecting Socket.IO for:",
        currentUser.name
      );


      newSocket.disconnect();

      setSocket(null);

    };

  }, [currentUser]);


  // =====================================================
  // LOGOUT
  // =====================================================

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


  // =====================================================
  // START CHAT
  // =====================================================

  const handleStartChat = async (user) => {

    try {

      const token =
        localStorage.getItem("token");


      const response =
        await axios.post(

          `${API_URL}/api/conversations`,

          {
            userId: user._id
          },

          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }

        );


      console.log(
        "Conversation created/found:",
        response.data
      );


      const otherUser =
        response.data.participants.find(
          (participant) =>
            participant._id !==
            currentUser._id
        );


      if (!otherUser) {
        return;
      }


      setUsers(
        (previousUsers) => {

          const alreadyExists =
            previousUsers.some(
              (existingUser) =>
                existingUser._id ===
                otherUser._id
            );


          if (alreadyExists) {

            return previousUsers.map(
              (existingUser) =>

                existingUser._id ===
                otherUser._id

                  ? {
                      ...existingUser,
                      ...otherUser
                    }

                  : existingUser
            );

          }


          return [

            ...previousUsers,

            {
              ...otherUser,
              lastMessage: null
            }

          ];

        }
      );


      setSelectedUser(
        otherUser
      );


    } catch (error) {

      console.error(
        "Error starting conversation:",
        error
      );

    }

  };


  // =====================================================
  // MAIN UI
  // =====================================================

  return (

    <div className={`app ${selectedUser ? "chat-open" : ""}`}>

      <Sidebar

        users={users}

        selectedUser={
          selectedUser
        }

        setSelectedUser={
          setSelectedUser
        }

        currentUser={
          currentUser
        }

        handleLogout={
          handleLogout
        }

        handleStartChat={
          handleStartChat
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

            socket={
              socket
            }

            onMessageSent={
              fetchConversations
            }

            onBack={() =>
              setSelectedUser(null)
            }

          />

        )}

    </div>

  );

}


// =====================================================
// PROTECTED ROUTE
// =====================================================

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


// =====================================================
// APP
// =====================================================

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/profile"
          element={

            localStorage.getItem("token") ? (

              <Profile />

            ) : (

              <Navigate to="/login" />

            )

          }
        />


        <Route
          path="/"
          element={

            <ProtectedRoute>

              <ChatApp />

            </ProtectedRoute>

          }
        />


        <Route
          path="/register"
          element={
            <Register />
          }
        />


        <Route
          path="/login"
          element={
            <Login />
          }
        />


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