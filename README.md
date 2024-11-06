# Are you a custom element?

The use of `el.tagName.indexOf('-')` is very common in framework code, however it is not _technically_ an accurate check. While a custom element _is required_ by the browser to include a "-" in its registered element name, an element with a "-" in its name is _not required_ to be a custom element. Similarly, `el.tagName.includes('-')` exhibits the same short comings, even if the boolean nature of the method's return value is more inviting from a code flow standpoint. `customElements.get()` (https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/get) is a long standing API, but needs some extra thought to be able to support customized built-ins. Leveraging `el.getAttribute('is') || el.tagName` _might_ be enough to close the coverage gap, but edge cases remain in that approach. The most technically correct approach to testing if an element is a cusotm element is `customElement.getName()` (https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/getName), which is the newest of the available APIs for this form of introspection. It is particularly useful of correctly introspecting customized built-in, in browser that support this API. A similarly "technically correct" API has been proposed via the addition of `isCustomElement` as a property on `HTMLElement`. While it is difficult to fully model the performance of such a feature, a synthetic application of this technique has been included for "completeness". The innate cost of hanging `isCustomElement` off of each element is contained to the realities of this test only in order to keep the results of other techniques closer to the in the wild realities that they exist it.

APIs currently under test:
- `customElements.getName(el.constructor) !== null`
- `customElements.get(el.getAttribute('is') || el.localName)`
- `el.isCustomElement`
- `el.tagName.includes('-') === -1` with some additional nuance from the React implementation
- `tagName.indexOf('-') === -1` with some additional nuance from the React implementation

## But, is it fast enough?

