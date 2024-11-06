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
│ Sample size │ 100             │
└─────────────┴─────────────────┘

┌───────────────────────────┬──────────┬─────────────────┬───────────────────────┬──────────────────┬──────────────────────────────┬──────────────────────────────┐
│ Benchmark                 │ Bytes    │        Avg time │ vs test-get-name.html │ vs test-get.html │ vs test-string-includes.html │ vs test-string-index-of.html │
├───────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-get-name.html        │ 0.76 KiB │ 3.32ms - 3.37ms │                       │           slower │                       slower │                       slower │
│                           │          │                 │              -        │          4% - 6% │                  137% - 143% │                  150% - 157% │
│                           │          │                 │                       │  0.14ms - 0.21ms │              1.93ms - 1.98ms │              2.00ms - 2.06ms │
├───────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-get.html             │ 0.75 KiB │ 3.15ms - 3.20ms │                faster │                  │                       slower │                       slower │
│                           │          │                 │               4% - 6% │         -        │                  125% - 131% │                  137% - 144% │
│                           │          │                 │       0.14ms - 0.21ms │                  │              1.75ms - 1.81ms │              1.83ms - 1.88ms │
├───────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-string-includes.html │ 1.42 KiB │ 1.38ms - 1.41ms │                faster │           faster │                              │                       slower │
│                           │          │                 │             58% - 59% │        56% - 57% │                     -        │                      4% - 7% │
│                           │          │                 │       1.93ms - 1.98ms │  1.75ms - 1.81ms │                              │              0.05ms - 0.10ms │
├───────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-string-index-of.html │ 1.42 KiB │ 1.30ms - 1.34ms │                faster │           faster │                       faster │                              │
│                           │          │                 │             60% - 61% │        58% - 59% │                      4% - 7% │                     -        │
│                           │          │                 │       2.00ms - 2.06ms │  1.83ms - 1.88ms │              0.05ms - 0.10ms │                              │
└───────────────────────────┴──────────┴─────────────────┴───────────────────────┴──────────────────┴──────────────────────────────┴──────────────────────────────┘
```

Before (or after) that, take a look at `test-get-name.html`, `test-get.html`, and `test-string-search.html`, see if there's anything I've done wrong in there.
- Is `for() {}` not the right loop technique?
- Is `el.localName` faster that `el.tagName`?
- Is there another way to get to `el.constructor` that might be faster?
- Are their alternate tests for custom elements?

Let's make this bullet proof!
