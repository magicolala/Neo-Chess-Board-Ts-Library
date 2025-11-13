[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/extensions/AccessibilityExtension.ts:4

## Extended by

- [`AccessibilityExtensionConfig`](AccessibilityExtensionConfig.md)

## Properties

### boardLabel?

> `optional` **boardLabel**: `string`

Defined in: src/core/extensions/AccessibilityExtension.ts:20

ARIA label for the board grid.

***

### container?

> `optional` **container**: `HTMLElement`

Defined in: src/core/extensions/AccessibilityExtension.ts:8

Optional external container to mount the accessibility UI into.

***

### enableKeyboard?

> `optional` **enableKeyboard**: `boolean`

Defined in: src/core/extensions/AccessibilityExtension.ts:12

Enables keyboard navigation and move selection from the generated board.

***

### livePoliteness?

> `optional` **livePoliteness**: `"polite"` \| `"assertive"`

Defined in: src/core/extensions/AccessibilityExtension.ts:28

Politeness setting for announcements.

***

### moveInputLabel?

> `optional` **moveInputLabel**: `string`

Defined in: src/core/extensions/AccessibilityExtension.ts:24

Label describing the move submission input.

***

### regionLabel?

> `optional` **regionLabel**: `string`

Defined in: src/core/extensions/AccessibilityExtension.ts:16

ARIA label for the wrapping region.
