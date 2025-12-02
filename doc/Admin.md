# 📝 管理员接口文档

## 认证要求

所有接口均需要 **JWT 认证**，并且用户必须具备 **管理员权限**。
 中间件：`authenticateToken` + `requireAdmin`

------

## 1. 获取领地申请列表

**接口**
 `GET /admin/applications`

**描述**
 获取所有玩家提交的领地创建申请，可按状态筛选。

**请求参数（Query）**

| 参数名 | 类型   | 必填 | 说明             | 示例        |
| ------ | ------ | ---- | ---------------- | ----------- |
| status | string | 否   | 申请状态过滤条件 | `"pending"` |

**请求示例**

```http
GET /admin/applications?status=pending
Authorization: Bearer <token>
```

**返回示例**

```json
[{
    "id":3,
    "applicant_qq":"12341234",
    "name":"territory1",
    "type":"overworld",
    "cost":2,
    "status":"pending",
    "decision_message":null,
    "processed_by":"12341234",
    "created_at":"2025-08-17T06:58:30.000Z",
    "processed_at":null
}]
```

------

## 2. 审核领地申请

**接口**
 `POST /admin/applications/:id/decide`

**描述**
 管理员对玩家的领地申请进行审批（通过或驳回）。

**请求参数**

- **路径参数（Path）**

  | 参数名 | 类型   | 必填 | 说明       | 示例 |
  | ------ | ------ | ---- | ---------- | ---- |
  | id     | number | 是   | 申请记录ID | `1`  |

- **请求体（Body）**

  | 字段    | 类型    | 必填 | 说明                 | 示例         |
  | ------- | ------- | ---- | -------------------- | ------------ |
  | approve | boolean | 是   | 是否通过申请         | `true`       |
  | message | string  | 否   | 审核意见（驳回理由） | `"资金不足"` |

**请求示例**

```http
POST /admin/applications/1/decide
Authorization: Bearer <token>
Content-Type: application/json

{
  "approve": true,
  "message": "批准通过"
}
```

**返回示例**

```json
{
  "status": "approved",
}
```

