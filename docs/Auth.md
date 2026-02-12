# 🔑 认证接口文档

所有接口前缀：`/auth`

---

## 1. 用户注册

**接口**
`POST /auth/register`

**描述**
注册新用户账号（需要 QQ 和密码）。

**请求体（Body）**

| 字段     | 类型   | 必填 | 说明     | 示例           |
| -------- | ------ | ---- | -------- | -------------- |
| qq       | string | 是   | 用户 QQ  | `"123456"`     |
| password | string | 是   | 登录密码 | `"mypassword"` |

**请求示例**

```http
POST /auth/register
Content-Type: application/json

{
  "qq": "123456",
  "password": "mypassword"
}
```

**返回示例**

```json
{
  "msg": "注册申请已提交，请等待确认",
  "qq": "123456"
}
```

---

## 2. 确认注册

**接口**
`POST /auth/confirm-register`

**描述**
确认用户注册（前端点击"已发送验证码"调用），最终激活账号。

**请求体（Body）**

| 字段 | 类型   | 必填 | 说明    | 示例       |
| ---- | ------ | ---- | ------- | ---------- |
| qq   | string | 是   | 用户 QQ | `"123456"` |

**请求示例**

```http
POST /auth/confirm-register
Content-Type: application/json

{
  "qq": "123456"
}
```

**返回示例**

```json
{
  "msg": "注册成功",
  "qq": "123456"
}
```

---

## 3. 用户登录

**接口**
`POST /auth/login`

**描述**
用户使用 QQ 和密码登录，成功后返回 **JWT Token**。

**请求体（Body）**

| 字段     | 类型   | 必填 | 说明     | 示例           |
| -------- | ------ | ---- | -------- | -------------- |
| qq       | string | 是   | 用户 QQ  | `"123456"`     |
| password | string | 是   | 登录密码 | `"mypassword"` |

**请求示例**

```http
POST /auth/login
Content-Type: application/json

{
  "qq": "123456",
  "password": "mypassword"
}
```

**成功返回示例**

```json
{
  "msg": "登录成功",
  "qq": "123456",
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

**失败返回示例**（密码错误等情况，返回 401）

```json
{
  "error": "Unauthorized"
}
```

---

⚠️ 注意事项：

- 登录成功后返回的 `token` 需要在调用其他受保护接口时放入 `Authorization: Bearer <token>` 头部。
- `confirm-register` 在流程上可能只允许管理员调用（取决于你的业务逻辑）。
