const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");
const authMiddleware = require("./middleware/authMiddleware");

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
// Get all users
// Protected route
app.get(
  "/api/users",
  authMiddleware,
  async (req, res) => {

    try {

      const users = await User.find();

      res.json(users);

    } catch (error) {

      console.error(
        "Error fetching users:",
        error.message
      );


      res.status(500).json({

        message: "Failed to fetch users",

        error: error.message

      });

    }

  }
);

// Register a new user
app.post("/api/auth/register", async (req, res) => {

  try {

    const { name, email, password } = req.body;


    if (!name || !email || !password) {

      return res.status(400).json({
        message: "Name, email and password are required"
      });

    }


    const existingUser = await User.findOne({
      email
    });


    if (existingUser) {

      return res.status(400).json({
        message: "Email already registered"
      });

    }


    const hashedPassword = await bcrypt.hash(
      password,
      10
    );


    const user = new User({

      name,

      email,

      password: hashedPassword,

      status: "Offline"

    });


    const savedUser = await user.save();


    const userResponse = {

      _id: savedUser._id,

      name: savedUser.name,

      email: savedUser.email,

      status: savedUser.status

    };


    res.status(201).json({

      message: "User registered successfully",

      user: userResponse

    });

  } catch (error) {

    res.status(500).json({

      message: "Failed to register user",

      error: error.message

    });

  }

});


// Login user
app.post("/api/auth/login", async (req, res) => {

  try {

    const { email, password } = req.body;


    if (!email || !password) {

      return res.status(400).json({
        message: "Email and password are required"
      });

    }


    const user = await User.findOne({
      email
    });


    if (!user) {

      return res.status(401).json({
        message: "Invalid email or password"
      });

    }


    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );


    if (!passwordMatch) {

      return res.status(401).json({
        message: "Invalid email or password"
      });

    }


    const token = jwt.sign(

      {
        userId: user._id
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "1d"
      }

    );


    const userResponse = {

      _id: user._id,

      name: user.name,

      email: user.email,

      status: user.status

    };


    res.json({

      message: "Login successful",

      token,

      user: userResponse

    });

  } catch (error) {

    res.status(500).json({

      message: "Login failed",

      error: error.message

    });

  }

});


// Send a message
// Protected route
// Send a message
// Protected route
app.post(
  "/api/messages",
  authMiddleware,
  async (req, res) => {

    try {

      // Get receiver and message text
      // Sender will come from JWT
      const {
        receiver,
        text
      } = req.body;


      // Get logged-in user's ID
      // from the verified JWT token
      const sender = req.user.userId;


      // Check required fields
      if (!receiver || !text) {

        return res.status(400).json({
          message: "Receiver and message text are required"
        });

      }


      // Create message
      const message = new Message({

        sender,

        receiver,

        text

      });


      // Save message in MongoDB
      const savedMessage =
        await message.save();


      // Send message to receiver
      io.to(receiver).emit(
        "receive_message",
        savedMessage
      );


      // Send saved message back to sender
      res.status(201).json(
        savedMessage
      );

    } catch (error) {

      console.error(
        "Error sending message:",
        error.message
      );


      res.status(500).json({

        message: "Failed to send message",

        error: error.message

      });

    }

  }
);


// Get messages between two users
// Protected route
app.get(
  "/api/messages/:user1/:user2",
  authMiddleware,
  async (req, res) => {

    try {

      const {
        user1,
        user2
      } = req.params;


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

  }
);


// Socket.IO connection
io.on("connection", (socket) => {

  console.log(
    "User connected:",
    socket.id
  );


  // User joins
  socket.on("join", async (userId) => {

    try {

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


      // Tell everyone
      io.emit(
        "user_status_changed",
        {

          userId: userId,

          status: "Online"

        }
      );

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

      // Check whether another connection
      // for this user still exists
      const sockets = await io
        .in(socket.userId)
        .fetchSockets();


      if (sockets.length > 0) {

        console.log(
          `User ${socket.userId} is still Online`
        );

        return;

      }


      // No connections remain
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
      io.emit(
        "user_status_changed",
        {

          userId: socket.userId,

          status: "Offline"

        }
      );

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