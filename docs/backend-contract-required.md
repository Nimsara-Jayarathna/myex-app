# Backend contract required by the hardened mobile client

The mobile code now sends a stable `Idempotency-Key` header on every transaction create. The backend must persist/enforce that key per authenticated user so replaying the same key returns the original transaction rather than creating a second one.

Recommended invariant:

- Unique key: `(user_id, idempotency_key)`.
- Store the first successful transaction/result for that key.
- A replay with the same key and same payload returns the existing result.
- A replay with the same key but a conflicting payload returns `409 Conflict`.

The iOS Password AutoFill associated-domain config is opt-in through `MB_IOS_WEB_CREDENTIAL_DOMAIN`. The corresponding HTTPS origin must serve `/.well-known/apple-app-site-association` with the production Apple Team ID and `com.nimsara.blipzoapp` bundle identifier.

These are server/deployment requirements and cannot be enforced solely by the React Native repository.
