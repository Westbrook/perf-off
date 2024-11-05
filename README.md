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
