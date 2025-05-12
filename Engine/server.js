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
      const shops = await Shop.find().lean();
      
      // Convert MongoDB ObjectIds to strings
      const formattedShops = shops.map(shop => ({
        ...shop,
        id: shop._id.toString(), // Convert to string
        _id: undefined // Remove MongoDB _id
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


// Temporary route for bulk insert (remove after use)
app.post('/api/seed-shops', authenticateToken, async (req, res) => {
  try {
      const shops = req.body; // Array of shop objects
      const insertedShops = await Shop.insertMany(shops);
      res.json({ message: `${insertedShops.length} shops added, shops: insertedShops` });
  } catch (error) {
      res.status(500).json({ message: error.message });
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

// Add to your existing backend code:

// Appointment Model
const Appointment = mongoose.model('Appointment', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    payment_method: { type: String, enum: ['cash', 'online'], required: true },
    amount: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    gst_amount: { type: Number, required: true },
    appointment_date: { type: Date, required: true },
    appointment_time: { type: String, required: true },
    purpose_of_visit: String,
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    created_at: { type: Date, default: Date.now }
  }));
  
  // Appointment Routes
  app.post('/appointment/appointmentdetails', authenticateToken, async (req, res) => {
    try {
      const {
        master_id,
        payment_method,
        amount,
        subtotal,
        gst_amount,
        appointment_date,
        appointment_time,
        purpose_of_visit
      } = req.body;
  
      // Validate shop exists
      const shop = await Shop.findById(master_id);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
  
      // Create appointment
      const appointment = new Appointment({
        user: req.user.userId,
        shop: master_id,
        payment_method,
        amount,
        subtotal,
        gst_amount,
        appointment_date: new Date(appointment_date),
        appointment_time,
        purpose_of_visit
      });
  
      await appointment.save();
  
      res.status(201).json({
        message: 'Appointment created successfully',
        appointment: {
          id: appointment._id,
          status: appointment.status,
          shop: {
            name: shop.name,
            city: shop.city,
            image: shop.logo
          }
        }
      });
  
    } catch (error) {
      console.error('Appointment creation error:', error);
      res.status(500).json({ message: 'Error creating appointment' });
    }
  });
  
  // Get User Appointments
  app.get('/appointment/user-appointments', authenticateToken, async (req, res) => {
    try {
      const appointments = await Appointment.find({ user: req.user.userId })
        .populate('shop', 'name city logo')
        .sort({ appointment_date: -1 });
  
      res.json(appointments.map(app => ({
        id: app._id,
        status: app.status,
        shop: app.shop,
        amount: app.amount,
        appointment_date: app.appointment_date,
        appointment_time: app.appointment_time
      })));
      
    } catch (error) {
      res.status(500).json({ message: 'Error fetching appointments' });
    }
  });

  // Update the GET endpoint
app.get('/appointment/appointmentdetails', authenticateToken, async (req, res) => {
    try {
      const appointments = await Appointment.find({ user: req.user.userId })
        .populate('shop', 'name city logo')
        .sort({ appointment_date: -1 });
  
      res.json({
        message: appointments.map(app => ({
          booking_id: app._id,
          appointment_status: app.status,
          purpose_of_visit: app.purpose_of_visit,
          token_number: app.token_number,
          shop: app.shop,
          appointment_date: app.appointment_date,
          appointment_time: app.appointment_time,
          amount: app.amount
        }))
      });
      
    } catch (error) {
      res.status(500).json({ message: 'Error fetching appointments' });
    }
  });

  // Add to your existing backend routes
  app.get('/master/favourites', authenticateToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId)
        .populate({
          path: 'favorites',
          select: 'name description logo city service', // Add other fields you need
          model: 'Shop'
        });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Map to match frontend interface
      const formattedFavorites = user.favorites.map(shop => ({
        id: shop._id,
        master_id: shop._id,
        customer_id: req.user.userId,
        name: shop.name,
        description: shop.description || 'No description available',
        city: shop.city || 'City not specified',
        logo: shop.logo || 'default-shop-image.jpg',
        service: shop.service // Add other fields you need
      }));
  
      res.json({ message: formattedFavorites });
      
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ message: 'Error fetching favorites' });
    }
  });
// Get User Favorites
app.route('/master/favourites')
  .all(authenticateToken)
  .post(async (req, res) => {
    try {
      const { master_id } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user.favorites.includes(master_id)) {
        user.favorites.push(master_id);
        await user.save();
      }

      res.json({ status: 'success', message: 'Added to favorites' });
    } catch (error) {
      res.status(500).json({ message: 'Error adding favorite' });
    }
  })
  .delete(async (req, res) => {
    try {
      const { master_id } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $pull: { favorites: master_id } },
        { new: true }
      );

      res.json({ status: 'success', message: 'Removed from favorites' });
    } catch (error) {
      res.status(500).json({ message: 'Error removing favorite' });
    }
  });
// Start server

// User Profile Endpoint
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId)
        .select('-password -favorites -__v')
        .lean();
  
      if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });
  
      res.json({ 
        status: 'pass',
        message: {
          username: user.username,
          email: user.email,
          phone: user.phone
        }
      });
    } catch (error) {
      res.status(500).json({ status: 'fail', message: 'Error fetching profile' });
    }
  });
  
  // Feedback Endpoint
  const Feedback = mongoose.model('Feedback', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }));
  
  app.post('/master/feedback', authenticateToken, async (req, res) => {
    try {
      const { description } = req.body;
      
      if (!description || description.trim().length < 10) {
        return res.status(400).json({ message: 'Feedback must be at least 10 characters' });
      }
  
      const feedback = new Feedback({
        user: req.user.userId,
        description: description.trim()
      });
  
      await feedback.save();
      res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error submitting feedback' });
    }
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});