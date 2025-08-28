const requiredEnv = ["PORT"];
const db = require("../Database/db");

const requireCheck = () => {
  requiredEnv.forEach((env) => {
    if (!process.env[env]) {
      console.error(`Environment variable ${env} is missing.`);
      process.exit(1);
    }
  });
};

const checkDB = async () => {
  db.connect((err) => {
    if (err) {
      console.error(err);
    } else {
      db.end();
    }
  });
};
module.exports = { requireCheck, checkDB };
