const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});


// Middleware
app.use(cors());
app.use(express.json());


// Home route
app.get("/", (req, res) => {
  res.send("Yappr Backend is running!");
});


// Get all users
app.get("/api/users", async (req, res) => {

  try {

    const users = await User.find();

    res.json(users);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });

  }

});


// Create a new user
app.post("/api/users", async (req, res) => {

  try {

    const { name, status } = req.body;

    const user = new User({
      name,
      status
    });

    const savedUser = await user.save();

    res.status(201).json(savedUser);

  } catch (error) {

    res.status(500).json({
      message: "Failed to create user",
      error: error.message
    });

  }

});


// Send a message
app.post("/api/messages", async (req, res) => {

  try {

    const { sender, receiver, text } = req.body;

    const message = new Message({
      sender,
      receiver,
      text
    });

    const savedMessage = await message.save();


    // Send message to receiver
    io.to(receiver).emit(
      "receive_message",
      savedMessage
    );


    res.status(201).json(savedMessage);

  } catch (error) {

    res.status(500).json({
      message: "Failed to send message",
      error: error.message
    });

  }

});


// Get messages between two users
app.get("/api/messages/:user1/:user2", async (req, res) => {

  try {

    const { user1, user2 } = req.params;

    const messages = await Message.find({

      $or: [

        {
          sender: user1,
          receiver: user2
        },

        {
          sender: user2,
          receiver: user1
        }

      ]

    }).sort({
      createdAt: 1
    });


    res.json(messages);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch messages",
      error: error.message
    });

  }

});


// Socket.IO connection
io.on("connection", (socket) => {

  console.log(
    "User connected:",
    socket.id
  );


  // User joins
  socket.on("join", async (userId) => {

    try {

      // Save user ID on this socket
      socket.userId = userId;


      // Join user's personal room
      socket.join(userId);


      console.log(
        `User ${userId} joined their room`
      );


      // Make user Online
      await User.findByIdAndUpdate(
        userId,
        {
          status: "Online"
        }
      );


      // Tell everyone that user is Online
      io.emit("user_status_changed", {

        userId: userId,

        status: "Online"

      });


    } catch (error) {

      console.error(
        "Error updating online status:",
        error.message
      );

    }

  });


  // User disconnects
  socket.on("disconnect", async () => {

    console.log(
      "User disconnected:",
      socket.id
    );


    if (!socket.userId) {
      return;
    }


    try {

      /*
       * Check whether this user still has
       * another Socket.IO connection.
       */

      const sockets = await io.in(
        socket.userId
      ).fetchSockets();


      /*
       * If another socket still exists,
       * the user is still Online.
       */

      if (sockets.length > 0) {

        console.log(
          `User ${socket.userId} is still Online`
        );

        return;

      }


      /*
       * No sockets remain.
       * Now the user is actually Offline.
       */

      await User.findByIdAndUpdate(
        socket.userId,
        {
          status: "Offline"
        }
      );


      console.log(
        `User ${socket.userId} is now Offline`
      );


      // Tell everyone
      io.emit("user_status_changed", {

        userId: socket.userId,

        status: "Offline"

      });


    } catch (error) {

      console.error(
        "Error updating offline status:",
        error.message
      );

    }

  });

});


// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(
    `Server running on http://localhost:${PORT}`
  );

});