// const express = require('express');
// const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const bcrypt = require('bcryptjs');

// dotenv.config();
// const app = express();

// // Middleware
// app.use(cors({
//     origin: '*',
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     allowedHeaders: 'Content-Type, Authorization',
// }));
// app.use(express.json());

// // Database connection
// mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('MongoDB connected'))
//     .catch(err => console.log('MongoDB connection error:', err));

// // Models
// const UserSchema = new mongoose.Schema({
//     username: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     phone: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],
//     addresses: [{
//         name: String,
//         street: String,
//         city: String,
//         state: String,
//         postalCode: String,
//         country: String,
//         isDefault: Boolean
//     }]
// }, { timestamps: true });

// const ShopSchema = new mongoose.Schema({
//     name: String,
//     category: String,
//     description: String,
//     phone: String,
//     email: String,
//     website: String,
//     instagram: String,
//     facebook: String,
//     street_address: String,
//     city: String,
//     state: String,
//     country: String,
//     postal_code: String,
//     latitude: Number,
//     longitude: Number,
//     location: String,
//     details: String,
//     logo: String,
//     service: String
// }, { timestamps: true });

// const BookingSchema = new mongoose.Schema({
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
//     services: [{
//         name: String,
//         price: Number,
//         duration: Number
//     }],
//     date: { type: Date, required: true },
//     status: { 
//         type: String, 
//         enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
//         default: 'pending' 
//     },
//     notes: String
// }, { timestamps: true });

// const FeedbackSchema = new mongoose.Schema({
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     description: { type: String, required: true }
// }, { timestamps: true });

// const User = mongoose.model('User', UserSchema);
// const Shop = mongoose.model('Shop', ShopSchema);
// const Booking = mongoose.model('Booking', BookingSchema);
// const Feedback = mongoose.model('Feedback', FeedbackSchema);

// // Authentication middleware
// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
    
//     if (!token) return res.sendStatus(401);
    
//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) return res.sendStatus(403);
//         req.user = user;
//         next();
//     });
// };

// // 1. Authentication Routes
// app.post('/api/user/signup', async (req, res) => {
//     try {
//         const { username, email, phone, password } = req.body;

//         // Validate input
//         if (!username || !email || !phone || !password) {
//             return res.status(400).json({ 
//                 status: 'fail', 
//                 message: 'All fields are required' 
//             });
//         }

//         const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
//         if (existingUser) {
//             return res.status(400).json({ 
//                 status: 'fail', 
//                 message: 'User with this email or phone already exists' 
//             });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);
//         const newUser = await User.create({ 
//             username, 
//             email, 
//             phone, 
//             password: hashedPassword 
//         });

//         // Don't send password back
//         const userResponse = newUser.toObject();
//         delete userResponse.password;

//         return res.status(201).json({ 
//             status: 'pass', 
//             message: 'Signup successful',
//             user: userResponse
//         });
//     } catch (error) {
//         console.error('Error during signup:', error);
//         return res.status(500).json({ 
//             status: 'fail', 
//             message: 'An error occurred during signup' 
//         });
//     }
// });

// app.post('/api/user/login', async (req, res) => {
//     try {
//         const { identifier, password } = req.body;

//         if (!identifier || !password) {
//             return res.status(400).json({ 
//                 status: 'fail', 
//                 message: 'Identifier and password are required' 
//             });
//         }

//         const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
//         if (!user) return res.status(400).json({ 
//             status: 'fail', 
//             message: 'Invalid credentials' 
//         });

//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         if (!isPasswordValid) return res.status(400).json({ 
//             status: 'fail', 
//             message: 'Invalid credentials' 
//         });

//         const token = jwt.sign(
//             { userId: user._id, username: user.username, email: user.email },
//             process.env.JWT_SECRET,
//             { expiresIn: '1h' }
//         );

//         return res.status(200).json({ 
//             status: 'pass', 
//             message: 'Login successful', 
//             access: token 
//         });
//     } catch (error) {
//         console.error('Error during login:', error);
//         return res.status(500).json({ 
//             status: 'fail', 
//             message: 'An error occurred during login' 
//         });
//     }
// });

