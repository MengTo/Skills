# Consent: whose face and voice

A digital twin is a likeness and a voice that can say things the person never said. Build one only for:
- **yourself**; or
- **someone who has given you documented consent** for this exact use: a written note naming what will be made (stills,
  talking clips, voice lines), where it will appear, and that they can withdraw it.

Never build one of:
- a public figure, a celebrity, a politician or a creator who hasn't agreed;
- a client, colleague, friend or family member "as a surprise";
- anyone from photos or clips found online;
- a child.

## Platform checks are the owner's to do

The services check identity on purpose. Each check has to be done by the person whose face or voice it is:
- **ElevenLabs Professional Voice Clone:** the owner reads an on-screen passage into their mic. Never use a recording,
  a clone or another person's voice for it, and never click **Skip** to bypass it.
- **Seedance on Fil (BytePlus):** a photoreal face is refused unless that exact picture is in the owner's verified face
  library (Settings › Your face, verified once on their phone). The owner adds each still.
- **Higgsfield:** follow its terms on likeness use.

Never work around a platform's identity or safety check: no cropping to dodge a face filter, no re-encoding, no asking
another model to "make it less recognisable". If a check refuses something, stop and ask the owner.

## In the work

- Keep the reference photos, recordings, voice samples and API keys private. Keys live in a `.env` file (chmod 600),
  never in prompts, logs, chats, commits or screenshots.
- Ask before publishing anything made with the twin, and before posting on the owner's accounts.
- Label generated media as generated where the platform asks for it.
- Keep a log of what was made, with what, and the owner's verdict on each piece.
- Delete what the owner asks you to delete, including voice clones on the provider's side.
