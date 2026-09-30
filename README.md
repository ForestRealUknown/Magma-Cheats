# Magma-Hack

The first-ever Magma-Math Hack. May receive updates later.

---

## Quick Start

1. Press F12 to open DevTools.
2. Go to the Console tab.
3. Open `main.js` and copy everything inside it.
4. Paste it into the console and press Enter.
5. If the console blocks the paste, type `allow pasting` and press Enter first.

That's it. The panel pops up and you're ready to go.

---

## What It Does

- Draws a random "show-your-work" calculation on the whiteboard
- Fills in the correct answer for you
- Or does everything at once: draw, answer, and submit

---

## Warnings

- Do NOT use this on a real test. You can get locked out or worse.

---

## Disclaimer

- I don't know if I'm the first one to make this, but I've never seen one before, at least.
- It doesn't work with bookmarks — at least not the whiteboard part. But if you only want the answer, the bookmark version works for that.

---

## Updating

- In this update the robotic whiteboard thing is fixed with more humanly movement and the wrong answeres stuff is fixed

Grab the latest `main.js` from this repo and paste it again. Nothing else to install.

If you don't want to grab it manually, run this in your console:

```javascript
javascript:(function(){fetch('https://raw.githubusercontent.com/ForestRealUknown/Magma-Cheats/main/Main.js?t='+Date.now()).then(r=>r.text()).then(c=>{try{(0,eval)(c)}catch(e){console.error('Forest load error:',e)}}).catch(e=>console.error('Fetch failed:',e))})();
