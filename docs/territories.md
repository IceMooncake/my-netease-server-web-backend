# 🏰 领地接口文档

所有接口前缀：`/territories`
所有接口均需 **JWT 认证**，且用户必须登录（`authenticateToken + requireAuth`）。

---

## 1. 申请创建领地

**接口**
`POST /territories/apply`

**描述**
玩家提交新领地创建申请，等待管理员审核。

**请求体（Body）**

| 字段 | 类型         | 必填     | 说明                         | 示例         |
| ---- | ------------ | -------- | ---------------------------- | ------------ | -------- | --- |
| name | string       | 是       | 领地名称                     | `"天空之城"` |
| type | `'overworld' | 'nether' | 'end'`                       | 是           | 圈地目标 | 是  |
| cost | number       | 否       | 创建领地消耗的额度（默认 0） | `500`        |

**请求示例**

```http
POST /territories/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "天空之城",
  "type": "overworld",
  "cost": 500
}
```

**返回示例**

```json
{
  "applicationId": 123
}
```

---

## 2. 向领地公共池捐献额度

**接口**
`POST /territories/:id/contribute`

**描述**
向指定领地的公共池捐献额度。

**路径参数（Path）**

| 参数名 | 类型   | 必填 | 说明    | 示例 |
| ------ | ------ | ---- | ------- | ---- |
| id     | number | 是   | 领地 ID | 1    |

**请求体（Body）**

| 字段   | 类型   | 必填 | 说明     | 示例 |
| ------ | ------ | ---- | -------- | ---- |
| amount | number | 是   | 捐献额度 | 100  |

**请求示例**

```http
POST /territories/1/contribute
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100
}
```

**返回示例**

```json
{
  "success": true
}
```

---

## 3. 创建提案

### 3.1 消费额度提案

**接口**
`POST /territories/:id/proposals/spend`

**请求体（Body）**

| 字段   | 类型   | 必填 | 说明     | 示例 |
| ------ | ------ | ---- | -------- | ---- |
| amount | number | 是   | 消费额度 | 50   |

**返回示例**

```json
{
  "proposalId": 456
}
```

### 3.2 加入成员提案

**接口**
`POST /territories/:id/proposals/join`

**请求体（Body）**

| 字段     | 类型   | 必填 | 说明    | 示例       |
| -------- | ------ | ---- | ------- | ---------- |
| targetQQ | string | 是   | 目标 QQ | `"654321"` |

**返回示例**

```json
{
  "proposalId": 457
}
```

### 3.3 驱逐成员提案

**接口**
`POST /territories/:id/proposals/expel`

**请求体（Body）**

| 字段     | 类型   | 必填 | 说明    | 示例       |
| -------- | ------ | ---- | ------- | ---------- |
| targetQQ | string | 是   | 目标 QQ | `"654321"` |

**返回示例**

```json
{
  "proposalId": 458
}
```

---

## 4. 对提案投票

**接口**
`POST /territories/proposals/:proposalId/vote`

**描述**
玩家对提案进行投票（赞成或反对）。

**路径参数（Path）**

| 参数名     | 类型   | 必填 | 说明    | 示例 |
| ---------- | ------ | ---- | ------- | ---- |
| proposalId | number | 是   | 提案 ID | 456  |

**请求体（Body）**

| 字段     | 类型       | 必填      | 说明 | 示例     |
| -------- | ---------- | --------- | ---- | -------- |
| decision | `'approve' | 'reject'` | 是   | 投票决定 |

**请求示例**

```http
POST /territories/proposals/456/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "decision": "approve"
}
```

**返回示例**

```json
{
  "success": true
}
```
