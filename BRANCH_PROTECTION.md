# 🔒 Branch Protection Configuration — develop-v2.1

## GitHub Settings → Branches → Add Rule

### Branch Name Pattern
```
develop-v2.1
```

---

## ✅ Required Settings

### Pull Request Requirements
| Setting | Value | Reason |
|---------|-------|--------|
| ✅ Require a pull request before merging | ON | Block direct pushes |
| Required approving reviews | **1** | Peer review minimum |
| ✅ Dismiss stale PR approvals when new commits are pushed | ON | Prevent approval hijacking |
| ✅ Require review from CODEOWNERS | ON | Domain expert validation |
| ✅ Require approval of the most recent reviewable push | ON | No self-approval |
| ✅ Require conversation resolution before merging | ON | Address all feedback |

### Status Checks
| Setting | Value |
|---------|-------|
| ✅ Require status checks to pass before merging | ON |
| ✅ Require branches to be up to date before merging | ON |
| Required checks | `lint`, `test`, `build-preview` |

### History & Integrity
| Setting | Value | Reason |
|---------|-------|--------|
| ✅ Require linear history | ON | Clean bisect history |
| ⬜ Require signed commits | OFF | Team not yet adopted GPG |
| ⬜ Require merge queue | OFF | Low volume, manual queue OK |

### Restrictions
| Setting | Value |
|---------|-------|
| ✅ Restrict who can push to matching branches | ON |
| Allowed actors | `@krishiai-maintainers`, `@krishiai-leads` |
| ⬜ Allow force pushes | OFF |
| ⬜ Allow deletions | OFF |

### Admin Override
| Setting | Value |
|---------|-------|
| ✅ Do not allow bypassing the above settings | ON |

---

## 🏷️ Tag Protection (Recommended)

Settings → Tags → Add Rule
```
pattern: v2.1.*
```
- ✅ Restrict creations: Only maintainers
- ✅ Restrict updates: Only maintainers
- ✅ Restrict deletions: Only maintainers

---

## 🔄 CODEOWNERS File

Create `.github/CODEOWNERS`:
```
# Global fallback
* @krishiai-maintainers

# Frontend components
src/components/MapTab.jsx @krishiai-frontend-leads
src/styles/MapTab.css @krishiai-frontend-leads

# Backend / GEE pipeline
backend/main.py @krishiai-backend-leads
backend/ @krishiai-backend-leads

# CI/CD configuration
.github/workflows/ @krishiai-devops
```

---

## 📋 Post-Setup Checklist

- [ ] Branch protection rule active on `develop-v2.1`
- [ ] Tag protection active on `v2.1.*`
- [ ] CODEOWNERS file committed to repo
- [ ] Team permissions verified in Settings → Manage Access
- [ ] CI status checks appearing in PRs
- [ ] Test PR created and merged successfully
