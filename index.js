const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const req = require('express/lib/request');

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// Serve the home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Database Connection
mongoose.connect(process.env.My_DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection error:', err));

// Define schemas
const exerciseSessionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const usernameSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [exerciseSessionSchema] // Embed exercise logs here directly
});

// Models
const UserName = mongoose.model('UserName', usernameSchema);

// API Routes

// Route to create a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    let user = await UserName.findOne({ username });

    if (!user) {
      // User does not exist, create new
      user = new UserName({ username });
      await user.save();
    }
    
    res.json({
      username: user.username,
      _id: user._id
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await UserName.find({}, 'username _id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to add an exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.status(400).json({ error: "Description and duration are required" });
  }

  const exerciseDate = date ? new Date(date) : new Date();

  try {
    const user = await UserName.findById(_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Push the exercise directly into the user's logs array
    user.log.push({ description, duration: parseInt(duration), date: exerciseDate });

    // Save the updated user document with the new exercise log
    await user.save();

    // Respond with the updated exercise data
    res.json({
      username: user.username,
      _id: user._id,
      description,
      duration: parseInt(duration),
      date: exerciseDate.toDateString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Route to get all logs
app.get('/api/users/:_id/logs', async(req,res)=>{
  const userId= req.params._id
  const {from, to, limit}= req.query
  
  try{
    const user= await UserName.findById(userId)

    if(!userId){
      return res.status(404).json({error: "User not found"})
    }

    let exercises=[...user.log]

    //To return logs from
    if(from){
      console.log(from)
      const dateFrom= new Date(from)
      exercises=exercises.filter(data=>data.date >= dateFrom)
    }

    //To return logs to
    if(to){
      console.log(to)
      const dateTo= new Date(to)
      exercises=exercises.filter(data=>data.date <= dateTo)
    }

    //To limit the logs
    if(limit){
      console.log(limit)
      const numberLimit=parseInt(limit, 10);
      exercises=exercises.slice(0,limit)
    }

    exercises= exercises.map(log=>{
      return{
        description:log.description,
        duration: log.duration,
        date: new Date(log.date).toDateString()
      }
    })

    

    //Count total number of logs
    count= exercises.length

    //Respond with logs
    res.json({
      username: user.username,
      _id: user._id,
      count: count,
      log: exercises
    })
    console.log(user.username, user._id, count, exercises)
  } catch(error){res.status(500).json({ error: error.message})}
})

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
