const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const bcrypt = require("bcrypt");
const cors = require("cors");
const axios = require('axios');
const nodemailer = require('nodemailer');
const path = require('path');



///////////////////// Create a Nodemailer transporter//////////////////////////////////
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: '991017anuradha@gmail.com', 
      pass: 'ctff rqfn mvqr btug'    
    }
  });

/////////////////////////////////////////////////////////

const User = mongoose.model("User");
const Order = mongoose.model("Order");
const Admin = mongoose.model("Admin");
const Flower = mongoose.model("Flower");

/////////////////////////////////////////////////////////////////

require("dotenv").config();

//////////////////////add new user//////////////////////

router.post('/addNewUser', async (req, res) => {

    console.log("sent by the client side -", req.body);
  
    const {email, password } = req.body;
  
    try {
      const hashPassword = await bcrypt.hash(password, 10);
      const user = new User({
      email,
       password: hashPassword
       
  
  });
  
      await user.save();
      res.send({ message: "user registered successfuly" });
    } catch (error) {
      console.log("Database error", error);
      return res.status(422).send({ error: error.message });
    }
  });
  
  
// Add new order route
router.post('/api/orders', async (req, res) => {
  const { billingDetails, cart } = req.body;

  const newOrder = new Order({
    name: billingDetails.name,
    address: billingDetails.address,
    email: billingDetails.email,
    contact: billingDetails.contact,
    deliveryDate: billingDetails.deliveryDate,
    paymentMethod: billingDetails.paymentMethod,
    cart,
    delivered: false,
  });

  try {
    await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully' });
  } catch (error) {
    console.error('Database error', error);
    res.status(500).json({ message: 'Failed to place order' });
  }
});




  ///////////////////////////////////////Add new admin///////////////////////////////////

  router.post('/addNewAdmin', async (req, res) => {
  console.log("Sent by the client side -", req.body);

  const { name, email, password } = req.body;

  try {
      const hashPassword = await bcrypt.hash(password, 10);
      const admin = new Admin({
          name,
          email,
          password: hashPassword
      });

      await admin.save();
      res.send({ message: "Admin registered successfully" });
  } catch (error) {
      console.log("Database error", error);
      return res.status(422).send({ error: error.message });
  }
});

/////////////////////////////////////////////////// Admin and User Login/////////////////////////////////////

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
      let user = await User.findOne({ email });
      let userType = "user";

      if (!user) {
          user = await Admin.findOne({ email });
          userType = "admin";
      }

      if (!user) {
          return res.status(401).send({ error: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
          return res.status(401).send({ error: "Invalid Password" });
      }

      const token = jwt.sign({ userId: user._id, userType }, process.env.JWT_SECRET, {
          expiresIn: "10m"
      });

      const mailOptions = {
          from: '991017anuradha@gmail.com',
          to: email,
          subject: 'Login Notification',
          text: "Hello, you have successfully logged in to the Future Tech official page."
      };

      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error('Error sending email:', error);
          } else {
              console.log('Email sent:', info.response);
          }
      });

      res.json({ token, userType });
  } catch (error) {
      console.error("Database Error", error);
      return res.status(500).send({ error: "Internal Server Error" });
  }
});


//////////////////////////////////////////////////// Get all orders////////////////////////////////////

router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Database error', error);
    res.status(500).send({ message: 'Failed to fetch orders' });
  }
});

///////////////////////////////////////////////////////// Get orders by delivery date///////////////////////////////////////////

router.get('/orders/date/:deliveryDate', async (req, res) => {
  const { deliveryDate } = req.params;
  try {
    const orders = await Order.find({ deliveryDate });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Database error', error);
    res.status(500).send({ message: 'Failed to fetch orders' });
  }
});

/////////////////////////////////////////////////// Update order delivery status////////////////////////////////////

router.put('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { delivered } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(id, { delivered }, { new: true });
    res.status(200).json(order);
  } catch (error) {
    console.error('Database error', error);
    res.status(500).send({ message: 'Failed to update order' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
const upload = multer({ storage });

///////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////// add new product //////////////////////////////////////////////////

router.post('/addFlower', upload.single('image'), async (req, res) => {
  try {
    const { title, price, category, description } = req.body;
    const image = req.file.filename; // Save the filename of the uploaded image
    const flower = new Flower({ title, price, category, description, image });
    await flower.save();
    res.status(201).json({ message: 'Flower added successfully' });
  } catch (error) {
    console.error('Error adding flower', error);
    res.status(500).json({ error: 'Failed to add flower' });
  }
});

//////////////////////////////////////////////////////////// Get all flowers////////////////////////////////

router.get('/flowers', async (req, res) => {
  try {
    const flowers = await Flower.find();
    res.status(200).json(flowers);
  } catch (error) {
    console.error('Database error', error);
    res.status(500).json({ message: 'Failed to fetch flowers' });
  }
});

//////////////////////////////////////////////////////////////// Get flowers by category////////////////////////////

router.get('/flowers/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const flowers = await Flower.find({ category });
    res.status(200).json(flowers);
  } catch (error) {
    console.error('Database error', error);
    res.status(500).json({ message: 'Failed to fetch flowers' });
  }
});


//////////////////////////////////////////// Edit product/////////////////////////////////////////////

router.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { title, price, category, description } = req.body;
  try {
    const updatedProduct = await Flower.findByIdAndUpdate(id, { title, price, category, description }, { new: true });
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Database error', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

/////////////////////////////////////////////// Delete product////////////////////////////////////////////

router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Flower.findByIdAndDelete(id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Database error', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

////////////////////////////////////////////////////////// Route to fetch all users//////////////////////////////////////////

router.get('/users', async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.status(200).json(users); // Send the users as a JSON response
  } catch (error) {
    console.error('Database error', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

//////////////////////////////////////////Fetch flower by ID//////////////////////////////////////

router.get('/flowers/:id', async (req, res) => {
  try {
    const flower = await Flower.findById(req.params.id);
    if (!flower) {
      return res.status(404).json({ message: 'Flower not found' });
    }
    res.json(flower);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flower details', error });
  }
});



////////////////////////////////////////////// API endpoint to fetch products by IDs//////////////////////////

router.post('/api/products', async (req, res) => {
  try {
    const { productIds } = req.body;
    const products = await Product.find({ _id: { $in: productIds } });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

////////////////////////////////////////////////////////add to cart//////////////////////////////////////////////
router.post('/cart/addToCart', async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const flower = await Flower.findById(productId);
    if (!flower) {
      return res.status(404).json({ message: 'Flower not found' });
    }

    const itemWithQuantity = { ...flower.toObject(), quantity };
    res.json(itemWithQuantity);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});



///////////////////////////////////////// Route to fetch details of items in the cart based on their IDs///////////////////////////////////
router.post('/cart/items', async (req, res) => {
  const { itemIds } = req.body;

  try {
    const cartItems = await Promise.all(
      itemIds.map(async (itemId) => {
        const itemDetails = await Flower.findById(itemId);
        return itemDetails;
      })
    );

    res.json({ cartItems });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ error: 'Error fetching cart items' });
  }
});


router.post("/logout", (req, res) => {
  // Perform any necessary backend logout logic (e.g., clearing session, invalidating tokens)
  // Respond with appropriate status code and message
  res.status(200).json({ message: "Logout successful" });
});



module.exports = router;
