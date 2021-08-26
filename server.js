const express = require('express')
const app = express({mergeParams: true})
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
mongoose.set('debug', true);


app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended:true}))

//mongoose connection
mongoose.connect(process.env.MONGOURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});
const userSchema = new mongoose.Schema({
  username:String,
  log:[]
})

const Username = mongoose.model('Username', userSchema);
//Username.remove({}, () => console.log("cleared")) 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => { 
  const users = await Username.find({});
  //res.json(users.map(u =>  (
  //  {_id:u._id, username:u.username}
  //)));
  res.json(users)
});

app.post('/api/users', async (req, res)=> {
  const user = await Username.create({
    username: req.body.username
  })
  res.json({username: user.username, _id:user._id});
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const user = await Username.findById(req.params._id); 
  const { description, duration} = req.body;
  if (!req.body.date) {
    req.body.date = new Date()
  }
  const currentExercise = {
    description: description,
    duration: parseInt(duration),
    date: new Date(req.body.date).toDateString()
  }
  user.log.push(currentExercise)
  user.save();
  res.json({_id: user._id, username:user.username, description: currentExercise.description,
     duration:currentExercise.duration, date:currentExercise.date })
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const user = await Username.findById(req.params._id);
  let log = user.log;
  if(req.query.from && req.query.to){
    const from = new Date(req.query.from)
    const to = new Date(req.query.to)
    log = user.log.filter((l) =>  new Date(l.date) > from && new Date(l.date) < to );
  };
  if(req.query.limit) {
    log = user.log.slice(0, req.query.limit)
  }
  res.json({_id: user._id, username:user.username, count:log.length, log:log});
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
