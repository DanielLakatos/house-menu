# House menu

A small home cocktail menu. Guests browse photos, tasting notes and recipes. The editor at `/admin/` saves drafts on the current device and publishes them to GitHub. No server, database subscription, tracking, or paid hosting is needed.

## Your pages

- Guest menu: https://daniellakatos.github.io/house-menu/
- Editor: https://daniellakatos.github.io/house-menu/admin/
- Repository: https://github.com/DanielLakatos/house-menu

The current menu contains 20 cocktails: 15 imported from the host's Cocktails by Steve screenshots, plus Kentucky Buck, Cosmopolitan, Screwdriver, Whiskey Coke and Negroni. Screenshot recipe quantities are preserved. The Kentucky Buck is a house variation with muddled strawberry left in the serving glass; the Cosmopolitan adapts the IBA recipe. Screwdriver and Whiskey Coke use house measures of 50 ml spirit to 150 ml mixer. Descriptions and tasting notes are written for the guest menu, with matching generated photographs. Margarita remains a hidden example in the editor.

## Editing and publishing

1. Open the editor. Select a cocktail or choose Add cocktail.
2. Enter the name, ingredients, recipe, description and tasting notes. Use an HTTPS image URL or upload a JPEG, PNG or WebP. Uploads resize to at most 1000 pixels on their longest side and are embedded in the menu file.
3. Turn on Show on the guest menu for drinks you can serve. Move up/down controls set the order.
4. Use Connect to publish to open GitHub’s fine-grained token page. Select **Only select repositories**, choose **house-menu**, and set **Contents** to **Read and write**. Choose an expiry that suits you. No other write permission is needed for editing.
5. Paste the token into the editor and connect. Connecting loads the latest live menu, so connect before editing, or export your draft before connecting.
6. Make your changes and click Publish menu. GitHub Pages usually updates within a few minutes. Refresh the guest page after publication.

The access token stays in memory for the current tab. It is never saved in the repository or local storage. Reloading or disconnecting clears it. Anyone can view the public editor, but only a GitHub token with write permission can publish.

Drafts are browser-local and do not sync between devices. Export backup keeps a portable copy, including uploaded images. Browser storage can fill up; the editor tells you when it cannot save a draft. Export before closing in that case. The menu has a 20 MB editor limit. External image URLs keep large menus smaller.

If another person or agent edits the live menu, GitHub rejects a stale publish rather than overwriting it. Export your draft, reconnect to load the latest version, and reapply your changes. Importing a backup replaces the complete draft, so review before publishing.

## QR code

Open the editor on the hosted website. Share your menu has a print card and an SVG download. It always points to the guest menu, so edits do not change the QR code. A QR generated on localhost points to localhost and is for preview only.

## Local preview

Requires Node.js 22 or later. No dependency installation is needed.

```sh
npm start
```

Open http://127.0.0.1:4173 and http://127.0.0.1:4173/admin/.

```sh
npm test
```

## Hosting

GitHub Pages uses the `main` branch and repository root, with `.nojekyll` disabling Jekyll. Every commit to main republishes the menu. There is no build step and no custom domain to pay for. Keep this repository public for GitHub Free hosting.

If moved to another repository, update `data/config.json`, enable GitHub Pages from the main branch root, and print a new QR code from the new hosted editor.

## Data and future home tools

`data/menu.json` is the source of truth. `schemaVersion` allows later migrations; cocktail IDs stay stable when names change. Availability is a menu choice, independent of future ingredient inventory. Recipe quantities stay readable strings for now. Future home functions can have separate pages and data files without changing this menu URL.

An agent can edit this file through GitHub. See `AGENTS.md` for the update contract. No AI API key or model subscription is needed by the website.

## Images and third-party code

`assets/drinks/` contains the generated photographs for the current menu. Each uses the same dark green bar setting and one of the host's coupe, old-fashioned or highball glasses. `assets/drinks/prompts.json` records the prompts used by the built-in image-generation tool. `assets/cocktails.png` remains the four-panel example asset for the hidden example drinks. Use images you own or are permitted to reuse.

`assets/vendor/qrcode.js` is qrcode-generator 2.0.4, copyright Kazuhiko Arase, MIT licensed. Its copyright and license notice are preserved in the file. `THIRD_PARTY_NOTICES.md` includes the license terms.
