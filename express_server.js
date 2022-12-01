/* eslint-disable camelcase */
const express = require("express");
const cookieSession = require('cookie-session');
const { restart } = require("nodemon");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require("bcryptjs");
const bodyParser = require('body-parser');

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use(cookieSession({
//   name: 'session',
//   keys: ['test'],

//   // Cookie Options
//   maxAge: 24 * 60 * 60 * 1000 // 24 hours
// }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieSession({
  name: 'session',
  keys: ['secret', 'rotation']
}));

// eslint-disable-next-line func-style
function generateRandomString() {
  const length = 6;
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const userLookup = (email) => {
  for (let key in users) {
    if (users[key]['email'] === email) {
      return key;
    }
  }
  return null;
};

const hasUserId = (userId) => {
  const urlArray = [];
  for (let element in urlDatabase) {
    if (urlDatabase[element]['userID'] === userId) {
      urlArray.push({shortURL:[element] ,longURL: urlDatabase[element]['longURL']});
    }
  }
  //have it return null instead of empty array if user doesn't exist
  if (urlArray.length === 0) {
    return null;
  }

  return urlArray;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
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
  console.log('Session userId in urls', req.session.user);
  console.log('userLookup in urls',userLookup(userEmail));
  //if userId doesn't exist or there is no entry in user database
  if (!userId || !userLookup(userEmail)) {
    console.log('being redirected');
    return res.redirect('/login');
  }
 
  const templateVars = { urls: hasUserId(userId), user: users[userId] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  let userEmail = '';
  if (users[userId]) {
    userEmail = users[userId]['email'];
  }
  //if userId doesn't exist or there is no entry in user database
  if (!userId || !userLookup(userEmail)) {
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
  if (userId && userLookup(userEmail)) {
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
  if (!userId || !userLookup(userEmail)) {
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
  const longURL = urlDatabase[req.params.id]['longURL'];
  if (!longURL) {
    return res.status(400).send('Short URL id doesn\'t exist');
  }
  res.redirect(longURL);
});

app.get('/login', (req, res) => {
  console.log(users);
  console.log('session id in login',req.session.user_id);
 
  const userId = req.session.user_id;
  let userEmail = '';
  if (users[userId]) {
    userEmail = users[userId]['email'];
  }
 
  if (userId && userLookup(userEmail)) {
    return res.redirect('/urls');
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render('urls_login', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
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
  res.redirect(`/urls/${randomString}`); // Replaced to redirect after post response
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const databaseId = urlDatabase[req.params.id]['userID'];
  if (databaseId !== userId) {
    return res.status(400).send('You must be logged as a authorized user');
  }

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post("/urls/:id/edit", (req, res) => {
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
  const user = userLookup(email);
  
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
  const userId = userLookup(email);
  
  if (userId && bcrypt.compareSync(password, users[userId].password)) {
    req.session.user_id = userId;
    return res.redirect('/urls');
  }
  if (userId && !bcrypt.compareSync(password, users[userId].password)) {
    return res.status(403).send('Incorrect password');
  }
  return res.status(403).send('Email can\'t be found');
});