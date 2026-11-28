---
name: short-release
description: Release a finished 9:16 short on Instagram, YouTube Shorts and TikTok and close the release out. One Fil post node with a variant per platform, the Instagram comment-keyword Auto-DM set ahead, the Short's Related video pointed at the full video, TikTok posted through TikTok Studio, then the after-post check (links, privacy, review state, DMs sent, labels), the free pack kept true, a ledger line for every public action, and a short list of what is still open. Use when someone says "post the short", "schedule the short everywhere", "release the reel", "post it now", "did it post?", "check the posts", "is the automation on?", "close out the release", "what's left on this video?", or hands over a finished short of a sponsored or long video, even if they name only one platform or one of these steps. To make the short itself use room-short-9x16, room-short-portrait-face or long-video-to-short; for the long video use youtube-video-release; for the TikTok upload alone use tiktok-post.
---

# Short release: post everywhere, then close it out

The run this comes from: the Linen short (a 58 s short of a sponsored 22-minute tutorial), posted Thu 26 Nov 2026
on Instagram, YouTube Shorts and TikTok and closed out over the next two days. Making the short is another skill.
This one starts when the files are final and ends when nothing public is wrong and the owner knows what is left.

Most of the work is checking. Each platform fails in its own quiet way: Fil says a TikTok is "posted" when
nothing reached the account, a Studio setting reads as saved and is not, a new TikTok sits on "Only me" while
it is reviewed. So every step ends with reading the real thing back, and the report says what was not read.

## Ask these first

1. Which files? A short usually has two cuts: Instagram's ends "Comment WORD", and the Shorts and TikTok cut
   ends "full video in the description". Check each is under 30 MB, 1080 × 1920, and the cut it claims to be.
