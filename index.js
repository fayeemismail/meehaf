//REQUIRING MONGOOSE
const mongoose = require('mongoose');
// REQUIRING EXPRESS
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const path = require('path');
const session = require('express-session');
const env = require('dotenv');
const nocache = require('nocache');

//CONNECTING DATABASE
mongoose.connect("mongodb://127.0.0.1:27017/usersData");
app.use(nocache());



//SETTING BODYPARSER IN ADMIN_ROUTE
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//REQUIRING USER ROUTE
const user_route = require('./route/userRoute')
app.use('/', user_route)


// REQUIRING ADMIN ROUTE
const admin_route = require('./route/adminRoute')
app.use('/admin', admin_route)


app.use(express.static(path.join(__dirname, 'public')))
app.use('/public',express.static('public'))

app.listen(3000, console.log('http://localhost:3000'))