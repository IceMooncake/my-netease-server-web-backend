const napcatConfig = {
    baseUrl: "ws://127.0.0.1:3002",
    accessToken: "",
    // 是否需要在触发 socket.error 时抛出错误, 默认关闭
    throwPromise: true,
    // ↓ 自动重连(可选)
    reconnection: {
        enable: true,
        attempts: 10,
        delay: 5000,
    }
}

export { napcatConfig }
