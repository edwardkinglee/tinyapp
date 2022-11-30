const express = require("express");
const cookieParser = require('cookie-parser');
const { restart } = require("nodemon");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  for (let obj in users) {
    if (users[obj]['email'] === email) {
      return obj;
    }
  }
  return null;
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
  if (!req.cookies["user_id"]) {
    return res.redirect('/login');
  }
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.redirect('/login');
  }
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect('/urls');
  }
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies["user_id"]] };
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {
    return res.status(400).send('Short URL id doesn\'t exist');
  }
  res.redirect(longURL);
});

app.get('/login', (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect('/urls');
  }
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render('urls_login', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.status(400).send('Must be logged in to shorten URLs');
  }
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body['longURL'];
  res.redirect(`/urls/${randomString}`); // Replaced to redirect after post response
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body['longURL'];
  res.redirect(`/urls`);
});

app.post('/logins', (req, res) => {
  res.cookie('user_id',req.body['user_id']);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const user = userLookup(email);
  
  if (email === '' || password === '') {
    return res.status(400).send('Email address or password can\'t be empty strings');
  }
  if (user) {
    return res.status(400).send('Email address already in use');
  }

  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email,
    password
  };
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = userLookup(email);
  console.log(user);
  if (user && users[user]['password'] === password) {
    res.cookie('user_id', user);
    res.redirect('/urls');
  }
  if (user && users[user]['password'] !== password) {
    return res.status(403).send('Incorrect password');
  }
  return res.status(403).send('Email can\'t be found');
});