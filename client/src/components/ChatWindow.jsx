import { useEffect, useRef, useState } from "react";
import axios from "axios";

function ChatWindow({ selectedUser, currentUser }) {

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);


  // Get messages from MongoDB
  useEffect(() => {

    if (!selectedUser || !currentUser) {
      return;
    }

    axios
      .get(
        `http://localhost:5000/api/messages/${currentUser._id}/${selectedUser._id}`
      )
      .then((response) => {

        const formattedMessages = response.data.map((item) => ({

          id: item._id,

          sender:
            item.sender === currentUser._id
              ? "You"
              : selectedUser.name,

          text: item.text,

          createdAt: item.createdAt

        }));

        setMessages(formattedMessages);

      })
      .catch((error) => {

        console.error("Error fetching messages:", error);

      });

  }, [selectedUser, currentUser]);


  // Scroll to the latest message
  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages]);


  // Send message
  const handleSend = async () => {

    if (message.trim() === "") {
      return;
    }

    try {

      const response = await axios.post(
        "http://localhost:5000/api/messages",
        {
          sender: currentUser._id,
          receiver: selectedUser._id,
          text: message
        }
      );

      setMessages([
        ...messages,
        {
          id: response.data._id,
          sender: "You",
          text: response.data.text,
          createdAt: response.data.createdAt
        }
      ]);

      setMessage("");

    } catch (error) {

      console.error("Error sending message:", error);

    }

  };


  // Send message when Enter is pressed
  const handleKeyDown = (e) => {

    if (e.key === "Enter") {
      handleSend();
    }

  };


  // Format message time
  const formatTime = (date) => {

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

  };


  return (
    <div className="chat-window">

      {/* Chat Header */}

      <div className="chat-header">

        <div className="avatar">
          {selectedUser.name.charAt(0)}
        </div>

        <div>
          <h3>{selectedUser.name}</h3>
          <p>{selectedUser.status}</p>
        </div>

      </div>


      {/* Messages */}

      <div className="messages">

        {messages.map((message) => (

          <div
            key={message.id}
            className={`message ${
              message.sender === "You"
                ? "sent"
                : "received"
            }`}
          >

            <p>{message.text}</p>

            <span className="message-time">
              {formatTime(message.createdAt)}
            </span>

          </div>

        ))}

        {/* Invisible element used for scrolling */}

        <div ref={messagesEndRef}></div>

      </div>


      {/* Message Input */}

      <div className="message-input">

        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button onClick={handleSend}>
          Send
        </button>

      </div>

    </div>
  );
}

export default ChatWindow;