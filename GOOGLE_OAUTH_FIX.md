# Fix Google Sign-In App Name

When users sign in with Google, they see a weird app name instead of "Allone". Follow these steps to fix it.

## Steps to Fix

### 1. Go to Google Cloud Console
- Open: https://console.cloud.google.com
- Sign in with the account that owns the OAuth credentials

### 2. Select Your Project
- Click the project dropdown at the top
- Select the project that has your OAuth credentials
- If you're not sure which project, check Supabase Dashboard > Authentication > Providers > Google

### 3. Navigate to OAuth Consent Screen
- In the left sidebar, go to **APIs & Services** > **OAuth consent screen**
- Or direct link: https://console.cloud.google.com/apis/credentials/consent

### 4. Update App Information
Click "EDIT APP" and update these fields:

| Field | Value |
|-------|-------|
| **App name** | `Allone` |
| **User support email** | Your support email |
| **App logo** | Upload the Allone logo (optional but recommended) |
| **Application home page** | `https://allone.ge` |
| **Application privacy policy link** | `https://allone.ge/privacy` |
| **Application terms of service link** | `https://allone.ge/terms` |

### 5. Update Authorized Domains
Make sure `allone.ge` is in the list of authorized domains.

### 6. Save Changes
Click "SAVE AND CONTINUE" through all steps.

## Verify in Supabase

After updating Google Cloud Console:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/cywmdjldapzrnabsoosd
2. Navigate to **Authentication** > **Providers**
3. Click on **Google**
4. Verify the OAuth credentials match your Google Cloud project

## Testing

After making these changes:
1. Clear your browser cache or use incognito mode
2. Go to your login page
3. Click "Sign in with Google"
4. The consent screen should now show "Allone" as the app name

## If It Still Shows Wrong Name

The change may take a few minutes to propagate. If it still shows the wrong name:

1. Check that you updated the correct Google Cloud project
2. Make sure the OAuth client ID in Supabase matches the one in Google Cloud
3. Try signing out of Google completely and signing back in

## Notes

- Changes to the OAuth consent screen may take up to 30 minutes to appear
- Users who have already authorized the app may still see cached information
- If your app is in "Testing" mode, only test users can sign in
