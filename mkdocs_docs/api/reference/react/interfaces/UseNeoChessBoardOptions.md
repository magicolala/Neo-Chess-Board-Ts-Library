[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/react/useNeoChessBoard.ts:9

## Properties

### fen?

> `optional` **fen**: `string`

Defined in: src/react/useNeoChessBoard.ts:10

***

### onClockChange()?

> `optional` **onClockChange**: (`state`) => `void`

Defined in: src/react/useNeoChessBoard.ts:25

#### Parameters

##### state

[`ClockState`](../../index/interfaces/ClockState.md)

#### Returns

`void`

***

### onClockFlag()?

> `optional` **onClockFlag**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:28

#### Parameters

##### event

###### color

[`Color`](../../index/type-aliases/Color.md)

###### remaining

`number`

#### Returns

`void`

***

### onClockPause()?

> `optional` **onClockPause**: () => `void`

Defined in: src/react/useNeoChessBoard.ts:27

#### Returns

`void`

***

### onClockStart()?

> `optional` **onClockStart**: () => `void`

Defined in: src/react/useNeoChessBoard.ts:26

#### Returns

`void`

***

### onIllegal()?

> `optional` **onIllegal**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:14

#### Parameters

##### event

###### from

`` `${string}${number}` ``

###### reason

`string`

###### to

`` `${string}${number}` ``

#### Returns

`void`

***

### onMove()?

> `optional` **onMove**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:13

#### Parameters

##### event

###### fen

`string`

###### from

`` `${string}${number}` ``

###### to

`` `${string}${number}` ``

#### Returns

`void`

***

### onPieceClick()?

> `optional` **onPieceClick**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:22

#### Parameters

##### event

[`PiecePointerEventPayload`](../../index/interfaces/PiecePointerEventPayload.md)

#### Returns

`void`

***

### onPieceDrag()?

> `optional` **onPieceDrag**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:23

#### Parameters

##### event

[`PieceDragEventPayload`](../../index/interfaces/PieceDragEventPayload.md)

#### Returns

`void`

***

### onPieceDrop()?

> `optional` **onPieceDrop**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:24

#### Parameters

##### event

[`PieceDropEventPayload`](../../index/interfaces/PieceDropEventPayload.md)

#### Returns

`void`

***

### onSquareClick()?

> `optional` **onSquareClick**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:16

#### Parameters

##### event

[`SquarePointerEventPayload`](../../index/interfaces/SquarePointerEventPayload.md)

#### Returns

`void`

***

### onSquareMouseDown()?

> `optional` **onSquareMouseDown**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:17

#### Parameters

##### event

[`SquarePointerEventPayload`](../../index/interfaces/SquarePointerEventPayload.md)

#### Returns

`void`

***

### onSquareMouseOut()?

> `optional` **onSquareMouseOut**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:21

#### Parameters

##### event

[`SquareTransitionEventPayload`](../../index/interfaces/SquareTransitionEventPayload.md)

#### Returns

`void`

***

### onSquareMouseOver()?

> `optional` **onSquareMouseOver**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:20

#### Parameters

##### event

[`SquareTransitionEventPayload`](../../index/interfaces/SquareTransitionEventPayload.md)

#### Returns

`void`

***

### onSquareMouseUp()?

> `optional` **onSquareMouseUp**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:18

#### Parameters

##### event

[`SquarePointerEventPayload`](../../index/interfaces/SquarePointerEventPayload.md)

#### Returns

`void`

***

### onSquareRightClick()?

> `optional` **onSquareRightClick**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:19

#### Parameters

##### event

[`SquarePointerEventPayload`](../../index/interfaces/SquarePointerEventPayload.md)

#### Returns

`void`

***

### onUpdate()?

> `optional` **onUpdate**: (`event`) => `void`

Defined in: src/react/useNeoChessBoard.ts:15

#### Parameters

##### event

###### fen

`string`

#### Returns

`void`

***

### options?

> `optional` **options**: [`UpdatableBoardOptions`](../type-aliases/UpdatableBoardOptions.md)

Defined in: src/react/useNeoChessBoard.ts:12

***

### position?

> `optional` **position**: `string`

Defined in: src/react/useNeoChessBoard.ts:11
