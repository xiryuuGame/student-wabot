module.exports = {
  apps: [
    {
      name: "bot",
      script: "index.js",
      watch: true,
      ignore_watch: ["node_modules", "logs", "function/mapel", "session", "AIHistory"],
    }
  ]
};
