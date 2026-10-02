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
const Conversation = require("./models/Conversation");
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


// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.send("Yappr Backend is running!");
});


// =====================================================
// GET ALL USERS
// =====================================================

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


// =====================================================
// SEARCH USERS
// =====================================================

app.get(
  "/api/users/search",
  authMiddleware,
  async (req, res) => {

    try {

      const search = req.query.q;

      // If search box is empty
      if (!search || search.trim() === "") {

        return res.json([]);

      }


      const users = await User.find({

        // Do not show the logged-in user
        _id: {
          $ne: req.user.userId
        },

        // Search by name OR email
        $or: [

          {
            name: {
              $regex: search,
              $options: "i"
            }
          },

          {
            email: {
              $regex: search,
              $options: "i"
            }
          }

        ]

      }).select(
        "_id name email status"
      );


      res.json(users);

    } catch (error) {

      console.error(
        "User search error:",
        error.message
      );

      res.status(500).json({
        message: "Error searching users"
      });

    }

  }
);


// =====================================================
// CREATE OR GET A CONVERSATION
// =====================================================

app.post(
  "/api/conversations",
  authMiddleware,
  async (req, res) => {

    try {

      const { userId } = req.body;

      const currentUserId =
        req.user.userId;


      if (!userId) {

        return res.status(400).json({
          message: "User ID is required"
        });

      }


      if (
        currentUserId.toString() ===
        userId.toString()
      ) {

        return res.status(400).json({
          message: "You cannot chat with yourself"
        });

      }


      // Check whether conversation already exists

      let conversation =
        await Conversation.findOne({

          participants: {
            $all: [
              currentUserId,
              userId
            ]
          }

        }).populate(
          "participants",
          "_id name email status"
        );


      // If conversation does not exist,
      // create a new one

      if (!conversation) {

        conversation =
          await Conversation.create({

            participants: [
              currentUserId,
              userId
            ]

          });


        conversation =
          await Conversation.findById(
            conversation._id
          ).populate(
            "participants",
            "_id name email status"
          );

      }


      res.status(200).json(
        conversation
      );

    } catch (error) {

      console.error(
        "Conversation error:",
        error.message
      );


      res.status(500).json({

        message:
          "Failed to create conversation",

        error:
          error.message

      });

    }

  }
);


// =====================================================
// GET MY CONVERSATIONS
// =====================================================

app.get(
  "/api/conversations",
  authMiddleware,
  async (req, res) => {

    try {

      const conversations =
        await Conversation.find({

          participants:
            req.user.userId

        })
        .populate(
          "participants",
          "_id name email status"
        )
        .sort({
          updatedAt: -1
        });


      // Get the latest message for
      // every conversation

      const conversationsWithLastMessage =
        await Promise.all(

          conversations.map(
            async (conversation) => {

              const participants =
                conversation.participants;


              // Find the other user

              const otherUser =
                participants.find(
                  (user) =>
                    user._id.toString() !==
                    req.user.userId.toString()
                );


              // Find the latest message
              // between both users

              let lastMessage = null;


              if (otherUser) {

                lastMessage =
                  await Message.findOne({

                    $or: [

                      {
                        sender:
                          req.user.userId,

                        receiver:
                          otherUser._id
                      },

                      {
                        sender:
                          otherUser._id,

                        receiver:
                          req.user.userId
                      }

                    ]

                  })
                  .sort({
                    createdAt: -1
                  });

              }


              return {

                ...conversation.toObject(),

                lastMessage

              };

            }
          )

        );


      res.json(
        conversationsWithLastMessage
      );


    } catch (error) {

      console.error(
        "Error fetching conversations:",
        error.message
      );


      res.status(500).json({

        message:
          "Failed to fetch conversations",

        error:
          error.message

      });

    }

  }
);

// =====================================================
// REGISTER A NEW USER
// =====================================================

