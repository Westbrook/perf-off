# Are you a custom element?

The use of `el.tagName.indexOf('-')` is very common in framework code, however it is not _technically_ an accurate check. While a custom element _is required_ by the browser to include a "-" in its registered element name, an element with a "-" in its name is _not required_ to be a custom element. More recently, the `customElements.get()` (https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/get) and `customElements.getName()` (https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/getName) API has become available in all browsers. These APIs are a technically correct query as to the custom element-ness of an element due to the fact that when you pass the element's constructor as the query argument all non-custom elements, whether they have "-" in their tag name or not, will return `undefined` for `customElements.get()` and `null` for `customElements.getName()`.

## But, is it fast enough?

Use `tachometer` (https://www.npmjs.com/package/tachometer) to test whether it is faster to determine if an element is a custom element via `el.tagName.includes('-')` (with a little filler as found in the [React codebase](https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/shared/isCustomElement.js)) vs `customElements.getName(el.constructor) === null` vs `customElements.get(el.tagName) !== undefined`. The following commands are available in this project:

```bash
npm run tachometer # test the two approaches against Chrome
npm run tachometer:firefox # test the two approaches against Firefox
npm run tachometer:safari # test the two appraoches against Safari
```

This will create a document of 30000 element; 10000 `div` elements, 10000 `not-custom` elements, and 10000 `custom-element` elements. It will then query the all `document.querySelectorAll('*')` and then `for()` looping through the resulting array to query which of the elements are _actually_ custom elements. Tachometer handles running the tests round robin to reduce false negative/positive results and statistically analyzing the results for a winner.

My initial tests are showing positive signs that difference is very close to a wash, with as many as 5ms separating the testing of these 30000 elements. If that hold true, and if it is also true (as many framework authors say) that it is slower to address custom elements via APIs that better suit than to address non-custom elements, then it feels very likely that any negative difference for changing from `el.tagName.indexOf('-')` to `customElements.getName(el.constructor) === null` or `customElements.get(el.tagName) !== undefined` could be offset by correctly marking non-custom elements with "-"s in their tag name as such. There are currently no tests herein to confirm that, but maybe directional insight in favor of this technique (or some other technique we discover together) makes adding such a thing the right next step...

## I've been wrong before.

And, I will be wrong again. But, am I wrong here? To answer that, I'd love your help!

Clone this repo, run `npm ci`, run the various scripts above, share your results back to this repo in an issue. They usually come out something like:

```
┌─────────────┬─────────────────┐
│     Version │ <none>          │
├─────────────┼─────────────────┤
│     Browser │ chrome-headless │
│             │ 130.0.0.0       │
├─────────────┼─────────────────┤
│ Sample size │ 210             │
└─────────────┴─────────────────┘

┌───────────────────────────┬──────────┬─────────────────────┬───────────────────────┬──────────────────┬──────────────────────────────┐
│ Benchmark                 │ Bytes    │            Avg time │ vs test-get-name.html │ vs test-get.html │ vs test-string-index-of.html │
├───────────────────────────┼──────────┼─────────────────────┼───────────────────────┼──────────────────┼──────────────────────────────┤
│ test-get-name.html        │ 0.69 KiB │ 240.86ms - 242.67ms │                       │           slower │                       unsure │
│                           │          │                     │              -        │          1% - 2% │                    -0% - +1% │
│                           │          │                     │                       │  1.48ms - 3.84ms │            -0.40ms - +2.24ms │
├───────────────────────────┼──────────┼─────────────────────┼───────────────────────┼──────────────────┼──────────────────────────────┤
│ test-get.html             │ 0.69 KiB │ 238.35ms - 239.86ms │                faster │                  │                       faster │
│                           │          │                     │               1% - 2% │         -        │                      0% - 1% │
│                           │          │                     │       1.48ms - 3.84ms │                  │              0.52ms - 2.97ms │
├───────────────────────────┼──────────┼─────────────────────┼───────────────────────┼──────────────────┼──────────────────────────────┤
│ test-string-index-of.html │ 0.67 KiB │ 239.89ms - 241.81ms │                unsure │           slower │                              │
│                           │          │                     │             -1% - +0% │          0% - 1% │                     -        │
│                           │          │                     │     -2.24ms - +0.40ms │  0.52ms - 2.97ms │                              │
└───────────────────────────┴──────────┴─────────────────────┴───────────────────────┴──────────────────┴──────────────────────────────┘
```

Before (or after) that, take a look at `test-get-name.html`, `test-get.html`, and `test-string-search.html`, see if there's anything I've done wrong in there.
- Is `for() {}` not the right loop technique?
- Is `el.localName` faster that `el.tagName`?
- Is there another way to get to `el.constructor` that might be faster?
- Are their alternate tests for custom elements?

Let's make this bullet proof!

## addendum by @titoBouzout, framework developer

Thanks for listening and providing this test! Much appreciate. This section is
representative of my feedback, as a framework author.

I suppose this test has been at least partially motivated by my intention to
propose a `isCustomElement` property in elements.

While the
[original test](https://github.com/Westbrook/perf-off/tree/35976028e19852f27e564e9af76baea1c85d272b)
does provide the concept of `isCustomElement` in various forms, it is not
representative of what different frameworks are doing in the _"real world"_.

For this reason, and via this PR I am updating it to include:

- What the results would look like if there were a `isCustomElement` property.
  Which is my total point of being here.
- Removing `console.log` calls from the _hot loop_, and instead accumulating the
  result in an array. The reason for this is that `console` calls makes thing
  slower when you are for example running benchmarks with the console open in
  the browser. A user may opens the HTML in a browser and they will get
  misleading results because of this call and reach the wrong conclusions. You
  do not want to call `console` methods when benchmarking.
- changed `indexOf('-')` to `includes('-')`, lets be idiomatic whenever
  possible.
- I have added a note on the flaws of using `-` as a check that wasn't
  considered on the comments of it.

About the data, while I understand that 10k sounds like a _good number_, lets
try to be representative of the real world. So for this reason I always choose
https://www.theguardian.com/

The following code, tells me how many tags this website has created, and how
many attributes are in total.

```js
const tagCount = document.all.length;

let attributeCount = 0;
for (const tag of [...document.all]) {
	attributeCount += tag.attributes.length;
}

console.log(tagCount, attributeCount);
```

As of this writing, there are 5197 tags and 10176 attributes.

For this reason I have updated the value to be 16k. One, for in case you want to
know if something is a custom element, for _whatever reason_, and then one for
each attribute.

The reason why I am counting attributes, is that, if the element doesnt have a
`node.isCustomElement` then that means that you should check if something _is a
custom element_ before hand, pay the cost of this(because it may not be
relevant), and then carry that value on on every function that you call, like
for example `assignProp(node, attributeName, attributeValue, isCustomElement)`,
because if we do not carry on the `isCustomElement` argument, then your
signature becomes `assingProp(node, attributeName, attributeValue)`, which means
you will be checking inside `assignProp` if something is a custom element or
not, but if you carry on the value you already paid the cost of checking for
this. Some, of the very popular frameworks, do this check `isCustomElement` for
every prop. Hope that was clear, let me know if wasn't.

So about the results I am getting with this. I opened each html file in a new
browser profile. A new browser profile is relevant because extensions change the
results. So make sure you are using a new browser profile. Then, I press `F5` as
long as I need to get consistent results.

The results are on the following table:

| test                          | result | code                                       | comment                                   |
| ----------------------------- | ------ | ------------------------------------------ | ----------------------------------------- |
| test-get-name.html            | 13ms~  | `customElements.getName(node.constructor)` | framedrops, accurate?                     |
| test-get.html                 | 12ms~  | `customElements.get(node.tagName)`         | framedrops, accurate?                     |
| test-string-index-of.html     | 3ms~   | `node not builtin && node.includes("-")`   | (inaccurate)                              |
| test-frameworks.html          | 2.5ms~ | `node.tagName.includes('-')`               | what frameworks do right now (inaccurate) |
| test-proposal-frameworks.html | 1ms~   | `node.isCustomElement`                     | accurate                                  |

As you can see, `test-proposal-frameworks.html` (what I am proposing as in
`node.isCustomElement`), outperforms the next accurate result x12~, and does not
framedrop.

We must consider, that a full frame-drop, is spent exclusively on checking if
something _is a custom element or not_. Obviously, that's not the only thing
happening on the website. And remember, to add to this that we have already
opted-in into having to do`importNode` vs `cloneNode`, that already made this
frame longer than it should be.

Note: None of this includes `is` checks, that as you can imagine... makes the
whole thing even slower.
