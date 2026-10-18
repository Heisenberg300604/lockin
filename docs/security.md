# Security

- Clerk verifies identity; application services scope every commitment to the verified Clerk subject.
- Global DTO validation strips nothing silently: unknown request fields are rejected.
- Helmet security headers, explicit CORS origins, and a 100-request/minute global throttle are configured.
- Prisma parameterizes database queries; user ownership is enforced in `WHERE` clauses.
- The unique check-in key prevents duplicate daily submissions.
- Logs must never include authorization headers, Clerk tokens, database URLs, or keys.
- Production should provide TLS, database backups, dependency patching, and hosting-level rate/WAF controls.

The current repository’s `npm audit` reports dependency vulnerabilities. They have not been force-upgraded automatically because that could introduce breaking changes; review and remediate them in a dedicated dependency-update change.
