import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/profile.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");

  const [profilePicture, setProfilePicture] = useState("");
  const [previewPicture, setPreviewPicture] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          "http://localhost:5000/api/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const latestUser = response.data.user;

        setUser(latestUser);
        setName(latestUser.name || "");
        setProfilePicture(
          latestUser.profilePicture || ""
        );

        localStorage.setItem(
          "user",
          JSON.stringify(latestUser)
        );

      } catch (err) {
        console.error(
          "Profile fetch error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Could not load profile."
        );
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreviewPicture(reader.result);
      setError("");
      setMessage("");
    };

    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);

      const token = localStorage.getItem("token");

      const response = await axios.put(
        "http://localhost:5000/api/profile",
        {
          name: name.trim(),
          profilePicture:
            previewPicture || profilePicture
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedUser = {
        ...user,
        ...response.data.user
      };

      setUser(updatedUser);
      setName(updatedUser.name);
      setProfilePicture(
        updatedUser.profilePicture || ""
      );
      setPreviewPicture("");

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setIsEditing(false);
      setMessage(
        "Profile updated successfully!"
      );

    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Could not update profile. Please try again."
      );

    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <p>Loading profile...</p>;
  }

  const displayedPicture =
    previewPicture || profilePicture;

  return (
    <div className="profile-page">
      <div className="profile-card">

        <button
          type="button"
          className="profile-back-button"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>

        <div className="profile-avatar">
          {displayedPicture ? (
            <img
              src={displayedPicture}
              alt="Profile"
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>

        <h1>{user.name}</h1>

        <p className="profile-email">
          {user.email}
        </p>

        {message && (
          <p
            role="status"
            className="profile-success"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="profile-error"
          >
            {error}
          </p>
        )}

        <div className="profile-info">

          <div className="profile-info-item">
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>

          <div className="profile-info-item">
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>

          <div className="profile-info-item">
            <span>Status</span>
            <strong>
              {user.status || "Offline"}
            </strong>
          </div>

        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile}>

            <div className="profile-edit-field">
              <label htmlFor="profile-name">
                Your name
              </label>

              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
                maxLength={50}
              />
            </div>

            <div className="profile-picture-field">

              <label htmlFor="profile-picture">
                Profile Picture
              </label>

              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />

            </div>

            <button
              type="submit"
              className="edit-profile-button"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => {
                setName(user.name);
                setPreviewPicture("");
                setError("");
                setIsEditing(false);
              }}
            >
              Cancel
            </button>

          </form>
        ) : (
          <button
            type="button"
            className="edit-profile-button"
            onClick={() => {
              setName(user.name);
              setMessage("");
              setError("");
              setIsEditing(true);
            }}
          >
            Edit Profile
          </button>
        )}

      </div>
    </div>
  );
}

export default Profile;