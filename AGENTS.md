# Cocktail menu updates

The user may supply cocktails in natural language. Convert their instructions into edits to `data/menu.json`. The guest page reads this file; committing to main publishes it through GitHub Pages.

- Read the latest file before editing. Preserve unrelated drinks, settings, and existing IDs.
- Keep `schemaVersion: 1`. Every cocktail has a stable unique string ID, name, description, tastingNotes, ingredients array of strings, recipe, image, imageAlt, imageCredit, and available boolean.
- Use an HTTPS image URL supplied by the user, or a local image asset with a path starting `assets/`. For new photos do not use `imageCrop`; that optional enum exists for the four-panel example asset only.
- Do not infer that the host can serve a cocktail just because a recipe exists. Follow their availability instruction. New unconfirmed drinks default to `available: false`.
- Preserve quantities and units. Ask about missing recipe details rather than inventing the user's recipe.
- Use photo credits when known. Never add credentials or tokens to source files or menu data.
- The host owns coupe, old-fashioned and highball glasses. Use only these in generated images and serving instructions. Preserve the optional `glass` field and recipe `source` metadata when editing a drink.
- The settings object has title, intro, and demo boolean. Turn demo off when the user is ready to serve the real menu.
- Array order is display order. Do not add search, navigation or ordering features unless asked.
- Guest search covers names, ingredients, tasting notes and the optional `tags` string array. Maintain tags when updating a drink. Photos and Compact are the supported guest views.
- `additionalDrinks` is an optional array of plain names shown in a separate section below the cocktails. The host can edit it in the admin page. An empty array hides the section. Do not invent brands or varieties the host has not confirmed.
- Run `npm test` after data changes. Inspect the guest view if layout or images change.
- For concurrent updates use the current blob SHA or commit and reject stale writes. Do not overwrite another writer's update automatically.
- A browser draft is not the live menu. Commit only the user-authorized content and report the result.
