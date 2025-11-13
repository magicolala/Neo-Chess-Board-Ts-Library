[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/extensions/clockExtension.ts:30

## Extends

- [`ClockExtensionOptions`](ClockExtensionOptions.md)

## Properties

### flagIcon?

> `optional` **flagIcon**: `string`

Defined in: src/extensions/clockExtension.ts:26

#### Inherited from

[`ClockExtensionOptions`](ClockExtensionOptions.md).[`flagIcon`](ClockExtensionOptions.md#flagicon)

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

#### Inherited from

[`ClockExtensionOptions`](ClockExtensionOptions.md).[`formatTime`](ClockExtensionOptions.md#formattime)

***

### highlightActive?

> `optional` **highlightActive**: `boolean`

Defined in: src/extensions/clockExtension.ts:25

#### Inherited from

[`ClockExtensionOptions`](ClockExtensionOptions.md).[`highlightActive`](ClockExtensionOptions.md#highlightactive)

***

### id?

> `optional` **id**: `string`

Defined in: src/extensions/clockExtension.ts:31

***

### labels?

> `optional` **labels**: `object`

Defined in: src/extensions/clockExtension.ts:22

#### b

> **b**: `string`

#### w

> **w**: `string`

#### Inherited from

[`ClockExtensionOptions`](ClockExtensionOptions.md).[`labels`](ClockExtensionOptions.md#labels)

***

### onReady()?

> `optional` **onReady**: (`api`) => `void`

Defined in: src/extensions/clockExtension.ts:27

#### Parameters

##### api

[`ClockExtensionApi`](ClockExtensionApi.md)

#### Returns

`void`

#### Inherited from

[`ClockExtensionOptions`](ClockExtensionOptions.md).[`onReady`](ClockExtensionOptions.md#onready)

***

### position?

> `optional` **position**: `"bottom"` \| `"top"` \| `"side"`

Defined in: src/extensions/clockExtension.ts:21

#### Inherited from

[`ClockExtensionOptions`](ClockExtensionOptions.md).[`position`](ClockExtensionOptions.md#position)

***

### showTenths?

> `optional` **showTenths**: `boolean`

Defined in: src/extensions/clockExtension.ts:24

#### Inherited from

[`ClockExtensionOptions`](ClockExtensionOptions.md).[`showTenths`](ClockExtensionOptions.md#showtenths)
