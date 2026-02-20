# How to Push Updates to the resilient-frontend GitHub Repo

## Quick check: Is anything blocking?

Your **resilient-frontend** repo is currently **clean and up to date** with GitHub (no uncommitted changes). If you see "5 file changes" in Cursor/VS Code, the app may be using a **different Git repo** (your home folder). Follow the steps below so the right repo is used and future pushes work.

---

## Step 1: Open the correct folder in Cursor

So that Cursor uses the **resilient-frontend** Git repo (not the one in your home folder):

1. In Cursor: **File → Open Folder…** (or **File → Open…** on Mac).
2. Go to **Downloads** and open the folder **resilient-frontend** (not the parent "Downloads").
3. Click **Open**.

The bottom-left of Cursor should show something like `resilient-frontend` (the folder name). In Source Control you should see branch **main** and the remote **origin** pointing at the resilient-frontend repo.

---

## Step 2: If Git says "Another git process is running"

A stuck lock file can block commits and pushes. Remove it:

**Option A – Terminal (recommended)**

1. In Cursor: **Terminal → New Terminal**.
2. Run (copy-paste as one line):

   ```bash
   rm -f /Users/david/Downloads/resilient-frontend/.git/index.lock
   ```

3. Try your Git action again (commit or push).

**Option B – If you use Git in your home folder too**

If the error persists, clear the other repo’s lock as well:

```bash
rm -f /Users/david/.git/index.lock
```

---

## Step 3: Push your changes (when you have new edits)

When you have **new or modified files** you want on GitHub:

1. **Save all files** (e.g. Cmd+S / Ctrl+S).
2. **Open the Terminal** in Cursor (Terminal → New Terminal). Ensure the prompt shows you’re inside `resilient-frontend` (e.g. path ends with `resilient-frontend`).
3. Run these commands one after the other:

   ```bash
   cd /Users/david/Downloads/resilient-frontend
   git status
   ```

   Check that the listed files are the ones you changed. If you see "nothing to commit", there are no changes to push.

4. **Stage your changes:**

   ```bash
   git add .
   ```

   (Or stage specific files: `git add path/to/file1 path/to/file2`.)

5. **Commit:**

   ```bash
   git commit -m "Describe your changes in a short message"
   ```

   Example: `git commit -m "Fix portfolio upload URL and panel summary"`

6. **Push to GitHub:**

   ```bash
   git push origin main
   ```

   If it asks for a password, use a **Personal Access Token** (not your GitHub password). You can create one under GitHub → Settings → Developer settings → Personal access tokens.

---

## Step 4: If push is rejected ("updates were rejected")

If GitHub says the remote has new commits you don’t have:

```bash
cd /Users/david/Downloads/resilient-frontend
git pull origin main --no-rebase
git push origin main
```

That pulls the latest `main` into your branch and then pushes your commits.

---

## Summary

| Goal                         | Action |
|-----------------------------|--------|
| Cursor use resilient-frontend Git | **File → Open Folder** → select `resilient-frontend`. |
| "Another git process" error | Run: `rm -f /Users/david/Downloads/resilient-frontend/.git/index.lock` |
| Push new changes             | In Terminal: `cd` to resilient-frontend → `git add .` → `git commit -m "message"` → `git push origin main` |

---

**Repo location:** `/Users/david/Downloads/resilient-frontend`  
**Remote:** `origin` → https://github.com/dizzy1900/resilient-frontend.git  
**Branch:** `main`
