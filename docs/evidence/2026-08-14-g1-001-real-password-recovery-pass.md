# G1-001 — genuine production password recovery PASS

Fresh production commissioning on 2026-08-14 used the genuinely verified member created by verification run `31796196719`.

- reset request: HTTP 200
- genuine reset email: connected Gmail, 11:44:34 UTC
- genuine reset token consumption/password mutation: HTTP 200
- login after reset: HTTP 200
- authenticated change-password: HTTP 200
- logout: HTTP 200
- fresh final login with the changed password: HTTP 200
- final member state: `emailVerified=true`

Passwords and the one-time reset token were ephemeral and are not retained in the repository, logs or evidence. This demonstrates the member outcome, credential mutation and retained access rather than inferring them from source or delivery alone.

Commissioning conclusion: **G1-001 PASS**. The recovery leg also moves Dave from 18/20 to 19/20; the sole twentieth leg is external treatment support, so **G5-013 PASS for non-clinical V1**.
