const requiredEnv = ["PORT", "JWT_SECRET"];

const requireCheck = () => {
  requiredEnv.forEach((env) => {
    if (!process.env[env]) {
      console.error(`Environment variable ${env} is missing.`);
      process.exit(1);
    }
  });
};

module.exports = { requireCheck };
