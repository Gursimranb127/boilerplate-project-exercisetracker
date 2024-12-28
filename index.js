const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const mongoose=require('mongoose');
mongoose.connect(process.env.My_DB).then(() => console.log('Database connected successfully'))
.catch((err) => console.error('Database connection error:', err));

const usernameSchema= new mongoose.Schema({username: String,
  description: String,
  duration: Number,
  date: Date
})
const UserName= mongoose.model('username',usernameSchema)

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

let bodyParser=require('body-parser');
const { param } = require('express/lib/request')
app.use(bodyParser.urlencoded({extended:false}))

let result={}
app.post('/api/users',(req, res)=>{
  let user = req.body['username'];
  if (!user) {
    return res.status(400).json({ error: "Username is required" });
}
  UserName.findOne({username:user})
  .exec()
  .then((data)=>{
    if(!data){
      const name= new UserName({username:user})
      name.save()
      .then((data)=>{
        result['username']=data.username
        result['_id']=data._id
      })
    } else{{
      result['username']=data.username
      result['_id']=data._id
    }}
    res.json(result)
  })
})
app.get('/api/users', (req, res)=>{
  UserName.find().exec()
  .then((data)=>{
    console.log(data)
    result=data.map(data=>
      ({
        username: data.username,
        _id: data._id
      })
    )
    res.json(result)
  })
})

