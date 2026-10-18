# API

Base URL: `http://localhost:3001/api/v1` in development. Swagger is served at `http://localhost:3001/docs` outside production.

Protected endpoints require `Authorization: Bearer <Clerk session token>`.

| Method | Route | Description |
| --- | --- | --- |
| GET | `/health/live` | Process liveness. |
| GET | `/health/ready` | PostgreSQL readiness. |
| GET/PATCH | `/me` | Read or update the caller's display name. |
| POST/GET | `/commitments` | Create or list caller-owned commitments. |
| GET/PATCH/DELETE | `/commitments/:id` | Read, edit active fields, or delete an owned commitment. |
| POST | `/commitments/:id/check-ins` | Record one current-date outcome. |
| POST | `/commitments/:id/pause` | Pause an active commitment. |
| POST | `/commitments/:id/resume` | Resume and extend its timeline by paused days. |

The service returns `404` for an absent or non-owned commitment, preventing resource enumeration. Request bodies use global whitelist validation; unknown fields are rejected.

Example create request:

```json
{
  "title": "Morning yoga",
  "kind": "BUILD",
  "startDate": "2026-10-19",
  "endDate": "2026-12-02",
  "timeZone": "Asia/Kolkata",
  "ruleFrequency": "WEEKLY",
  "targetCount": 3,
  "scheduledDays": [1, 3, 5],
  "reward": "A good coffee"
}
```
