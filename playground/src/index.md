---
title: Hello Makrdown
likes: 100
---

# h1 

```ts
export interface Person {
  name: string
}

const shiki = require('shiki')

shiki.getHighlighter({
  theme: 'nord'
}).then(highlighter => {
  console.log(highlighter.codeToHtml(`console.log('shiki');`, { lang: 'js' }))
})
```

# h2

Paragraph goes here.