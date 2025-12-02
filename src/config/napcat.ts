import dotenv from 'dotenv'
dotenv.config()

const napcatConfig = {
    baseUrl: String(process.env.NAPCAT_URL),
    accessToken: String(process.env.NAPCAT_TOKEN),
    // 是否需要在触发 socket.error 时抛出错误, 默认关闭
    throwPromise: true,
    // ↓ 自动重连(可选)
    reconnection: {
        enable: true,
        attempts: 10,
        delay: 5000,
    }
} as const

const GROUP_ID = Number(process.env.NAPCAT_GROUPID); // 群号

export { napcatConfig, GROUP_ID }
