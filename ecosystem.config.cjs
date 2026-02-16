module.exports = {
    apps: [
        {
            name: "minecraft-qq-backend",
            script: "/app/dist/src/server.js",
            cwd: "/app",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G"
        }
    ]
}
