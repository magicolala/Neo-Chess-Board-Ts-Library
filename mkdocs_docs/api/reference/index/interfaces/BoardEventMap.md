[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/types.ts:203

## Indexable

\[`event`: `string`\]: `unknown`

## Properties

### clock:change

> **clock:change**: [`ClockState`](ClockState.md)

Defined in: src/core/types.ts:210

***

### clock:flag

> **clock:flag**: `object`

Defined in: src/core/types.ts:213

#### color

> **color**: [`Color`](../type-aliases/Color.md)

#### remaining

> **remaining**: `number`

***

### clock:pause

> **clock:pause**: `void`

Defined in: src/core/types.ts:212

***

### clock:start

> **clock:start**: `void`

Defined in: src/core/types.ts:211

***

### illegal

> **illegal**: `object`

Defined in: src/core/types.ts:205

#### from

> **from**: `` `${string}${number}` ``

#### reason

> **reason**: `string`

#### to

> **to**: `` `${string}${number}` ``

***

### move

> **move**: `object`

Defined in: src/core/types.ts:204

#### fen

> **fen**: `string`

#### from

> **from**: `` `${string}${number}` ``

#### to

> **to**: `` `${string}${number}` ``

***

### pieceClick

> **pieceClick**: [`PiecePointerEventPayload`](PiecePointerEventPayload.md)

Defined in: src/core/types.ts:220

***

### pieceDrag

> **pieceDrag**: [`PieceDragEventPayload`](PieceDragEventPayload.md)

Defined in: src/core/types.ts:221

***

### pieceDrop

> **pieceDrop**: [`PieceDropEventPayload`](PieceDropEventPayload.md)

Defined in: src/core/types.ts:222

***

### premoveApplied

> **premoveApplied**: [`PremoveAppliedEvent`](PremoveAppliedEvent.md)

Defined in: src/core/types.ts:208

***

### premoveInvalidated

> **premoveInvalidated**: [`PremoveInvalidatedEvent`](PremoveInvalidatedEvent.md)

Defined in: src/core/types.ts:209

***

### promotion

> **promotion**: [`PromotionRequest`](PromotionRequest.md)

Defined in: src/core/types.ts:207

***

### squareClick

> **squareClick**: [`SquarePointerEventPayload`](SquarePointerEventPayload.md)

Defined in: src/core/types.ts:214

***

### squareMouseDown

> **squareMouseDown**: [`SquarePointerEventPayload`](SquarePointerEventPayload.md)

Defined in: src/core/types.ts:215

***

### squareMouseOut

> **squareMouseOut**: [`SquareTransitionEventPayload`](SquareTransitionEventPayload.md)

Defined in: src/core/types.ts:219

***

### squareMouseOver

> **squareMouseOver**: [`SquareTransitionEventPayload`](SquareTransitionEventPayload.md)

Defined in: src/core/types.ts:218

***

### squareMouseUp

> **squareMouseUp**: [`SquarePointerEventPayload`](SquarePointerEventPayload.md)

Defined in: src/core/types.ts:216

***

### squareRightClick

> **squareRightClick**: [`SquarePointerEventPayload`](SquarePointerEventPayload.md)

Defined in: src/core/types.ts:217

***

### update

> **update**: `object`

Defined in: src/core/types.ts:206

#### fen

> **fen**: `string`
