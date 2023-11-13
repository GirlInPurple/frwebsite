# frwebsite

A complete rewrite of the Final Republic website, sharing as little code as possible with the original site as to not have any licensing issues.

This fork was created cause the old site and repo is a mess, and i don't want any overhead with developing the site anymore, being the other admins and Github Pages having no server-side support.

## contributing

Feel free to fork and add your own features, but there is no guarantee i will merge them. Please submit them as PRs, not full commits.

I should also mention that you need to keep both the [Typescript](https://github.com/microsoft/TypeScript) (`.ts`) and compiled Typescript (`.js`) should be committed to this repo. All TS Map files are ignored as they're only for debugging and IDE support.

To get started, run `npm start`, wait for all the packages to download, and you should be given the Typescript Watcher in that console. Keep it running while you modify the files. Run `npm run` or whatever you have as a keybind for it to start the server. It should be located at [http://localhost:8080](http://localhost:8080)

## written plans

Anything pertaining to an account system has been postponed. Considering i was going to use Microsoft OAuth for it and this being a majority cracked server, i need another plan. Keeping the Alias-IP system until further notice.

- [ ] Update README.md
  - [ ] Contributing Section
  - [ ] Wiki Section
  - [ ] Backend Explanation
- [ ] Cleaning up CSS
  - [x] Consistent Theme
  - [x] Mobile Support
  - [x] Fix the janky header
  - [ ] Dark Mode
- [ ] ~~Account~~ Alias System
  - [ ] ~~Username/Password system~~
  - [ ] Playerhead in the corner using the [Minotar API](https://minotar.net/avatar/notch/100)
  - [ ] ~~New account page~~
- [ ] Donation System
  - [x] Add it to `index.html`
  - [ ] Add monthly donation tracker
- [ ] Wiki system
  - [x] Make the Wiki Editor
  - [ ] Rewrite the Wiki's backend
  - [ ] ~~Intertwine it with the account system~~
- [x] Clean up the file system
  - [x] Have separate directories for images, styles, html, js, json, etc
- [ ] Make it as small and clean as possible
  - [x] Have it be fast and small enough to run on 256mb of ram so it can run on even the cheapest of servers (currently using [FL0](https://www.fl0.com/))
  - [ ] Small file footprint for more Wiki pages
