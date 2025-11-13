[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/extensions/clockExtension.ts:20

## Extended by

- [`ClockExtensionConfig`](ClockExtensionConfig.md)

## Properties

### flagIcon?

> `optional` **flagIcon**: `string`

Defined in: src/extensions/clockExtension.ts:26

***

### formatTime()?

> `optional` **formatTime**: (`milliseconds`, `context`) => `string`

Defined in: src/extensions/clockExtension.ts:23

#### Parameters

##### milliseconds

`number`

##### context

###### color

[`Color`](../type-aliases/Color.md)

###### state

[`ClockState`](ClockState.md)

#### Returns

`string`

***

### highlightActive?

> `optional` **highlightActive**: `boolean`

Defined in: src/extensions/clockExtension.ts:25

***

### labels?

> `optional` **labels**: `object`

Defined in: src/extensions/clockExtension.ts:22

#### b

> **b**: `string`

#### w

> **w**: `string`

***

### onReady()?

> `optional` **onReady**: (`api`) => `void`

Defined in: src/extensions/clockExtension.ts:27

#### Parameters

##### api

[`ClockExtensionApi`](ClockExtensionApi.md)

#### Returns

`void`

***

### position?

> `optional` **position**: `"bottom"` \| `"top"` \| `"side"`

Defined in: src/extensions/clockExtension.ts:21

***

### showTenths?

> `optional` **showTenths**: `boolean`

Defined in: src/extensions/clockExtension.ts:24
