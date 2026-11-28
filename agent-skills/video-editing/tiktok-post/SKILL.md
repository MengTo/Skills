---
name: tiktok-post
description: Post or schedule a video on TikTok through TikTok Studio on the web, in the built-in browser pane, so it goes out public with its caption, the AI-generated label and the right settings. Use this for every TikTok post while TikTok has not approved Fil's app, because a TikTok post sent from Fil (or any unapproved API app) never appears on the account even though Fil says "posted". Use when someone says "post it to TikTok", "upload the TikTok", "schedule the TikTok", "did it post to TikTok?", "why isn't it on TikTok", or schedules a short, reel or Short for Instagram, YouTube Shorts and TikTok together, even if they only say "post the short everywhere".
---

# TikTok post, through TikTok Studio

Run of 26 Nov 2026 (a 58 s short of a long tutorial). Fil had reported TikTok shorts as "posted", and TikTok
Studio showed none of them. The reason: until TikTok approves an app, its API allows only "Only me" or the
drafts inbox. So TikTok is posted by hand through TikTok Studio on the web, with the agent doing everything
but one move.

## Ask these first

1. Which video file, and is it the TikTok cut? (For a short with two cuts, TikTok takes the one that ends on
   "full video in the description", never the "Comment WORD" Instagram cut.)
2. Which account? Read the handle TikTok Studio shows and say it back.
3. Now, or scheduled for when? Give the time with its zone.
4. The caption: take it from the post node's `tiktok` variant in Fil (read_file on the post node), or ask.
5. Is the post sponsored, and does the deal want TikTok's "Disclose post content" label? Default is off; a caption
   line such as "The full video is sponsored by X" is not the label.

Posting is public. Post or schedule only on the owner's typed yes for that exact video, that turn. Scheduling in
TikTok Studio counts as posting.

## What the agent can't do

- **Attach the file.** The built-in pane has no file-attach tool. TikTok's page refuses local addresses (its
  content security policy), the pane opens pop-ups in the same tab, and `window.name` is cleared between sites.
  Don't retry those. Claude in Chrome's file tool stops at 10 MB.
- **Sign in.** Never type a password or a code. If TikTok shows a sign-in page or a bot check, stop and say so.

So the owner makes one move: dropping the file on the upload page.

## Steps

1. **Check what's there.** Open `https://www.tiktok.com/tiktokstudio/content` in the pane. If it asks for a
   sign-in, ask the owner to sign in there. Read the Posts and Drafts counts and the newest rows, so a copy that
   already exists (public, "Only me" or a draft) isn't posted twice.
2. **Hand over the file.** Reveal the file in Finder (`mcp__ccd_host__reveal_path`, a path inside the project),
   open `https://www.tiktok.com/tiktokstudio/upload`, show the pane, and ask the owner to drag the file onto
   "Select video to upload". Wait for their word.
3. **Confirm the upload.** The page reads "<file name> · Uploaded (NN MB)". Check the name and size match.
4. **Caption.** The description box starts with the file name. `cmd+a` does not select it: triple-click the text,
   press Backspace, read the box back as empty, then type the caption. Type each hashtag on its own with a space
   after it and a 2 s wait, then read the box back and compare with the source text.
5. **Settings.** Press Show more.
   - When to post: Now, or Schedule with the date and time.
   - Who can see this post: Everyone.
   - AI-generated content: on when the video has AI pictures, an AI twin or an AI voice. A dialog asks to
     confirm: Turn on. The preview then says "Creator labeled as AI-generated".
   - Disclose post content: only if the deal asks for TikTok's label.
   - Leave comments, reuse and audience control as they are.
6. **Checks.** Read the Checks block. Post only when the music copyright check and the content check say
   "No issues found". Anything else: stop and show the owner the exact words.
7. **Post.** Press Post. The page goes back to the content list.
8. **Read it back.** The new row is second, under the pinned post. Take its link from the row
   (`https://www.tiktok.com/@<handle>/video/<id>`). A new post often shows "Only me · Content under review";
   that is TikTok's review hold (it says within 12 hours), not the setting. Say so, and say it is not public yet.
9. **Report.** The link, what was set, the review state, and anything not checked. Log it where the job keeps its
   record (date, where, what, cost, the owner's words).

## With Fil's scheduled posts

- Keep the `tiktok` variant on the post node: it holds the caption and the file.
- Don't schedule TikTok through Fil until TikTok approves the app. If a Fil TikTok schedule exists, tell the
  owner it will say "posted" and put nothing on the account, and ask before removing it.
- Fil's "posted" for TikTok carries no link. Never report a TikTok post as done from Fil alone: open TikTok
  Studio's content list and find the row.
- TikTok has no comment-to-DM automation here. The full-video link goes in the caption.

## Checking later

Open the content list again. "Everyone" on the row with a view count means the review cleared. Still "Only me"
after 12 hours: click "Content under review" on the row and report what it says, word for word.