// // 2. Shop Routes
// app.get('/master/shopdetails', authenticateToken, async (req, res) => {
//     try {
//         const shops = await Shop.find().lean();
//         const formattedShops = shops.map(shop => ({
//             ...shop,
//             id: shop._id.toString()
//         }));
//         res.json({ 
//             status: 'pass', 
//             message: formattedShops 
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             status: 'fail', 
//             message: error.message 
//         });
//     }
// });

// // 3. Favorite Routes
// app.post('/master/favourites', authenticateToken, async (req, res) => {
//     try {
//         const { master_id } = req.body;
//         if (!master_id) {
//             return res.status(400).json({ 
//                 status: 'fail', 
//                 message: 'master_id is required' 
//             });
//         }

//         const user = await User.findById(req.user.userId);
//         if (!user) {
//             return res.status(404).json({ 
//                 status: 'fail', 
//                 message: 'User not found' 
//             });
//         }

//         if (req.headers['x-http-method-override'] === 'DELETE') {
//             user.favorites = user.favorites.filter(id => id.toString() !== master_id);
//             await user.save();
//             return res.json({ 
//                 status: 'pass', 
//                 message: 'Removed from favorites' 
//             });
//         }

//         if (user.favorites.includes(master_id)) {
//             return res.status(400).json({ 
//                 status: 'fail', 
//                 message: 'Already in favorites' 
//             });
//         }

//         user.favorites.push(master_id);
//         await user.save();
//         res.json({ 
//             status: 'pass', 
//             message: 'Added to favorites' 
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             status: 'fail', 
//             message: error.message 
//         });
//     }
// });

// // 4. User Profile Routes
// app.get('/api/user/profile', authenticateToken, async (req, res) => {
//     try {
//         const user = await User.findById(req.user.userId)
//             .select('-password -favorites -addresses');
            
//         if (!user) {
//             return res.status(404).json({ 
//                 status: 'fail', 
//                 message: 'User not found' 
//             });
//         }
        
//         res.json({ 
//             status: 'pass', 
//             message: user 
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             status: 'fail', 
//             message: error.message 
//         });
//     }
// });

// app.put('/api/user/profile', authenticateToken, async (req, res) => {
//     try {
//         const { username, email, phone } = req.body;
        
//         if (!username || !email || !phone) {
//             return res.status(400).json({ 
//                 status: 'fail', 
//                 message: 'All fields are required' 
//             });
//         }

//         const existingEmail = await User.findOne({ 
//             email, 
//             _id: { $ne: req.user.userId } 
//         });
        
//         if (existingEmail) {
//             return res.status(400).json({ 
//                 status: 'fail', 
//                 message: 'Email already in use' 
//             });
//         }

//         const existingPhone = await User.findOne({ 
//             phone, 
//             _id: { $ne: req.user.userId } 
//         });
        
//         if (existingPhone) {
//             return res.status(400).json({ 
//                 status: 'fail', 
//                 message: 'Phone number already in use' 
//             });
//         }

//         const updatedUser = await User.findByIdAndUpdate(
//             req.user.userId,
//             { username, email, phone },
//             { new: true, runValidators: true }
//         ).select('-password');

//         res.json({ 
//             status: 'pass', 
//             message: updatedUser 
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             status: 'fail', 
//             message: error.message 
//         });
//     }
// });

// // 5. Booking Routes
// app.get('/api/user/bookings', authenticateToken, async (req, res) => {
//     try {
//         const bookings = await Booking.find({ user: req.user.userId })
//             .populate('shop', 'name logo')
//             .sort({ createdAt: -1 });

//         res.json({ 
//             status: 'pass', 
//             message: bookings 
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             status: 'fail', 
//             message: error.message 
//         });
//     }
// });

// // 6. Feedback Route
// app.post('/master/feedback', authenticateToken, async (req, res) => {
//     try {
//         const { description } = req.body;
        
//         if (!description || description.trim() === '') {
//             return res.status(400).json({ 
//                 status: 'fail', 
//                 message: 'Feedback description is required' 
//             });
//         }

//         const feedback = await Feedback.create({
//             user: req.user.userId,
//             description: description.trim()
//         });

//         res.json({ 
//             status: 'pass', 
//             message: 'Feedback submitted successfully',
//             feedback
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             status: 'fail', 
//             message: error.message 
//         });
//     }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();
const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
}));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Models
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }]
}));

