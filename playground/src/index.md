---
title: Hello Makrdown
likes: 100
---

- [ ] todo
- [x] done

```ts
import Vue from 'vue'
const myGreeter = new Greeter("hello, world");
myGreeter.greeting = "howdy";
myGreeter.showGreeting();

class SpecialGreeter extends Greeter {
    constructor() {
        super("Very special greetings");
    }
}

export type UseFetchOptions = { key?: string }
```

```html
<div hidden></div>
<div style="color: black;"></div>
<div onclick="alert('Hi')"></div>

<img src="atom.svg" alt="Logo">
<input type="number" min="0" max="100" step="5">
```

```css
html {
  font-family: 'Lucida Grande', Verdana, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
  background-color: hsl(30,100%,96%);
}
```

```diff
- <div>hi</div>
+ <div>hello</div>
```