import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

import "./App.css";

function App() {

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  const [socket, setSocket] = useState(null);


  // Get users from backend
  useEffect(() => {

    axios
      .get("http://localhost:5000/api/users")
      .then((response) => {

        setUsers(response.data);

        const loggedInUser = response.data.find(
          (user) => user.name === "Rahul"
        );

        setCurrentUser(loggedInUser);

      })
      .catch((error) => {

        console.error("Error fetching users:", error);

      });

  }, []);


  // Create ONE Socket.IO connection
  useEffect(() => {

    if (!currentUser) {
      return;
    }


    console.log(
      "Connecting Socket.IO for:",
      currentUser.name
    );


    const newSocket = io("http://localhost:5000");


    // Save socket in state
    setSocket(newSocket);


    // Socket connected
    newSocket.on("connect", () => {

      console.log(
        "Connected to Socket.IO:",
        newSocket.id
      );


      // Join current user's room
      newSocket.emit("join", currentUser._id);

    });


    // Listen for status changes
    newSocket.on("user_status_changed", (data) => {

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

    });


    // Cleanup
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

    if (!currentUser || users.length === 0) {
      return;
    }


    if (selectedUser) {
      return;
    }


    const firstChatUser = users.find(
      (user) => user._id !== currentUser._id
    );


    setSelectedUser(firstChatUser);

  }, [currentUser, users, selectedUser]);


  // Change current user
  const handleUserChange = (e) => {

    const user = users.find(
      (user) => user._id === e.target.value
    );


    setCurrentUser(user);

    setSelectedUser(null);

  };


  return (
    <div className="app">

      {/* Temporary current user selector */}

      <div className="current-user-selector">

        <label>
          Logged in as:
        </label>


        <select
          value={currentUser?._id || ""}
          onChange={handleUserChange}
        >

          {users.map((user) => (

            <option
              key={user._id}
              value={user._id}
            >
              {user.name}
            </option>

          ))}

        </select>

      </div>


      <Sidebar
        users={users.filter(
          (user) => user._id !== currentUser?._id
        )}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
      />


      {selectedUser && currentUser && (
        <ChatWindow
          selectedUser={selectedUser}
          currentUser={currentUser}
          socket={socket}
        />
      )}

    </div>
  );
}

export default App;