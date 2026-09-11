# Security rate limiting

Database-backed login, recovery request, and recovery-code verification rate limits are implemented.

- Login: per-IP and per-account windows
- Recovery request: per-IP and per-account windows
- Recovery verification: per-IP and per-account windows
- Recovery codes remain hashed and expire after 10 minutes
- Rate-limit events are logged without storing passwords or recovery codes
