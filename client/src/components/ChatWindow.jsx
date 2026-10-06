import { useEffect, useRef, useState } from "react";

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;


function ChatWindow({
  selectedUser,
  currentUser,
  socket,
  onMessageSent
}) {

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const [isTyping, setIsTyping] = useState(false);

  const [error, setError] = useState("");


  const messagesContainerRef = useRef(null);


  // Timer for sender
  const typingTimeoutRef = useRef(null);

  // Timer for receiver
  const receiverTypingTimeoutRef = useRef(null);


  // JWT token
  const token = localStorage.getItem("token");


  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };


  // ==========================================
  // RECEIVE REAL-TIME MESSAGE
  // ==========================================

  useEffect(() => {

    if (!socket || !currentUser || !selectedUser) {
      return;
    }


    const handleReceiveMessage = (newMessage) => {

      console.log(
        "New real-time message:",
        newMessage
      );


      if (
        newMessage.sender === selectedUser._id &&
        newMessage.receiver === currentUser._id
      ) {

        setMessages((previousMessages) => [

          ...previousMessages,

          {
            id: newMessage._id,
            sender: selectedUser.name,
            text: newMessage.text,
            createdAt: newMessage.createdAt
          }

        ]);

      }

    };


    socket.on(
      "receive_message",
      handleReceiveMessage
    );


    return () => {

      socket.off(
        "receive_message",
        handleReceiveMessage
      );

    };

  }, [socket, selectedUser, currentUser]);


  // ==========================================
  // RECEIVE TYPING EVENT
  // ==========================================

  useEffect(() => {

    if (!socket || !currentUser || !selectedUser) {
      return;
    }


    const handleUserTyping = (data) => {

      console.log(
        "USER TYPING EVENT RECEIVED:",
        data
      );


      if (
        data.sender === selectedUser._id
      ) {

        console.log(
          "Typing user matches selected user"
        );


        console.log(
          "SETTING isTyping TO TRUE"
        );


        // Show typing indicator
        setIsTyping(true);


        // Clear previous receiver timer
        if (
          receiverTypingTimeoutRef.current
        ) {

          clearTimeout(
            receiverTypingTimeoutRef.current
          );

        }


        // Keep indicator visible
        // until typing stops
        receiverTypingTimeoutRef.current =
          setTimeout(() => {

            console.log(
              "RECEIVER TYPING TIMEOUT"
            );


            setIsTyping(false);

          }, 3500);

      }

    };


    const handleUserStopTyping = (data) => {

      console.log(
        "USER STOP TYPING EVENT RECEIVED:",
        data
      );


      if (
        data.sender === selectedUser._id
      ) {

        console.log(
          "STOP TYPING MATCHED USER"
        );


        setIsTyping(false);


        if (
          receiverTypingTimeoutRef.current
        ) {

          clearTimeout(
            receiverTypingTimeoutRef.current
          );


          receiverTypingTimeoutRef.current =
            null;

        }

      }

    };


    socket.on(
      "user_typing",
      handleUserTyping
    );


    socket.on(
      "user_stop_typing",
      handleUserStopTyping
    );


    return () => {

      socket.off(
        "user_typing",
        handleUserTyping
      );


      socket.off(
        "user_stop_typing",
        handleUserStopTyping
      );


      if (
        receiverTypingTimeoutRef.current
      ) {

        clearTimeout(
          receiverTypingTimeoutRef.current
        );

      }

    };

  }, [socket, selectedUser, currentUser]);


  // ==========================================
  // GET OLD MESSAGES
  // ==========================================

  useEffect(() => {

    if (!selectedUser || !currentUser) {
      return;
    }


    setError("");


    axios
      .get(
        `${API_URL}/api/messages/${currentUser._id}/${selectedUser._id}`,
        authConfig
      )

      .then((response) => {

        const formattedMessages =
          response.data.map(
            (item) => ({

              id: item._id,

              sender:
                item.sender === currentUser._id
                  ? "You"
                  : selectedUser.name,

              text: item.text,

              createdAt: item.createdAt

            })
          );


        setMessages(
          formattedMessages
        );

      })

      .catch((error) => {

        console.error(
          "Error fetching messages:",
          error
        );


        if (error.response) {

          setError(
            error.response.data?.message ||
              "Unable to load messages."
          );

        } else if (error.request) {

          setError(
            "Unable to connect to the server."
          );

        } else {

          setError(
            "Something went wrong while loading messages."
          );

        }

      });

  }, [selectedUser, currentUser]);


  // ==========================================
  // SCROLL TO BOTTOM
  // ==========================================

  useEffect(() => {

    if (messagesContainerRef.current) {

      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;

    }

  }, [messages, isTyping]);


  // ==========================================
  // HANDLE TYPING
  // ==========================================

  const handleTyping = (e) => {

    const value = e.target.value;


    console.log(
      "TYPING FUNCTION CALLED:",
      value
    );


    setMessage(value);


    // Clear previous sender timer
    if (typingTimeoutRef.current) {

      clearTimeout(
        typingTimeoutRef.current
      );

    }


    if (!socket) {

      console.log(
        "NO SOCKET AVAILABLE"
      );


      return;

    }


    if (!currentUser) {

      console.log(
        "NO CURRENT USER"
      );


      return;

    }


    if (!selectedUser) {

      console.log(
        "NO SELECTED USER"
      );


      return;

    }


    console.log(
      "SENDING TYPING EVENT:",
      {
        sender: currentUser._id,
        receiver: selectedUser._id
      }
    );


    // Tell receiver that user is typing
    socket.emit(
      "typing",
      {
        sender: currentUser._id,
        receiver: selectedUser._id
      }
    );


    // Tell receiver that typing stopped
    // after 3 seconds
    typingTimeoutRef.current =
      setTimeout(() => {

        console.log(
          "SENDING STOP TYPING EVENT"
        );


        socket.emit(
          "stop_typing",
          {
            sender: currentUser._id,
            receiver: selectedUser._id
          }
        );

      }, 3000);

  };


  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const handleSend = async () => {

    if (message.trim() === "") {
      return;
    }


    setError("");


    try {

      const response =
        await axios.post(

          `${API_URL}/api/messages`,

          {
            receiver: selectedUser._id,
            text: message
          },

          authConfig

        );


      setMessages(
        (previousMessages) => [

          ...previousMessages,

          {
            id: response.data._id,
            sender: "You",
            text: response.data.text,
            createdAt:
              response.data.createdAt
          }

        ]
      );


      setMessage("");


      if (onMessageSent) {
        onMessageSent();
      }


      // Stop typing
      if (typingTimeoutRef.current) {

        clearTimeout(
          typingTimeoutRef.current
        );


        typingTimeoutRef.current =
          null;

      }


      if (socket) {

        socket.emit(
          "stop_typing",
          {
            sender: currentUser._id,
            receiver: selectedUser._id
          }
        );

      }

    } catch (error) {

      console.error(
        "Error sending message:",
        error
      );


      if (error.response) {

        setError(
          error.response.data?.message ||
            "Unable to send message."
        );

      } else if (error.request) {

        setError(
          "Unable to connect to the server."
        );

      } else {

        setError(
          "Something went wrong while sending the message."
        );

      }

    }

  };


  // ==========================================
  // ENTER TO SEND
  // ==========================================

  const handleKeyDown = (e) => {

    if (e.key === "Enter") {
      handleSend();
    }

  };


  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (date) => {

    return new Date(date).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  };


  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="chat-window">

      {/* Chat Header */}

      <div className="chat-header">

        <div className="avatar">

          {selectedUser.profilePicture ? (

            <img
              src={selectedUser.profilePicture}
              alt="Profile"
            />

          ) : (

            selectedUser.name.charAt(0).toUpperCase()

          )}

        </div>


        <div>

          <h3>
            {selectedUser.name}
          </h3>


          <div className="chat-user-status">

            <span
              className={
                selectedUser.status === "Online"
                  ? "online-dot"
                  : "offline-dot"
              }
            >
            </span>


            <p>
              {selectedUser.status}
            </p>

          </div>

        </div>

      </div>


      {/* Messages */}

      <div
        className="messages"
        ref={messagesContainerRef}
      >

        {error && (

          <div className="auth-error">
            {error}
          </div>

        )}


        {messages.map((message) => (

          <div
            key={message.id}
            className={`message ${
              message.sender === "You"
                ? "sent"
                : "received"
            }`}
          >

            <p>
              {message.text}
            </p>


            <span className="message-time">

              {formatTime(
                message.createdAt
              )}

            </span>

          </div>

        ))}


        {/* Typing Indicator */}

        {isTyping && (

          <div className="typing-indicator">

            {selectedUser.name} is typing...

          </div>

        )}

      </div>


      {/* Message Input */}

      <div className="message-input">

        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
        />


        <button
          onClick={handleSend}
        >
          Send
        </button>

      </div>

    </div>

  );

}


export default ChatWindow;