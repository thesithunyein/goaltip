# Recording checklist (after deploy)

Do this **after** Phase 1 is live on Vercel — not before.

1. [ ] `git push` / Vercel deploy finished
2. [ ] Open https://goaltip-web.vercel.app/api/health → `"persistence":"redis"`  
       If `"memory"`, add Upstash env vars on Vercel and redeploy
3. [ ] Two browsers: create capped room → join via invite on device B
4. [ ] Tip 1 USDt → **Verified** appears → explorer matches hash
5. [ ] Over-cap tip blocked before signing
6. [ ] Host **Settle match** → both devices show winner + locked tips
7. [ ] Record ~100s using [docs/DEMO_SCRIPT.md](./DEMO_SCRIPT.md) (one-paragraph take at bottom)
8. [ ] Upload YouTube unlisted → paste URL into DoraHacks + [SUBMISSION.md](../SUBMISSION.md) + README
