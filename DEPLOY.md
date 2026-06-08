# How to Deploy Ask Us — No Terminal Needed

## What you need
- A free GitHub account → github.com
- A free Vercel account → vercel.com (sign up with GitHub)
- Your Anthropic API key → console.anthropic.com

---

## Step 1 — Put the files on GitHub

1. Go to **github.com** and click the **+** (top right) → **New repository**
2. Name it: `neurothinkhub-ask-us`
3. Set it to **Private**
4. Click **Create repository**
5. On the next screen, click **uploading an existing file**
6. Drag and drop ALL the project files and folders into the upload area:
   - `src/` folder
   - `api/` folder
   - `package.json`
   - `vercel.json`
   - `vite.config.js`
   - `index.html`
   - `.env.example`
7. Click **Commit changes**

> GitHub now has your code.

---

## Step 2 — Connect Vercel

1. Go to **vercel.com** → Sign up / Log in with your GitHub account
2. Click **Add New Project**
3. Find `neurothinkhub-ask-us` in the list and click **Import**
4. Vercel will detect it as a Vite project automatically
5. Click **Deploy** — it will fail the first time (that is expected, the API key is missing)

---

## Step 3 — Add your API key

1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Click **Add New**:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your key from console.anthropic.com (starts with `sk-ant-...`)
   - Tick all three boxes: Production, Preview, Development
3. Click **Save**
4. Go to **Deployments** → click the three dots on the latest deployment → **Redeploy**

> Your widget is now live at a URL like `neurothinkhub-ask-us.vercel.app`

---

## Step 4 — Add to your website

### Option A — Link from your page (simplest)
Just add a button or link on your WordPress site pointing to the Vercel URL.

### Option B — Embed it in a page
In Elementor, add an **HTML widget** and paste this:

```html
<iframe
  src="https://neurothinkhub-ask-us.vercel.app"
  width="100%"
  height="680px"
  style="border:none; border-radius:14px;"
  title="Ask Us — NeuroThinkHub"
></iframe>
```

Replace the URL with your actual Vercel URL.

---

## Future updates
When you want to update the widget, just go back to your GitHub repo → find the file → click the pencil icon to edit → save. Vercel picks up the change and redeploys automatically within a minute.

---

## Costs
| Platform | Cost |
|---|---|
| GitHub | Free |
| Vercel | Free |
| Claude Haiku API | ~£2–5/month at normal traffic |
