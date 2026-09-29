import { useEffect, useState } from "react";
import axios from "axios";

import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

import "./App.css";

function App() {

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);


  // Get users from backend
  useEffect(() => {

    axios
      .get("http://localhost:5000/api/users")
      .then((response) => {

        setUsers(response.data);

        // Rahul will temporarily be the logged-in user
        const loggedInUser = response.data.find(
          (user) => user.name === "Rahul"
        );

        setCurrentUser(loggedInUser);

        // Select Aman as the first chat
        const firstChatUser = response.data.find(
          (user) => user.name !== "Rahul"
        );

        setSelectedUser(firstChatUser);

      })
      .catch((error) => {

        console.error("Error fetching users:", error);

      });

  }, []);


  return (
    <div className="app">

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
        />
      )}

    </div>
  );
}

export default App;