app.post(
  "/api/auth/register",
  async (req, res) => {

    try {

      const {
        name,
        email,
        password
      } = req.body;


      if (
        !name ||
        !email ||
        !password
      ) {

        return res.status(400).json({
          message:
            "Name, email and password are required"
        });

      }


      const existingUser =
        await User.findOne({
          email
        });


      if (existingUser) {

        return res.status(400).json({
          message:
            "Email already registered"
        });

      }


      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );


      const user = new User({

        name,

        email,

        password: hashedPassword,

        status: "Offline"

      });


      const savedUser =
        await user.save();


      const userResponse = {

        _id: savedUser._id,

        name: savedUser.name,

        email: savedUser.email,

        status: savedUser.status

      };


      res.status(201).json({

        message:
          "User registered successfully",

        user: userResponse

      });

    } catch (error) {

      res.status(500).json({

        message:
          "Failed to register user",

        error: error.message

      });

    }

  }
);


// =====================================================
// LOGIN USER
// =====================================================

app.post(
  "/api/auth/login",
  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;


      if (
        !email ||
        !password
      ) {

        return res.status(400).json({
          message:
            "Email and password are required"
        });

      }


      const user =
        await User.findOne({
          email
        });


      if (!user) {

        return res.status(401).json({
          message:
            "Invalid email or password"
        });

      }


      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );


      if (!passwordMatch) {

        return res.status(401).json({
          message:
            "Invalid email or password"
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

        message:
          "Login successful",

        token,

        user: userResponse

      });

    } catch (error) {

      res.status(500).json({

        message:
          "Login failed",

        error: error.message

      });

    }

  }
);


// =====================================================
// SEND A MESSAGE
// =====================================================

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

      const sender =
        req.user.userId;


      // Check required fields

      if (
        !receiver ||
        !text
      ) {

        return res.status(400).json({
          message:
            "Receiver and message text are required"
        });

      }


      // Create message

      const message =
        new Message({

          sender,

          receiver,

          text

        });


      // Save message in MongoDB

      const savedMessage =
        await message.save();

        // =====================================================
        // UPDATE CONVERSATION TIME
        // =====================================================

        await Conversation.findOneAndUpdate(

          {
            participants: {
              $all: [
                sender,
                receiver
              ]
            }
          },

          {
            $set: {
              updatedAt: new Date()
            }
          }

        );


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

        message:
          "Failed to send message",

        error:
          error.message

      });

    }

  }
);


// =====================================================
// GET MESSAGES BETWEEN TWO USERS
// =====================================================

app.get(
  "/api/messages/:user1/:user2",
  authMiddleware,
  async (req, res) => {

    try {

      const {
        user1,
        user2
      } = req.params;


      const messages =
        await Message.find({

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

        message:
          "Failed to fetch messages",

        error:
          error.message

      });

    }

  }
);


// =====================================================
// SOCKET.IO CONNECTION
// =====================================================

io.on(
  "connection",
  (socket) => {

    console.log(
      "User connected:",
      socket.id
    );


    // =================================================
    // USER JOINS
    // =================================================

    socket.on(
      "join",
      async (userId) => {

        try {

          socket.userId =
            userId;


          // Join user's personal room

          socket.join(
            userId
          );


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

      }
    );


    // =================================================
    // USER IS TYPING
    // =================================================

    socket.on(
      "typing",
      (data) => {

        console.log(
          "TYPING EVENT RECEIVED:",
          data
        );


        const {
          sender,
          receiver
        } = data;


        console.log(
          "Sending typing event to room:",
          receiver
        );


        io.to(receiver).emit(
          "user_typing",
          {
            sender
          }
        );

      }
    );


    // =================================================
    // USER STOPPED TYPING
    // =================================================

    socket.on(
      "stop_typing",
      (data) => {

        console.log(
          "STOP TYPING EVENT RECEIVED:",
          data
        );


        const {
          sender,
          receiver
        } = data;


        io.to(receiver).emit(
          "user_stop_typing",
          {
            sender
          }
        );

      }
    );


    // =================================================
    // USER DISCONNECTS
    // =================================================

    socket.on(
      "disconnect",
      async () => {

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

          const sockets =
            await io
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

              userId:
                socket.userId,

              status:
                "Offline"

            }
          );

        } catch (error) {

          console.error(

            "Error updating offline status:",

            error.message

          );

        }

      }
    );

  }
);


// =====================================================
// START SERVER
// =====================================================

const PORT =
  process.env.PORT || 5000;


server.listen(
  PORT,
  () => {

    console.log(
      `Server running on http://localhost:${PORT}`
    );

  }
);