2. Which accounts, one per platform? Say the handles back.
3. When, with the time zone? Is the full video already public? It should be before the short goes out.
4. Is there a comment keyword? If yes: the reply, the DM text, and its buttons with their links.
5. Is it sponsored? Then get the contract's words: what must be said, what must never be said, the offer link,
   and which labels the deal wants (paid partnership on Instagram, TikTok's "Disclose post content").
6. Does the short have AI pictures, an AI twin or an AI voice? Then every platform's AI label should be Yes.
7. Where is the job's ledger? If there is none, make `ledger.tsv` in the job folder:
   date, where, what happened, cost, the owner's words.

## Rules

- Nothing goes public, is scheduled, moved or replaced without the owner's typed yes for that exact thing in
  that turn. A yes for one platform is not a yes for the next. Scheduling counts as posting.
- A message to the sponsor needs the owner's words. Never change who can see the campaign canvas.
- Price a paid run before running it. Log every run and every public action in the ledger with the owner's words.
- Use the built-in browser pane. Never type a password or a code: if a site shows a sign-in page, name the
  host and ask the owner to sign in there.
- Never report a post as done from a tool's "posted". Open the post and read it.

## 1. One post, three variants

Make one Fil post node on the campaign canvas (platform instagram), with `variants` for `youtube-short` and
`tiktok`. Each variant has its own text, title and video. One node means one card in Automations; three nodes
is wrong.

- Instagram: the caption, one post, no thread. Its cut ends on the comment keyword.
- YouTube Short: a title and a description with the full video's link.
- TikTok: the caption with the full video's link, since TikTok has no comment-to-DM here.
- Sponsored: only say what the contract allows. A caption line such as "The full video is sponsored by X" is
  not a platform label; set the label too if the deal asks for one.

Read the node back with `read_file` and compare every text with what the owner approved.

## 2. Schedule, with the Auto-DM set ahead

On the owner's yes, schedule each platform from that one node (`add_automation`, one per platform, same time).

Set the comment-keyword rule in the same step, on the Instagram schedule (`auto_dm`, or "Auto-DM commenters"
beside Schedule on the post's Instagram tab): the keyword, the reply, the DM text and its buttons. Fil makes
the live rule when the reel goes out. Do not book a task for after the post to make it.

Read it back with `list_automations`: the schedule should say "Auto-DM on WORD when it posts".

To move the time later ("post it now"), update the same schedules. Never make new ones beside them.

## 3. TikTok goes through TikTok Studio

Until TikTok approves Fil's app, a TikTok post sent from Fil never appears on the account, so post it by hand
in TikTok Studio on the web (the `tiktok-post` skill, if you have it, is these steps in full): open
`https://www.tiktok.com/tiktokstudio/upload` in the pane, the owner drags the file onto TikTok Studio's upload page, the agent sets the caption,
Everyone and the AI-generated label, and posts on the owner's yes. Keep the `tiktok` variant on the node, as it holds
the caption and the file. If a Fil TikTok schedule exists, tell the owner it will say "posted" and put nothing on
TikTok.

## 4. Right after it posts

Do these in order and write down each result.

1. `list_automations`: each schedule's state, with its link or its exact error. A failed one is not retried
   without the owner's yes.
2. Instagram: open the reel's link. Check the caption and that the keyword rule is live on that reel only
   (`list_automations` shows it "on"). If the reel posted and no rule exists, make one in Fil's Automations
   with the same values. Never make a second.
3. YouTube Short: open `https://studio.youtube.com/video/<id>/edit`. Check it is Public, set Related video to
   the full video, save, reload and read it back. For a sponsored short, read the Paid promotion setting too.
4. TikTok: take the link from TikTok Studio's content list. A new post often shows "Only me · Content under
   review" for up to 12 hours. Say it is not public yet.
5. Tell the owner to set the AI label by hand where the agent cannot (Instagram and YouTube), and ask them to
   confirm it. TikTok's is set during the upload.
6. Add one ledger line per platform: the link, what was set, the owner's words.
7. Send the owner the three links, what was read back, and what was not.

## 5. The next day

- Fil's Automations card for the keyword rule: comments, DMs sent, links sent, failures. Report the numbers.
- TikTok Studio's content list: "Everyone" on the row with a view count means the review cleared. If the pane
  is signed out of TikTok, the public video page still shows whether it plays, its likes and its AI label,
  but no view count or privacy row. Say which one was read. Still "Only me" after 12 hours: open "Content
  under review" on the row and report its words.
- The full video: still Public, the pinned comment still pinned, Paid promotion still Yes.

## 6. The free pack

The pack is what the DM button and the pinned comment hand out, so it must match what the video promises.

- Find the folder the published ZIP was built from before changing anything. It may not be the copy in the
  job folder: compare the files.
- Read every file before republishing. Look for a missing link to the full video in the README, credits for
  anything made by someone else (sound, pictures, map data), private paths, keys or tokens.
- A file from someone else with no stated licence comes out, unless the owner has permission.
- To change the pack, rebuild the ZIP and replace it at the same link, so the DM button and the pinned
  comment keep working. Then download the link and check the new file is what it serves.
- Replacing a public file needs the owner's yes.

## 7. Close out

End with one short list, each line a yes or no for the owner:

- labels to confirm by hand,
- pack changes waiting on a yes,
- old post nodes or schedules left on the canvas that Fil would not remove,
- other shorts whose Fil TikTok schedules will post nothing,
- anything not read back, and why.

Turn off any after-post check task once its work is done, and say if one sits on another account.

## What went wrong on the Linen run

- Fil listed the TikTok as posted with no link. TikTok Studio had no post since August. It was posted by hand
  the same afternoon.
- The Short's Related video could not be set at post time because the pane was signed out of Google. It was
  set after the owner signed in, then saved, reloaded and read back.
- The check task booked for after the post sat on a different Claude account from the one the app was on.
  The Auto-DM set ahead on the schedule made the task unnecessary.
- The pack's README matched the job folder's copy, but the pages were only in the folder the ZIP was built
  from. One page embedded a lake recording from a personal site, credited only in an HTML comment.
- The pane was signed out of TikTok a day later, so the view count could not be read. The public page showed
  the video playing with its likes and the AI-generated label.
