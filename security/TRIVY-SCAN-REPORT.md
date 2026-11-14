# Container Image Security Scan Report (Trivy)

**Sprint 2 — Task 3** · Scanner: Trivy v0.76.2 (`--scanners vuln --severity HIGH,CRITICAL`)
**Date:** 2026-11-14 · Raw reports: `security/trivy-*.txt|.json`

## 1. Initial Scan — Findings

### Backend (`sprint2-backend`) — 14 vulnerabilities (7 CRITICAL, 7 HIGH)

| Library | CVEs | Severity | Installed | Fixed in |
|---|---|---|---|---|
| `org.apache.tomcat.embed:tomcat-embed-core` | CVE-2026-55276, CVE-2026-65182, CVE-2026-65637, CVE-2026-65905, CVE-2026-68525, CVE-2026-53404 | 5 CRITICAL, 1 HIGH | 10.1.55 | 10.1.59+ / 11.0.25+ |
| `org.springframework:spring-webmvc` | CVE-2026-47884 (RCE via XsltView path limitation), CVE-2026-47890 (SSE stream corruption) | CRITICAL | 6.2.19 | 7.0.9+ (no 6.2.x fix) |
| `com.fasterxml.jackson.core:jackson-core` | CVE-2026-89407, CVE-2026-89425 (DoS) | HIGH | 2.21.4 | 2.21.7+ |
| `com.fasterxml.jackson.core:jackson-databind` | CVE-2026-68497, CVE-2026-91776, CVE-2026-91777 (DoS) | HIGH | 2.21.4 | 2.21.7+ |
| `org.postgresql:postgresql` | CVE-2026-54291 (SCRAM MITM downgrade) | HIGH | 42.7.11 | 42.7.12+ |
| Alpine base (3.24.4) | — | — | — | **0 CVEs** |

### Frontend (`sprint2-frontend`) — 13 vulnerabilities (1 CRITICAL, 12 HIGH)

All in the Alpine base of `nginxinc/nginx-unprivileged:stable-alpine` (3.24.2):

| Package | CVEs | Severity | Installed | Fixed in |
|---|---|---|---|---|
| `brotli-libs` | CVE-2026-111497 (OOB write) | CRITICAL | 1.2.0-r1 | 1.2.1-r0 |
| `curl`/`libcurl` | CVE-2026-92392 (HTTP/2 UAF) | HIGH | 8.22.0-r0 | 8.23.0-r0 |
| `libexpat` | CVE-2026-113351, CVE-2026-115506, CVE-2026-117610, CVE-2026-118370 | HIGH | 2.9.0-r0 | 2.10.0-r0 |
| `libxslt` | CVE-2026-125350, CVE-2026-87636, CVE-2026-9947 | HIGH | 1.1.43-r3 | 1.1.43-r4 |
| `musl`/`musl-utils` | CVE-2026-107891 (arbitrary code execution) | HIGH | 1.2.6-r2 | 1.2.6-r3 |

## 2. Remediation

1. **Backend — upgrade Spring Boot parent `3.5.16` → `4.1.2`** (`backend/pom.xml`).
   Spring Boot 4.1.2 manages the patched versions in one step:
   - Spring Framework **7.0.10** (fixes both CRITICAL spring-webmvc CVEs; no 6.2.x fix exists)
   - Tomcat embed **11.0.27** (fixes all 6 Tomcat CVEs)
   - PostgreSQL driver **42.7.14** (fixes CVE-2026-54291)
   - Jackson **3.1.7** line (fixes all 5 Jackson DoS CVEs)
2. **Frontend — patch OS packages in the runtime stage** (`frontend/Dockerfile`):
   ```dockerfile
   USER root
   RUN apk upgrade --no-cache
   USER nginx
   ```
   Upgrades brotli, curl, expat, libxslt, musl, etc. to fixed Alpine packages; build-stage toolchain (Node) never reaches the final image.

Both images remain multi-stage: build toolchains (Maven, Node) and intermediate artifacts stay out of production images.

## 3. Verification — Clean Result

Rebuilt images scanned with a failing gate:

```bash
trivy image --scanners vuln --severity HIGH,CRITICAL --exit-code 1 sprint2-backend
trivy image --scanners vuln --severity HIGH,CRITICAL --exit-code 1 sprint2-frontend
# exit code 0 for both → no HIGH/CRITICAL findings
```

| Image | Before | After |
|---|---|---|
| `sprint2-backend` | 14 (7 CRITICAL, 7 HIGH) | **0** |
| `sprint2-frontend` | 13 (1 CRITICAL, 12 HIGH) | **0** |

Post-patch smoke test: `docker compose up -d` → all services healthy; `GET /api/hello` returns `database: up`; frontend proxy and actuator health both `UP`.

## 4. Reproduce

```bash
docker compose build
trivy image --scanners vuln --severity HIGH,CRITICAL --exit-code 1 sprint2-backend
trivy image --scanners vuln --severity HIGH,CRITICAL --exit-code 1 sprint2-frontend
```
