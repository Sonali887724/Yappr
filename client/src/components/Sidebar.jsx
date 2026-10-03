import { useState } from "react";
import axios from "axios";

function Sidebar({
  users,
  selectedUser,
  setSelectedUser,
  currentUser,
  handleLogout,
  handleStartChat
}) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (value) => {
    setSearch(value);

    if (value.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `http://localhost:5000/api/users/search?q=${encodeURIComponent(value)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSearchResults(response.data);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    }
  };

  const isAlreadyChat = (userId) => {
    return users.some(
      (user) => user._id === userId
    );
  };

  const handleOpenChat = (user) => {
    setSelectedUser(user);
    setSearch("");
    setSearchResults([]);
    setIsSearching(false);
  };

  return (
    <div className="sidebar">

      <h2>Yappr</h2>

      <div className="search">
        <input
          type="text"
          placeholder="Search people..."
          value={search}
          onChange={(e) =>
            handleSearch(e.target.value)
          }
        />
      </div>

      {isSearching && (
        <>
          <div className="chat-section-title">
            People
          </div>

          <div className="user-list">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user._id}
                  className="user"
                >
                  <div className="avatar">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p>{user.email}</p>
                  </div>

                  {isAlreadyChat(user._id) ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenChat(user)
                      }
                      style={{
                        padding: "6px 10px",
                        fontSize: "12px",
                        border: "none",
                        borderRadius: "6px",
                        background: "#4f46e5",
                        color: "white",
                        cursor: "pointer"
                      }}
                    >
                      Open Chat
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleStartChat(user)
                      }
                      style={{
                        padding: "6px 10px",
                        fontSize: "12px",
                        border: "none",
                        borderRadius: "6px",
                        background: "#4f46e5",
                        color: "white",
                        cursor: "pointer"
                      }}
                    >
                      Start Chat
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p
                style={{
                  padding: "10px",
                  color: "#888",
                  fontSize: "13px"
                }}
              >
                No users found
              </p>
            )}
          </div>
        </>
      )}

      {!isSearching && (
        <>
          <div className="chat-section-title">
            Chats
          </div>

          <div className="user-list">
            {users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user._id}
                  className={`user ${
                    selectedUser &&
                    selectedUser._id === user._id
                      ? "selected-user"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedUser(user)
                  }
                >
                  <div className="avatar">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="user-info">
                    <h4>{user.name}</h4>

                    <p className="last-message">
                      {user.lastMessage
                        ? user.lastMessage.text
                        : "No messages yet"}
                    </p>

                    <div className="user-status">
                      <span
                        className={
                          user.status === "Online"
                            ? "online-dot"
                            : "offline-dot"
                        }
                      ></span>

                      <p>{user.status}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p
                style={{
                  padding: "10px",
                  color: "#888",
                  fontSize: "13px"
                }}
              >
                No conversations yet
              </p>
            )}
          </div>
        </>
      )}

      {/* CURRENT USER */}

      {currentUser && (
        <div className="sidebar-user">

          <div className="sidebar-user-info">

            <div className="avatar">
              {currentUser.profilePicture ? (
                <img
                  src={currentUser.profilePicture}
                  alt="Profile"
                />
              ) : (
                currentUser.name
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            <div>
              <strong>
                {currentUser.name}
              </strong>

              <p>
                Logged in
              </p>
            </div>

          </div>

          <div className="sidebar-user-actions">

            <button
              type="button"
              onClick={() => {
                window.location.href = "/profile";
              }}
            >
              Profile
            </button>

            <button
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default Sidebar;