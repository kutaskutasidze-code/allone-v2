# Deploying allone-offer-generator to Fly.io

The service was running only on `localhost:3100` until now, which meant
the `/api/admin/demos` proxy on Vercel had nothing to talk to and every
"Generate demo" click in the sales UI silently failed.

## One-time setup

1. **Authenticate the Fly CLI** (opens a browser):

   ```bash
   flyctl auth login
   ```

2. **Vendor site-xray scripts into the build context.** The Dockerfile
   copies `vendor/site-xray/`, so populate it once:

   ```bash
   cd ~/Projects/allone-website/offer-generator
   rsync -a --exclude='node_modules' --exclude='output*' \
         --exclude='*-clone' --exclude='goga*' --exclude='cactus-clone' \
         --exclude='kenkais-*' --exclude='ui' --exclude='.git' \
         ~/Projects/site-xray/ vendor/site-xray/
   ```

   _(The .dockerignore reapplies the same excludes during the build, so
   nothing accidentally pulls in 30 GB of cloned-site output.)_

3. **Create the Fly app** (just registers the name + region):

   ```bash
   cd ~/Projects/allone-website/offer-generator
   fly launch --no-deploy --copy-config --name allone-offer-generator --region fra
   ```

4. **Set secrets.** API_SECRET_KEY can be generated fresh — it's what
   the Vercel proxy will send as `Authorization: Bearer …`. The rest
   should reuse existing keys from Keychain / 1Password.

   ```bash
   API_SECRET=$(openssl rand -hex 32)
   fly secrets set \
     API_SECRET_KEY="$API_SECRET" \
     ANTHROPIC_API_KEY="$(security find-generic-password -s anthropic-api-key -w)" \
     SUPABASE_URL="https://cywmdjldapzrnabsoosd.supabase.co" \
     SUPABASE_SERVICE_ROLE_KEY="$(security find-generic-password -s supabase-service-role -w)" \
     VERCEL_TOKEN="$(security find-generic-password -s vercel-api-token -w)" \
     VERCEL_TEAM="allonelabs" \
     RESEND_API_KEY="$(security find-generic-password -s resend-allone-ge -w)" \
     RESEND_FROM_ADDRESS="demo@allonelabs.com" \
     PUBLIC_SITE_URL="https://www.allonelabs.com" \
     DEMO_SUPABASE_URL="https://cywmdjldapzrnabsoosd.supabase.co" \
     DEMO_SUPABASE_SERVICE_ROLE_KEY="$(security find-generic-password -s supabase-service-role -w)"
   echo "Save this for Vercel: $API_SECRET"
   ```

5. **Create the volume** (one time, before first deploy):

   ```bash
   fly volumes create offer_data --region fra --size 5
   ```

6. **Deploy:**

   ```bash
   fly deploy
   ```

7. **Set Vercel env vars** so allone-website can reach the service:
   ```bash
   TOKEN=$(security find-generic-password -s vercel-api-token -w)
   PROJ=prj_vALgScTNiYmbC7A3FcKIantgwn7t
   TEAM=team_8hZyq1KpOr0INKc23GWvxpku
   for env in production preview development; do
     curl -s "https://api.vercel.com/v10/projects/$PROJ/env?teamId=$TEAM" \
       -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
       -d "{\"key\":\"OFFER_API_URL\",\"value\":\"https://allone-offer-generator.fly.dev\",\"type\":\"encrypted\",\"target\":[\"$env\"]}"
     curl -s "https://api.vercel.com/v10/projects/$PROJ/env?teamId=$TEAM" \
       -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
       -d "{\"key\":\"OFFER_API_KEY\",\"value\":\"$API_SECRET\",\"type\":\"encrypted\",\"target\":[\"$env\"]}"
   done
   # Trigger a Vercel redeploy so the new env vars apply
   vercel --prod --token "$TOKEN"
   ```

## Smoke test

```bash
# Health (no auth)
curl https://allone-offer-generator.fly.dev/health

# A real demo enqueue (auth)
curl -X POST https://allone-offer-generator.fly.dev/api/demos \
  -H "Authorization: Bearer $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"lead_id":"<real-lead-id>"}'
```

If both come back 200, click "Generate demo" on a lead in `/sales` and
watch `fly logs` — you'll see the xray pipeline phases stream by.