Use `tachometer` (https://www.npmjs.com/package/tachometer) to test whether it is faster to determine if an element is a custom element via `el.tagName.includes('-')` (with a little filler as found in the [React codebase](https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/shared/isCustomElement.js)) vs `customElements.getName(el.constructor) === null` vs `customElements.get(el.tagName) !== undefined`. The following commands are available in this project:

```bash
npm run tachometer # test the two approaches against Chrome
npm run tachometer:firefox # test the two approaches against Firefox
npm run tachometer:safari # test the two appraoches against Safari
```

While the `browser`, `measure`, and `timeout` flags for `tachometer` are baked into those commands, in hopes of finding more statistically relevant results, you can add `-- --sample-size=N` to any of these commands, or any other `tachometer` [CLI option](https://www.npmjs.com/package/tachometer#user-content-cli-usage:~:text=firefox%22%0A%20%20%20%20%7D%0A%20%20%5D%0A%7D-,CLI%20usage,-Run%20a%20benchmark).

The above scripts will create a document of 30000 element; 10000 `div` elements, 10000 `not-custom` elements, and 10000 `custom-element` elements. It will then query the all `document.querySelectorAll('*')` and then `for()` looping through the resulting array to query which of the elements are _actually_ custom elements. Tachometer handles running the tests round robin to reduce false negative/positive results and statistically analyzing the results for a winner.

My initial tests are showing positive signs that difference is very close to a wash, with as many as 3ms separating the testing of these 30000 elements. If that holds true, and if it is also true (as many framework authors say) that it is slower to address custom elements via APIs that better suit than to address non-custom elements, then it feels very likely that any negative difference for changing to a more custom element normative API could be offset by correctly marking non-custom elements with "-"s in their tag name as such. There are currently no tests herein to confirm that, but maybe directional insight in favor of this technique (or some other technique we discover together) makes adding such a thing the right next step...

## I've been wrong before.

And, I will be wrong again. But, am I wrong here? To answer that, I'd love your help!

Clone this repo, run `npm ci`, run the various scripts above, share your results back to this repo in an issue.

## Results

Currently, I'm seeing `test-is-custom-element.html` wins across the board (2024/11/6). This is unsurprising as the synthetic implementation of `el.isCustomElement` means that the request is against a statically assigned property of the element. Even accessing `el.tagName` instead of the synthetic `el.isCustomElement` value take 0.86ms - 0.90ms vs 0.26ms - 0.58ms in Chome and and 0.34ms - 0.62ms vs 0.20ms - 0.48ms is Safari (which leads to this test being statistically equivelent to `el.tagName.indexOf('-') === -1`, which is interesting), as a reference for the additional work that would/could come with a native implmentation. The current test approach also does not take into account the costs of adding that value or any runtime costs were browsers to ship such a feature. Managing it at all will add non-negligable time to some other part of the element's lifecycles.

Comparing to this theoreticaly future value, in the worst case (Chrome) there is a 2.67ms - 2.75m slowdown between `el.isCustomElement` and `customElements.getName(el.constructor) !== null`, while in the best case (Safari) the slowdown is only 0.32ms - 0.68ms (which points to the possibility of optimizations in Chrome; implementors love a challenge, right?).

Comparing to `el.tagName.indexOf('-') === -1`, just because of the wide use of React, we have a slow down of only 1.85ms - 1.93ms at the max (Chrome, again) and a complete wash, -0.18ms - +0.14ms, at the low end (Safari, again). Does this point to it being time that frameworks that choose to rely on this data would benefit from moving to a new API here? Even if they choose to push for additional element node properties from at the specification and implementor level?

### Full results below:

<details>
  <summary>Chrome Results</summary>

```

┌─────────────┬─────────────────┐
│     Version │ <none>          │
├─────────────┼─────────────────┤
│     Browser │ chrome-headless │
│             │ 130.0.0.0       │
├─────────────┼─────────────────┤
│ Sample size │ 50              │
└─────────────┴─────────────────┘

┌─────────────────────────────┬──────────┬─────────────────┬───────────────────────┬──────────────────┬────────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ Benchmark                   │ Bytes    │        Avg time │ vs test-get-name.html │ vs test-get.html │ vs test-is-custom-element.html │ vs test-string-includes.html │ vs test-string-index-of.html │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-get-name.html          │ 0.94 KiB │ 3.21ms - 3.27ms │                       │           faster │                         slower │                       slower │                       slower │
│                             │          │                 │              -        │        28% - 30% │                    564% - 620% │                  124% - 132% │                  138% - 146% │
│                             │          │                 │                       │  1.26ms - 1.35ms │                2.73ms - 2.81ms │              1.78ms - 1.86ms │              1.86ms - 1.94ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-get.html               │ 0.96 KiB │ 4.51ms - 4.57ms │                slower │                  │                         slower │                       slower │                       slower │
│                             │          │                 │             39% - 42% │         -        │                    831% - 910% │                  214% - 226% │                  234% - 245% │
│                             │          │                 │       1.26ms - 1.35ms │                  │                4.04ms - 4.11ms │              3.08ms - 3.16ms │              3.17ms - 3.24ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-is-custom-element.html │ 0.92 KiB │ 0.45ms - 0.49ms │                faster │           faster │                                │                       faster │                       faster │
│                             │          │                 │             85% - 86% │        89% - 90% │                       -        │                    66% - 68% │                    64% - 67% │
│                             │          │                 │       2.73ms - 2.81ms │  4.04ms - 4.11ms │                                │              0.92ms - 0.98ms │              0.84ms - 0.90ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-string-includes.html   │ 1.60 KiB │ 1.40ms - 1.44ms │                faster │           faster │                         slower │                              │                       slower │
│                             │          │                 │             55% - 57% │        68% - 69% │                    190% - 217% │                     -        │                      4% - 9% │
│                             │          │                 │       1.78ms - 1.86ms │  3.08ms - 3.16ms │                0.92ms - 0.98ms │                              │              0.05ms - 0.11ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-string-index-of.html   │ 1.60 KiB │ 1.32ms - 1.36ms │                faster │           faster │                         slower │                       faster │                              │
│                             │          │                 │             58% - 59% │        70% - 71% │                    174% - 198% │                      4% - 8% │                     -        │
│                             │          │                 │       1.86ms - 1.94ms │  3.17ms - 3.24ms │                0.84ms - 0.90ms │              0.05ms - 0.11ms │                              │
└─────────────────────────────┴──────────┴─────────────────┴───────────────────────┴──────────────────┴────────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

</details>

<details>
  <summary>Firefox Results</summary>

```
┌─────────────┬──────────────────┐
│     Version │ <none>           │
├─────────────┼──────────────────┤
│     Browser │ firefox-headless │
│             │ 132.0            │
├─────────────┼──────────────────┤
│ Sample size │ 50               │
└─────────────┴──────────────────┘

┌─────────────────────────────┬──────────┬─────────────────┬───────────────────────┬──────────────────┬────────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ Benchmark                   │ Bytes    │        Avg time │ vs test-get-name.html │ vs test-get.html │ vs test-is-custom-element.html │ vs test-string-includes.html │ vs test-string-index-of.html │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-get-name.html          │ 0.94 KiB │ 1.92ms - 2.24ms │                       │           faster │                         slower │                       slower │                       slower │
│                             │          │                 │              -        │        12% - 28% │                    199% - 592% │                    16% - 90% │                    36% - 94% │
│                             │          │                 │                       │  0.28ms - 0.76ms │                1.43ms - 1.89ms │              0.37ms - 1.07ms │              0.57ms - 1.07ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-get.html               │ 0.96 KiB │ 2.43ms - 2.77ms │                slower │                  │                         slower │                       slower │                       slower │
│                             │          │                 │             12% - 38% │         -        │                    275% - 763% │                   46% - 136% │                   71% - 141% │
│                             │          │                 │       0.28ms - 0.76ms │                  │                1.94ms - 2.42ms │              0.89ms - 1.59ms │              1.08ms - 1.60ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-is-custom-element.html │ 0.92 KiB │ 0.26ms - 0.58ms │                faster │           faster │                                │                       faster │                       faster │
│                             │          │                 │             72% - 88% │        77% - 90% │                       -        │                    55% - 83% │                    53% - 81% │
│                             │          │                 │       1.43ms - 1.89ms │  1.94ms - 2.42ms │                                │              0.59ms - 1.29ms │              0.58ms - 1.10ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-string-includes.html   │ 1.60 KiB │ 1.05ms - 1.67ms │                faster │           faster │                         slower │                              │                       unsure │
│                             │          │                 │             19% - 50% │        35% - 60% │                     78% - 370% │                     -        │                  -22% - +38% │
│                             │          │                 │       0.37ms - 1.07ms │  0.89ms - 1.59ms │                0.59ms - 1.29ms │                              │            -0.27ms - +0.47ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-string-index-of.html   │ 1.60 KiB │ 1.06ms - 1.46ms │                faster │           faster │                         slower │                       unsure │                              │
│                             │          │                 │             29% - 50% │        43% - 60% │                     74% - 326% │                  -33% - +18% │                     -        │
│                             │          │                 │       0.57ms - 1.07ms │  1.08ms - 1.60ms │                0.58ms - 1.10ms │            -0.47ms - +0.27ms │                              │
└─────────────────────────────┴──────────┴─────────────────┴───────────────────────┴──────────────────┴────────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

</details>

<details>
  <summary>Safari Results</summary>

```
┌─────────────┬────────┐
│     Version │ <none> │
├─────────────┼────────┤
│     Browser │ safari │
│             │ 18.1   │
├─────────────┼────────┤
│ Sample size │ 50     │
└─────────────┴────────┘

┌─────────────────────────────┬──────────┬─────────────────┬───────────────────────┬──────────────────┬────────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ Benchmark                   │ Bytes    │        Avg time │ vs test-get-name.html │ vs test-get.html │ vs test-is-custom-element.html │ vs test-string-includes.html │ vs test-string-index-of.html │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-get-name.html          │ 0.94 KiB │ 0.72ms - 0.96ms │                       │           faster │                         slower │                       unsure │                       unsure │
│                             │          │                 │              -        │        15% - 40% │                     42% - 252% │                  -29% - +12% │                  -18% - +23% │
│                             │          │                 │                       │  0.16ms - 0.48ms │                0.32ms - 0.68ms │            -0.28ms - +0.12ms │            -0.14ms - +0.18ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-get.html               │ 0.96 KiB │ 1.05ms - 1.27ms │                slower │                  │                         slower │                       slower │                       slower │
│                             │          │                 │             15% - 61% │         -        │                    101% - 381% │                     1% - 51% │                    19% - 64% │
│                             │          │                 │       0.16ms - 0.48ms │                  │                0.65ms - 0.99ms │              0.05ms - 0.43ms │              0.19ms - 0.49ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-is-custom-element.html │ 0.92 KiB │ 0.20ms - 0.48ms │                faster │           faster │                                │                       faster │                       faster │
│                             │          │                 │             42% - 77% │        59% - 83% │                       -        │                    47% - 79% │                    41% - 76% │
│                             │          │                 │       0.32ms - 0.68ms │  0.65ms - 0.99ms │                                │              0.37ms - 0.79ms │              0.30ms - 0.66ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-string-includes.html   │ 1.60 KiB │ 0.76ms - 1.08ms │                unsure │           faster │                         slower │                              │                       unsure │
│                             │          │                 │           -15% - +34% │         5% - 36% │                     52% - 289% │                     -        │                  -13% - +37% │
│                             │          │                 │     -0.12ms - +0.28ms │  0.05ms - 0.43ms │                0.37ms - 0.79ms │                              │            -0.09ms - +0.29ms │
├─────────────────────────────┼──────────┼─────────────────┼───────────────────────┼──────────────────┼────────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ test-string-index-of.html   │ 1.60 KiB │ 0.71ms - 0.93ms │                unsure │           faster │                         slower │                       unsure │                              │
│                             │          │                 │           -22% - +17% │        18% - 41% │                     39% - 243% │                   -31% - +9% │                     -        │
│                             │          │                 │     -0.18ms - +0.14ms │  0.19ms - 0.49ms │                0.30ms - 0.66ms │            -0.29ms - +0.09ms │                              │
└─────────────────────────────┴──────────┴─────────────────┴───────────────────────┴──────────────────┴────────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

</details>

## Questions

Before (or after) that, take a look at the various `test-*.html` files, see if there's anything objectively wrong in there.
- Is `for() {}` not the right loop technique?
- Is `el.localName` faster that `el.tagName`?
- Is there another way to get to `el.constructor` that might be faster?
- Are their alternate tests for custom elements?
- What is a more complete path to descerning the cost of a native property to track this?

If you find something, I'd love a PR or at the least an issue leading the project back to the promised land. Let's make this bullet proof!
