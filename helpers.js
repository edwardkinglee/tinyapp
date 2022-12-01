//generates a random 6 character lowercase and/or uppercase alphabetic string
const generateRandomString = () => {
  const length = 6;
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

//returns user object if found or undefined if not found
const getUserByEmail = (email, database) => {
  for (let userId in database) {
    if (database[userId]['email'] === email) {
      return database[userId];
    }
  }
  return undefined;
};

const urlsForUser = (id, urlDatabase) => {
  const urlArray = [];
  
  for (let element in urlDatabase) {
    if (urlDatabase[element]['userID'] === id) {
      urlArray.push({shortURL:[element] ,longURL: urlDatabase[element]['longURL']});
    }
  }
  
  if (urlArray.length === 0) {
    return null;
  }

  return urlArray;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser
};