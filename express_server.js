/* eslint-disable camelcase */
const express = require("express");
const cookieSession = require('cookie-session');
const { restart } = require("nodemon");
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");
const bodyParser = require('body-parser');
const {getUserByEmail,generateRandomString,urlsForUser} = require('./helpers');
const methodOverride = require('method-override');

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieSession({
  name: 'session',
  keys: ['secret', 'rotation']
}));
app.use(methodOverride('_method'));

const urlDatabase = {};

const users = {};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  
  const userId = req.session.user_id;
  let userEmail = '';
  if (users[userId]) {
    userEmail = users[userId]['email'];
  }
  
  //if userId doesn't exist or there is no entry in user database
  if (!userId || !getUserByEmail(userEmail, users)) {
    return res.redirect('/login');
  }
 
  const templateVars = { urls: urlsForUser(userId, urlDatabase), user: users[userId] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  let userEmail = '';
  if (users[userId]) {
    userEmail = users[userId]['email'];
  }
  //if userId doesn't exist or there is no entry in user database
  if (!userId || !getUserByEmail(userEmail, users)) {
    return res.redirect('/login');
  }

  const templateVars = { user: users[userId] };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  let userEmail = '';
  if (users[userId]) {
    userEmail = users[userId]['email'];
  }
  //if userId exist and userId is in the database
  if (userId && getUserByEmail(userEmail, users)) {
    return res.redirect('/urls');
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  let userEmail = '';
  if (users[userId]) {
    userEmail = users[userId]['email'];
  }
  //if userId doesn't exist or there is no entry in user database
  if (!userId || !getUserByEmail(userEmail, users)) {
    return res.status(400).send('You must be logged in');
  }

  const databaseId = urlDatabase[req.params.id]['userID'];
  if (databaseId !== userId) {
    return res.status(400).send('You must be logged as a authorized user');
  }

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]['longURL'], user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  let longURL = urlDatabase[req.params.id];

  if (!longURL) {
    return res.status(400).send('Short URL id doesn\'t exist');
  }

  longURL = urlDatabase[req.params.id]['longURL'];
  res.redirect(longURL);
});

app.get('/login', (req, res) => {
  
  const userId = req.session.user_id;
  let userEmail = '';

  if (users[userId]) {
    userEmail = users[userId]['email'];
  }
 
  if (userId && getUserByEmail(userEmail, users)) {
    return res.redirect('/urls');
  }

  const templateVars = { user: users[req.session.user_id] };
  res.render('urls_login', templateVars);
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

app.post("/urls", (req, res) => {

  if (!req.session.user_id) {
    return res.status(400).send('Must be logged in to shorten URLs');
  }

  let randomString = generateRandomString();
  urlDatabase[randomString] = {
    longURL: req.body['longURL'],
    userID: req.session["user_id"]
  };
  res.redirect(`/urls/${randomString}`);
});

app.delete('/urls/:id', (req, res) => {
  const userId = req.session.user_id;
  const databaseId = urlDatabase[req.params.id]['userID'];
  if (databaseId !== userId) {
    return res.status(400).send('You must be logged as a authorized user');
  }

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.put('/urls/:id', (req, res) => {
  const userId = req.session.user_id;
  const databaseId = urlDatabase[req.params.id]['userID'];

  if (databaseId !== userId) {
    return res.status(400).send('You must be logged as a authorized user');
  }

  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id]['longURL'] = req.body['longURL'];
  res.redirect(`/urls`);
});

app.post('/logins', (req, res) => {
  req.session.user_id = req.body['user_id'];
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  
  if (!email || !password) {
    return res.status(400).send('Email address or password can\'t be empty strings');
  }

  if (user) {
    return res.status(400).send('Email address already in use');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email,
    password: hashedPassword
  };
  req.session.user_id = userId;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const userId = getUserByEmail(email, users);
  
  if (userId && bcrypt.compareSync(password, userId.password)) {
    req.session.user_id = userId.id;
    return res.redirect('/urls');
  }
  
  if (userId && !bcrypt.compareSync(password, userId.password)) {
    return res.status(403).send('Incorrect password');
  }

  return res.status(403).send('Email can\'t be found');
});