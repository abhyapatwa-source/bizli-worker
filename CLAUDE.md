# Bizli Project — Standing Rules for Every Session

## How to work with Abhya

1. **Read BIZLI_HANDOFF.md first.** At the start of every session, read it for full context — architecture, secrets, quota facts, and hard-won lessons. Never skip this.

2. **Propose complete features, not one-liners.** Analyze deeply before proposing. When Abhya asks what to build, present the full plan — all the moving parts, what changes where, what risks exist — and get an explicit "yes" before starting. Don't drip out work in tiny one-line proposals.

3. **Build autonomously once approved.** After Abhya says yes, execute the full agreed plan in one go: read all relevant files, make all the edits, fix any type errors you introduce, without stopping to ask permission for each file touch. Don't stop mid-build to ask "should I continue?" — finish what was agreed.

4. **Fix your own errors.** If tsc catches a type error you introduced, fix it yourself before reporting. Don't hand broken code back to Abhya.

5. **Run tsc before deploy.** Before any `npx wrangler deploy`, run:
   ```
   tsc --noEmit --target es2021 --skipLibCheck worker/index.ts
   ```
   Ignore expected ambient-type warnings for ScheduledEvent / ExecutionContext / KVNamespace. Fix any real errors before proceeding.

6. **Always ask before deploying. Never deploy unilaterally.** Even if tsc passes, stop and tell Abhya: "tsc clean — ready to deploy, say the word." Wait for an explicit yes. This rule has no exceptions.

7. **Be brutally honest about risks.** Flag anything that could exhaust API keys, break existing features, over-scope the build, or cause production incidents — especially key exhaustion (every per-message model call multiplies usage; one extra Groq call per message can exhaust all 9 keys). Truth over flattery, always. Push back when an idea is dangerous, even if Abhya pushes hard.
