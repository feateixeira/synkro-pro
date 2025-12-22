module.exports = {
    apps: [{
        name: "synkro-whatsapp-bot",
        script: "./index.js",
        instances: 1,
        exec_mode: "fork",
        watch: false,
        max_memory_restart: "500M",
        env: {
            NODE_ENV: "production",
        },
        autorestart: true,
        restart_delay: 3000,
        exp_backoff_restart_delay: 100
    }]
};
