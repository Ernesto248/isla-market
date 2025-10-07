
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** isla-market
- **Date:** 2025-10-07
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC007
- **Test Name:** Signup flow referral code registration
- **Test Code:** [TC007_Signup_flow_referral_code_registration.py](./TC007_Signup_flow_referral_code_registration.py)
- **Test Error:** The referral code was detected via URL parameter and displayed in a green banner inside the signup modal. The signup form was completed and submitted successfully. A success toast confirmed the referral code was used during registration. However, verification of the referral record in the database could not be performed via the UI as no database information is accessible on the page. The test is partially successful based on UI verification but incomplete for database confirmation.
Browser Console Logs:
[WARNING] Sesión inválida detectada, redirigiendo... (at http://localhost:3000/_next/static/chunks/app/layout-63421041e70c69e4.js:0:1434)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/_vercel/insights/script.js:0:0)
[WARNING] Sesión inválida detectada, redirigiendo... (at http://localhost:3000/_next/static/chunks/app/layout-63421041e70c69e4.js:0:1434)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/_vercel/insights/script.js:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/api/referrals/validate-code?code=TESTCODE123:0:0)
[ERROR] Failed to load resource: net::ERR_CONNECTION_CLOSED (at https://cms-next.sfo3.digitaloceanspaces.com/categories/electronicos-1759376297239-jhwq8l.jpg:0:0)
[ERROR] Failed to load resource: net::ERR_CONNECTION_CLOSED (at https://cms-next.sfo3.digitaloceanspaces.com/categories/ropa-1759376365655-hlerp8.jpg:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1e8cf9ba-bec3-49a9-ab39-4b5881bca540/22915911-28dc-4417-afe7-5aeffb0fbd1b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---