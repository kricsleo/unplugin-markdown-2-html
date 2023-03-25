---
title: Hello Markdown
date: 2023-03-25 12:00
score: 1.8
tags:
  - frontend
  - markdown
---

[TOC]

#  优化 Chrome 的累计布局偏移（CLS）问题

## 问题初现

最近碰到一个很奇怪的现象，我的博客页面是提前完全编译好的静态页面内容，同时页面渲染必须的 CSS 也是放在`<head>`头里面的，所以除了图片这种异步加载的内容以外，不应该出现其他的布局偏移现象，但是却发现页面初次渲染后发生了很大的布局偏移，页面布局代码示例如下：

```html
<html>
  <head>
    <style>
      body {
        display: flex;
        justify-content: center;
        align-items: stretch;
        min-height: 100vh;
      }
      main {
        flex: 1 1 800px;
      }
      aside {
        flex: 0 0 360px;
        margin-left: 20px;
      }
    </style>
  </head>
  <body>
    <main></main>
    <aside></aside>
  </body>
</html>
```

页面内容采用 flex 布局，分为左侧根据屏幕宽度自由伸缩的`<main>`节点和右侧固定 360px 宽度的`<aside>`节点，布局应该是稳定的，但是使用 chrome 打开的时候却发生了如下诡异的布局跳跃现象（如果第一次没出现，多刷新几次就可以看到，这个过程很短暂，下面是慢放到 0.05x 的效果），你可以使用 chrome 访问[这个页面](https://kricsleo.com/chrome-cls.html)来测试这个过程：

<video controls>
  <source src="https://kricsleo.com/img/chrome-cls.mp4" type="video/mp4" />
</video>

当刷新页面的时候初始左侧的`<main>`元素（红色内容）直接占满整个视口，右边的`<aside>`不显示，然后自动又渲染了一次之后`<main>`宽度正常，`<aside>`元素显示了出来。

这让我陷入了疑惑，因为按照常见的理解页面渲染包括如下步骤：

1. 根据 HTML 内容构建 DOM Tree

2. 根据 CSS 内容构建 CSS Tree

3. DOM Tree 和 CSS Tree 结合构建 Render Tree

4. 根据 Render Tree 渲染页面

渲染所必须的 HTML 和 CSS 都是静态的方式包含在 html 中，浏览器下载完文档之后是可以在初次渲染时就完整知道整个页面的结构和样式的，那么布局为什么还会跳动产生 CLS 呢？



## 无巧不成书

正好最近看到一个写的还不错的个人博客站点：[Sukka's Blog](https://blog.skk.moe/)，里面有篇[优化博客的累计布局偏移（CLS）问题](https://blog.skk.moe/post/fix-blog-cls/)正好记录的问题与我类似。

他的现象如下（视频如果无法播放，可直接访问[视频地址](https://pic.skk.moe/blog/fix-blog-cls-fid/blog-cls-screen-recorder.webm)或者上面的博客查看）：

<video controls>
  <source src="https://pic.skk.moe/blog/fix-blog-cls-fid/blog-cls-screen-recorder.webm">
</video>

>通过视频可以发现，页面布局偏移的原因是浏览器在第一次绘制时，主要内容被绘制到了第一列，第二次绘制时左侧边栏才将主要内容「挤到了」第二列，因此导致了 CLS 问题。
>
>这个原因听起来就非常诡异。我已经将 Critical CSS（浏览器首次绘制所需的关键 CSS）全部内联在 HTML 的 `<head>` 中，因此浏览器解析生成 CSSOM 不会比 DOM 晚、浏览器已经知道 CSS 中声明的 order。因此唯一的可能，是浏览器在首次绘制时并没有完整解析 DOM、只知道 `<Main />` 的存在、但不知道 `<Left />` 或者 `<Right />` 的存在，才因此将 `<Main />` 渲染进第一列而不是第二列；直到第二次绘制时，浏览器才将 `<Main />` 渲染进第二列、将 `<Left />` 渲染进第一列。

**并且测试后发现这种情况只发生在 chrome 浏览器上**，当使用 firefox 浏览器时页面并不会发生 CLS，那么这看起来是 chrome 的一个 quirk 了。

博客指出在 stackoverflow 上[Cumulative Layout Shift with Bootstrap 4 grid](https://stackoverflow.com/questions/63869348/cumulative-layout-shift-with-bootstrap-4-grid)有过相关讨论，产生这种现象有两个关键线索：

> - Chrome 解析器在读取了 65535 字节的 HTML 后暂停
> - Chrome 在遇到 `<script>` 标签后，会继续读取约 50 个「Token」之后暂停

因为这里没有涉及到`<srcipt>`标签，所以只看第一个因素，是否是因为我的`<main>`元素中内容太多，导致 chrome 在还没有解析到后面的`<aside>`元素就达到了限制，于是开始了第一次渲染，这个时候因为`<main>`是`flex: 1 1 800px;`会自动占据所有可用宽度，而浏览器不知道后面还有元素要占据宽度，所以把所有宽度都分配给了`<main>`，于是就出现了视频里面的`<main>`初始宽度是 100%，`<aside>`元素不显示；而随着浏览器继续解析 HTML 内容，发现了后面`<aside>`元素的存在，于是重新渲染了一次，让`<main>`宽度回归正常，`<aside>`也显示了出来

那么我们写一个`<main>`内容很少的页面，让 chrome 能够在第一次就能够顺利解析到后面的`<aside>`，这样理论上初始渲染布局就会正常。（你可以访问内容较少的这个[演示页面](https://kricsleo.com/chrome-cls-comparision.html)来测试）

<video controls>
  <source src="https://kricsleo.com/img/chrome-cls-comparision.mp4" type="video/mp4" />
</video>

果然减少了`<main>`的内容后，chrome 无论怎么刷新都不会出现 CLS 了，这证明 chrome 读取一定字符之后就会先暂停下来开始渲染页面，然后再继续读取，继续渲染，这个过程可能会造成 CLS。



## 如何解决 chrome 的这个 quirk ？

[优化博客的累计布局偏移（CLS）问题](https://blog.skk.moe/post/fix-blog-cls/)的作者向 chrome 提出了相关的 [Issue 1302906: Layout Shift with flexbox based grid](https://bugs.chromium.org/p/chromium/issues/detail?id=1302906)，但是被 Chromium 团队标记为「Working as Intended」和「Won't Fix」，所以我们只能自己想办法来规避。

1. 修改 DOM 布局

   修改 html 中元素的物理顺序，让 chrome 可以顺序读取字节的时候提前知道后面的元素，然后在 CSS 里通过 `order`或者其它属性来调整元素的实际渲染位置，从而让视觉上看起来跟之前一致。

2. 提前放置占位元素

   在前面内容中放置占位元素，来让 chrome 能够第一次读取内容时就能布局正确，占位元素只是为了布局使用，无任何语义作用。（原作者就是采取的这个方式）

   >
   >但是由于我的响应式布局需要同时考虑移动端和桌面端的体验，因此我不得不将 `<Main />` 的 markup 放置在最前面。不过，我还是实现了一个 workaround，在 `<Main />` 前面插入一个 100% 宽度 0 高度的空 div 元素

3. 修改布局方式

   对我来说可以采取这种方式，原本采用的是 flex 布局，在没有`<aside>`元素情况下`<main>`元素会通过`flex-grow: 1;`直接撑满整个宽度，可以修改为 grid 布局如下：

   ```css
   body {
     display: grid;
     grid-template-columns: auto 360px;
     align-items: stretch;
     min-height: 100vh;
     overflow: auto;
   }
   main {}
   aside {
     margin-left: 20px;
   }
   ```

   由于 grid 会在元素渲染前就生成好布局结构，即使没有`<aside>`元素，右边也始终会预留下 360px 的空余，所以`<main>`元素的宽度将不会出现跳跃，你可以使用 chrome 来访问修改为 grid 后的[示例页面](https://kricsleo.com/chrome-cls-fix.html)，多次刷新里面的宽度也不会再像之前一样跳跃。

