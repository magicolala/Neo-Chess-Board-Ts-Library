[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/types.ts:253

## Properties

### header()?

> `optional` **header**: (`h`) => `void`

Defined in: src/core/types.ts:283

#### Parameters

##### h

`Record`\<`string`, `string`\>

#### Returns

`void`

***

### supportsSanMoves?

> `optional` **supportsSanMoves**: `boolean`

Defined in: src/core/types.ts:263

Indicates whether the adapter supports SAN/LAN string move submissions.
Adapters should opt in explicitly to avoid accidental invocation with
unsupported argument shapes.

## Methods

### getFEN()

> **getFEN**(): `string`

Defined in: src/core/types.ts:255

#### Returns

`string`

***

### getPGN()?

> `optional` **getPGN**(): `string`

Defined in: src/core/types.ts:282

#### Returns

`string`

***

### getPgnNotation()?

> `optional` **getPgnNotation**(): [`PgnNotation`](../classes/PgnNotation.md)

Defined in: src/core/types.ts:287

#### Returns

[`PgnNotation`](../classes/PgnNotation.md)

***

### history()?

> `optional` **history**(): `string`[]

Defined in: src/core/types.ts:284

#### Returns

`string`[]

***

### inCheck()?

> `optional` **inCheck**(): `boolean`

Defined in: src/core/types.ts:275

#### Returns

`boolean`

***

### isCheckmate()?

> `optional` **isCheckmate**(): `boolean`

Defined in: src/core/types.ts:274

#### Returns

`boolean`

***

### isDraw()

> **isDraw**(): `boolean`

Defined in: src/core/types.ts:277

#### Returns

`boolean`

***

### isInsufficientMaterial()

> **isInsufficientMaterial**(): `boolean`

Defined in: src/core/types.ts:278

#### Returns

`boolean`

***

### isStalemate()?

> `optional` **isStalemate**(): `boolean`

Defined in: src/core/types.ts:276

#### Returns

`boolean`

***

### isThreefoldRepetition()

> **isThreefoldRepetition**(): `boolean`

Defined in: src/core/types.ts:279

#### Returns

`boolean`

***

### loadPgn()?

> `optional` **loadPgn**(`pgn`): `boolean`

Defined in: src/core/types.ts:286

#### Parameters

##### pgn

`string`

#### Returns

`boolean`

***

### move()

#### Call Signature

> **move**(`m`): [`RulesMoveResponse`](RulesMoveResponse.md) \| `null` \| `undefined`

Defined in: src/core/types.ts:267

Execute a move. When a string is provided it should be interpreted as SAN/LAN notation.

##### Parameters

###### m

###### from

`` `${string}${number}` ``

###### promotion?

`"b"` \| `"r"` \| `"q"` \| `"n"`

###### to

`` `${string}${number}` ``

##### Returns

[`RulesMoveResponse`](RulesMoveResponse.md) \| `null` \| `undefined`

#### Call Signature

> **move**(`notation`): [`RulesMoveResponse`](RulesMoveResponse.md) \| `null` \| `undefined`

Defined in: src/core/types.ts:272

##### Parameters

###### notation

`string`

##### Returns

[`RulesMoveResponse`](RulesMoveResponse.md) \| `null` \| `undefined`

***

### movesFrom()

> **movesFrom**(`square`): [`Move`](Move.md)[]

Defined in: src/core/types.ts:257

#### Parameters

##### square

`` `${string}${number}` ``

#### Returns

[`Move`](Move.md)[]

***

### reset()?

> `optional` **reset**(): `void`

Defined in: src/core/types.ts:280

#### Returns

`void`

***

### setFEN()

> **setFEN**(`fen`): `void`

Defined in: src/core/types.ts:254

#### Parameters

##### fen

`string`

#### Returns

`void`

***

### toPgn()?

> `optional` **toPgn**(`includeHeaders?`): `string`

Defined in: src/core/types.ts:285

#### Parameters

##### includeHeaders?

`boolean`

#### Returns

`string`

***

### turn()

> **turn**(): [`Color`](../type-aliases/Color.md)

Defined in: src/core/types.ts:256

#### Returns

[`Color`](../type-aliases/Color.md)

***

### undo()

> **undo**(): `boolean`

Defined in: src/core/types.ts:273

#### Returns

`boolean`
