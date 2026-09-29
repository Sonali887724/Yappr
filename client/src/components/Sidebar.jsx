import { useState } from "react";

function Sidebar({ users, selectedUser, setSelectedUser }) {

  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar">

      <h2>Yappr</h2>

      {/* Search */}

      <div className="search">

        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* User List */}

      <div className="user-list">

        {filteredUsers.map((user) => (

          <div
            key={user.id}
            className={`user ${
              selectedUser.id === user.id
                ? "selected-user"
                : ""
            }`}
            onClick={() => setSelectedUser(user)}
          >

            <div className="avatar">
              {user.name.charAt(0)}
            </div>

            <div>
              <h4>{user.name}</h4>
              <p>{user.status}</p>
            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default Sidebar;