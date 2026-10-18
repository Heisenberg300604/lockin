# Database design

PostgreSQL is the selected relational store. Prisma schema: `backend/lockin-api/prisma/schema.prisma`; initial migration: `prisma/migrations/20261018000000_init`.

```mermaid
erDiagram
  USER_PROFILES ||--o{ COMMITMENTS : owns
  USER_PROFILES ||--o{ CHECK_INS : records
  COMMITMENTS ||--o{ CHECK_INS : contains
  USER_PROFILES {
    uuid id PK
    string clerk_id UK
    string display_name
  }
  COMMITMENTS {
    uuid id PK
    uuid user_id FK
    date start_date
    date end_date
    string time_zone
    enum status
    int_array scheduled_days
  }
  CHECK_INS {
    uuid id PK
    uuid commitment_id FK
    uuid user_id FK
    date date
    enum outcome
  }
```

## Constraints and indexes

- `user_profiles.clerk_id` is unique, making provisioning idempotent.
- `check_ins(commitment_id, date)` is unique, preventing duplicate daily logs even with concurrent requests.
- Deleting a commitment deletes its check-ins; deleting a profile deletes all owned data.
- Commitment list queries use `(user_id, status, created_at)` and `(user_id, end_date)` indexes.
- `check_ins(user_id, date)` supports user-scoped history queries.

The API performs rule-shape validation (frequency, targets, windows, and scheduled-day consistency) before creating records. PostgreSQL constraints preserve relational integrity; lifecycle policy is enforced in the service layer.
