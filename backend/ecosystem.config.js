module.exports = {
    apps: [
        {
            name: 'backend',
            script: 'dist/index.js',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
                PORT: 3000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            log_file: 'logs/combined.log',
            out_file: 'logs/out.log',
            error_file: 'logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm Z',
            merge_logs: true,
            restart_delay: 1000,
            max_restarts: 5,
            min_uptime: '10s'
        }
    ]
};