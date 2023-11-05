# frwebsite

A complete rewrite of the Final Republic website, sharing as little code as possible with the original site as to not have any licensing issues.

This fork was created cause the old site and repo is a mess, and i don't want any overhead with developing the site anymore, being the other admins and Github Pages having no server-side support.

## contributing

Feel free to fork and add your own features, but there is no guarantee i will merge them. Please submit them as PRs, not full commits.

## written plans

- [ ] Update README.md
  - [ ] Contributing Section
  - [ ] Wiki Section
  - [ ] Backend Explanation
- [ ] Cleaning up CSS
  - [x] Consistent Theme
  - [ ] Mobile Support
  - [x] Fix the janky header
- [ ] ~~Account~~ Alias System
  - [ ] ~~Username/Password system~~
  - [ ] Playerhead in the corner using the [Minotar API](https://minotar.net/avatar/notch/100)
  - [ ] ~~New account page~~
- [ ] Donation System
- [ ] Wiki system
  - [ ] Make the Wiki Editor
  - [ ] Rewrite the Wiki's backend
  - [ ] ~~Intertwine it with the account system~~
- [ ] Clean up the file system
  - [ ] Have separate directories for images, styles, html, js, json, etc
- [ ] Make it as small and clean as possible
  - [x] Have it be fast and small enough to run on 256mb of ram so it can run on even the cheapest of servers (currently using [FL0](https://www.fl0.com/))
  - [ ] Small file footprint for more Wiki pages

## structure

### wiki

The wiki uses a markdown file ran through a MD-HTML converter to add new pages, as it makes it much faster to write them. A tool is in the works that allows you to write pages automatically.

here is a basic wiki page, using HTML format for now.

```html
<span class="tag tag-green">Location</span>
<span class="tag tag-blue">English</span>
<br><br>
<span class="tag tag-blurple">DJzombiehunter</span>

<h2>Placeholder Title</h2>
<h3>Summary</h3>
<p>
    placholder
</p>

<h3>Residents</h3>
<ul>
    <li><a href="#alakazam6898">@Alakazam6898</a> (Owner / Main Builder)</li>
</ul>

<h3>Maps, Images, and References</h3>
<!-- Use the button to hide/show the image, and hide it by default -->
<button onclick="toggleElementVisibility('cublak-view_13/06/23')">Click to show image "cublak-view_13/06/23"</button>
<img id="cublak-view_13/06/23" src="https://media.discordapp.net/attachments/1061516148325220455/1118033620024709120/image.png" alt="Image 1" style="display:none;">

<ul>
    <li><a href="#reference-id">reference-placholder</a></li>
</ul>

<h3>Trivia</h3>
<li>
    The name Cublak View is made of 3 parts; Cube > Cub, Lakshyapowerman > Lak, Mountain View > View. It was a name idea that everyone just stuck with.
</li>
<li>
    This is one of the 4 original towns on the server; being Spawn City, Cublak View, Windswept Fang, and Nether Bay.
</li>

```

Do not use any `<head>`,`<body>`, or `<html>` tags in the wiki page files, as it will break the site completely if that occurs. Any page that contains the `<meta>` tag will not display for security and technical reasons.

### files

if you need to add a file, like an image, video, or subtitles, add it to the [`assets`](./assets/) directory.
