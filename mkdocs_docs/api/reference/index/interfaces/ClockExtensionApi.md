[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/extensions/clockExtension.ts:11

## Properties

### addClockTime()

> **addClockTime**: (`color`, `milliseconds`) => `void`

Defined in: src/extensions/clockExtension.ts:16

#### Parameters

##### color

[`Color`](../type-aliases/Color.md)

##### milliseconds

`number`

#### Returns

`void`

***

### getState()

> **getState**: () => [`ClockState`](ClockState.md) \| `null`

Defined in: src/extensions/clockExtension.ts:17

#### Returns

[`ClockState`](ClockState.md) \| `null`

***

### pauseClock()

> **pauseClock**: () => `void`

Defined in: src/extensions/clockExtension.ts:13

#### Returns

`void`

***

### resetClock()

> **resetClock**: (`config?`) => `void`

Defined in: src/extensions/clockExtension.ts:14

#### Parameters

##### config?

`Partial`\<[`ClockConfig`](ClockConfig.md)\> | `null`

#### Returns

`void`

***

### setClockTime()

> **setClockTime**: (`color`, `milliseconds`) => `void`

Defined in: src/extensions/clockExtension.ts:15

#### Parameters

##### color

[`Color`](../type-aliases/Color.md)

##### milliseconds

`number`

#### Returns

`void`

***

### startClock()

> **startClock**: () => `void`

Defined in: src/extensions/clockExtension.ts:12

#### Returns

`void`