const Shop = mongoose.model('Shop', new mongoose.Schema({
    name: String,
    category: String,
    description: String,
    phone: String,
    email: String,
    website: String,
    instagram: String,
    facebook: String,
    street_address: String,
    city: String,
    state: String,
    country: String,
    postal_code: String,
    latitude: Number,
    longitude: Number,
    location: String,
    details: String,
    logo: String,
    service: String
}));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// 1. Authentication Routes
app.post('/api/user/signup', async (req, res) => {
    const { username, email, phone, password } = req.body;

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or phone already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, phone, password: hashedPassword });
        await newUser.save();

        return res.status(201).json({ message: 'Signup successful', user: newUser });
    } catch (error) {
        console.error('Error during signup:', error);
        return res.status(500).json({ message: 'An error occurred during signup' });
    }
});

app.post('/api/user/login', async (req, res) => {
    const { identifier, password } = req.body;

    try {
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user._id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({ message: 'Login successful', access: token });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'An error occurred during login' });
    }
});

// 2. Shop Routes
// In your backend route
app.get('/master/shopdetails', authenticateToken, async (req, res) => {
  try {
      const shops = await Shop.find().lean(); // .lean() for plain JS objects
      // Map _id to id if needed
      const formattedShops = shops.map(shop => ({
          ...shop,
          id: shop._id.toString() // Convert ObjectId to string
      }));
      res.json(formattedShops);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// 3. Favorite Routes
app.post('/master/favourites', authenticateToken, async (req, res) => {
    try {
        const { master_id } = req.body;
        const user = await User.findById(req.user.userId);

        if (req.headers['x-http-method-override'] === 'DELETE') {
            // Handle favorite removal
            user.favorites = user.favorites.filter(id => id.toString() !== master_id);
            await user.save();
            return res.json({ status: 'success', message: 'Removed from favorites' });
        }

        // Handle favorite addition
        if (user.favorites.includes(master_id)) {
            return res.status(400).json({ message: 'Already in favorites' });
        }

        user.favorites.push(master_id);
        await user.save();
        res.json({ status: 'success', message: 'Added to favorites' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. User Profile Route
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Temporary route for bulk insert (remove after use)
app.post('/api/seed-shops', authenticateToken, async (req, res) => {
  try {
      const shops = req.body; // Array of shop objects
      const insertedShops = await Shop.insertMany(shops);
      res.json({ message:` ${insertedShops.length} shops added, shops: insertedShops `});
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// User Profile Routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
      const user = await User.findById(req.user.userId).select('-password');
      if (!user) {
          return res.status(404).json({ 
              status: 'fail', 
              message: 'User not found' 
          });
      }
      
      res.json({ 
          status: 'pass', 
          message: {
              username: user.username,
              email: user.email,
              phone: user.phone
          }
      });
  } catch (error) {
      res.status(500).json({ 
          status: 'fail', 
          message: error.message 
      });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
      const { name: username, email, phone } = req.body;
      
      // Validate input
      if (!username || !email || !phone) {
          return res.status(400).json({ 
              status: 'fail', 
              message: 'All fields are required' 
          });
      }

      // Check if email is being changed to one that already exists
      const existingEmail = await User.findOne({ 
          email, 
          _id: { $ne: req.user.userId } 
      });
      
      if (existingEmail) {
          return res.status(400).json({ 
              status: 'fail', 
              message: 'Email already in use' 
          });
      }

      // Check if phone is being changed to one that already exists
      const existingPhone = await User.findOne({ 
          phone, 
          _id: { $ne: req.user.userId } 
      });
      
      if (existingPhone) {
          return res.status(400).json({ 
              status: 'fail', 
              message: 'Phone number already in use' 
          });
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
          req.user.userId,
          { username, email, phone },
          { new: true, runValidators: true }
      ).select('-password');

      res.json({ 
          status: 'pass', 
          message: {
              username: updatedUser.username,
              email: updatedUser.email,
              phone: updatedUser.phone
          }
      });
  } catch (error) {
      res.status(500).json({ 
          status: 'fail', 
          message: error.message 
      });
  }
});
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});