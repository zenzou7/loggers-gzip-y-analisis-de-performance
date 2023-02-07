const ContainerMongo = require('../containers/ContainerMongo.js');
const users = require('../../models/users.js');

class usersDaoMongo extends ContainerMongo {
  constructor() {
    super(users);
  }
}

module.exports = usersDaoMongo;
