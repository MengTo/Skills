# Fil social post

## Attach the original master

Resolve the user's canvas in Fil, then read it. Look for the release's existing social-post node before creating one. For a new draft use `add_node` with `kind: "code"`, `format: "post"` and `draft: true`. Use `write_file` to set the post content.

Call `upload_file` on that canvas. For a large MP4, follow the direct-storage flow Fil returns. Request the upload ticket with the encoded filename, PUT the original bytes with the ticket's content type, then POST the finish URL. Keep signed URLs out of the skill, caption and handoff. Retain the final asset ID. Check the reported filename, format, duration and byte count against the master receipt. If an upload or finalization response is lost, check the Fil library before repeating the upload. For a same-name candidate, compare SHA-256 by streaming its original bytes when necessary.

## Write platform variants in place

Read the post immediately before editing. Fil can store newer user copy in `variants.x.posts` even when the top-level `posts` array contains an older caption. Make the smallest edit to the requested platforms. Preserve the author's latest wording, media trims and other platform settings. For a new release, use the X caption as the base and set each platform explicitly. Use one entry in each platform's `posts` array so readers get every link in the caption.

Here is the object shape for a **new** node. The variables stand for the actual release values. Serialize the object to JSON for `write_file`.

```js
const item = (text) => ({
  id: slug,
  text,
  media: [{ type: "video", src: "facet:asset/" + assetId, alt: videoDescription }]
});
const draft = {
  title: projectName,
  platform: "x",
  posts: [item(xCaption)],
  variants: {
    x: { posts: [item(xCaption)] },
    threads: { posts: [item(threadsCaption)] },
    linkedin: { posts: [item(linkedInCaption)] }
  }
};
```

Use full HTTPS URLs as plain text. The demo link should open the interactive HTML directly. Link each skill to its own published folder. Before saving the X version, use Fil's platform counter, which accounts for X's link shortening. When space is tight, shorten labels and keep a single concrete interaction. The Threads version can keep the interaction and two skills. For LinkedIn, explain a design or engineering choice that the video actually shows, then name the resources readers can use.

For example, a LinkedIn caption about Studio Glass could open with “I used GPT 6.2 Astra to recreate a designer's desk in Three.js. Pull the blinds and the shadows on the desk move with them.” Follow with how the blinds shape the light shafts, then give the live preview and labeled skill URLs. Replace the model and mechanism with evidence from the current project.

## Verify the saved post

Read the node again. Check the active platform overrides, single-post counts, exact demo URL, skill URL sets and matching `facet:asset/` ID on all three. Preview each platform in Fil when available. Confirm the MP4 plays through its intended end and the links are in the captions. If a second thread item was used in a previous draft, move its requested links into the main caption before removing that item. Preserve unrelated authored replies unless the user asks for a single-post conversion.

Return Fil's actual viewer URL. A saved draft has no public X status URL. For an authorized publish, use the status URL Fil or X returns. If publishing times out, check whether the post already exists before sending it again.
