const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

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
    }).sort({ createdAt: 1 });

    res.json(messages);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch messages",
      error: error.message
    });

  }

});


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});