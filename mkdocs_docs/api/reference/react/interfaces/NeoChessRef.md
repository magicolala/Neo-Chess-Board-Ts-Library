[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/react/NeoChessBoard.tsx:163

## Properties

### addArrow()

> **addArrow**: (`arrow`) => `void`

Defined in: src/react/NeoChessBoard.tsx:168

#### Parameters

##### arrow

###### color?

`string`

###### from

`` `${string}${number}` ``

###### to

`` `${string}${number}` ``

#### Returns

`void`

***

### addClockTime()

> **addClockTime**: (`color`, `milliseconds`) => `void`

Defined in: src/react/NeoChessBoard.tsx:176

#### Parameters

##### color

[`Color`](../../index/type-aliases/Color.md)

##### milliseconds

`number`

#### Returns

`void`

***

### addHighlight()

> **addHighlight**: (`square`, `type`) => `void`

Defined in: src/react/NeoChessBoard.tsx:169

#### Parameters

##### square

`` `${string}${number}` ``

##### type

`string`

#### Returns

`void`

***

### clearArrows()

> **clearArrows**: () => `void`

Defined in: src/react/NeoChessBoard.tsx:170

#### Returns

`void`

***

### clearHighlights()

> **clearHighlights**: () => `void`

Defined in: src/react/NeoChessBoard.tsx:171

#### Returns

`void`

***

### getBoard()

> **getBoard**: () => [`NeoChessBoard`](../../index/classes/NeoChessBoard.md) \| `null`

Defined in: src/react/NeoChessBoard.tsx:165

#### Returns

[`NeoChessBoard`](../../index/classes/NeoChessBoard.md) \| `null`

***

### getClockState()

> **getClockState**: () => [`ClockState`](../../index/interfaces/ClockState.md) \| `null`

Defined in: src/react/NeoChessBoard.tsx:172

#### Returns

[`ClockState`](../../index/interfaces/ClockState.md) \| `null`

***

### pauseClock()

> **pauseClock**: () => `void`

Defined in: src/react/NeoChessBoard.tsx:174

#### Returns

`void`

***

### resetClock()

> **resetClock**: (`config?`) => `void`

Defined in: src/react/NeoChessBoard.tsx:177

#### Parameters

##### config?

`Partial`\<[`ClockConfig`](../../index/interfaces/ClockConfig.md)\> | `null`

#### Returns

`void`

***

### setClockTime()

> **setClockTime**: (`color`, `milliseconds`) => `void`

Defined in: src/react/NeoChessBoard.tsx:175

#### Parameters

##### color

[`Color`](../../index/type-aliases/Color.md)

##### milliseconds

`number`

#### Returns

`void`

***

### startClock()

> **startClock**: () => `void`

Defined in: src/react/NeoChessBoard.tsx:173

#### Returns

`void`
