const getUserByEmail = (email, database) => {
  for (let userId in database) {
    if (database[userId]['email'] === email) {
      return userId;
    }
  }
  return null;
};

module.exports = getUserByEmail;