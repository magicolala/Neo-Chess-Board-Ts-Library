[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/PgnNotation.ts:36

## Constructors

### Constructor

> **new PgnNotation**(`rulesAdapter?`): `PgnNotation`

Defined in: src/core/PgnNotation.ts:49

#### Parameters

##### rulesAdapter?

[`RulesAdapter`](../interfaces/RulesAdapter.md)

#### Returns

`PgnNotation`

## Methods

### addMove()

> **addMove**(`moveNumber`, `whiteMove?`, `blackMove?`, `whiteComment?`, `blackComment?`): `void`

Defined in: src/core/PgnNotation.ts:89

Add a move to the game

#### Parameters

##### moveNumber

`number`

##### whiteMove?

`string`

##### blackMove?

`string`

##### whiteComment?

`string`

##### blackComment?

`string`

#### Returns

`void`

***

### addMoveAnnotations()

> **addMoveAnnotations**(`moveNumber`, `isWhite`, `annotations`): `void`

Defined in: src/core/PgnNotation.ts:459

Add visual annotations to a move

#### Parameters

##### moveNumber

`number`

##### isWhite

`boolean`

##### annotations

[`PgnMoveAnnotations`](../interfaces/PgnMoveAnnotations.md)

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Defined in: src/core/PgnNotation.ts:402

Clear all moves and reset

#### Returns

`void`

***

### downloadPgn()

> **downloadPgn**(`filename`): `void`

Defined in: src/core/PgnNotation.ts:442

Download PGN as file (browser only)

#### Parameters

##### filename

`string` = `'game.pgn'`

#### Returns

`void`

***

### getMetadata()

> **getMetadata**(): [`PgnMetadata`](../interfaces/PgnMetadata.md)

Defined in: src/core/PgnNotation.ts:82

#### Returns

[`PgnMetadata`](../interfaces/PgnMetadata.md)

***

### getMoveAnnotations()

> **getMoveAnnotations**(`moveNumber`, `isWhite`): [`PgnMoveAnnotations`](../interfaces/PgnMoveAnnotations.md) \| `undefined`

Defined in: src/core/PgnNotation.ts:888

Get annotations for a specific move

#### Parameters

##### moveNumber

`number`

##### isWhite

`boolean`

#### Returns

[`PgnMoveAnnotations`](../interfaces/PgnMoveAnnotations.md) \| `undefined`

***

### getMoveCount()

> **getMoveCount**(): `number`

Defined in: src/core/PgnNotation.ts:411

Get move count

#### Returns

`number`

***

### getMovesWithAnnotations()

> **getMovesWithAnnotations**(): [`PgnMove`](../interfaces/PgnMove.md)[]

Defined in: src/core/PgnNotation.ts:898

Get all moves with their annotations

#### Returns

[`PgnMove`](../interfaces/PgnMove.md)[]

***

### getParseIssues()

> **getParseIssues**(): [`PgnParseError`](PgnParseError.md)[]

Defined in: src/core/PgnNotation.ts:502

#### Returns

[`PgnParseError`](PgnParseError.md)[]

***

### getResult()

> **getResult**(): `string`

Defined in: src/core/PgnNotation.ts:418

Get current result

#### Returns

`string`

***

### importFromChessJs()

> **importFromChessJs**(`chess`): `void`

Defined in: src/core/PgnNotation.ts:135

Import moves from a chess.js game

#### Parameters

##### chess

[`ChessLike`](../interfaces/ChessLike.md)

#### Returns

`void`

***

### loadPgnWithAnnotations()

> **loadPgnWithAnnotations**(`pgnString`): `void`

Defined in: src/core/PgnNotation.ts:477

Parse a PGN string with comments containing visual annotations

#### Parameters

##### pgnString

`string`

#### Returns

`void`

***

### setMetadata()

> **setMetadata**(`metadata`): `void`

Defined in: src/core/PgnNotation.ts:68

Set the game metadata (headers)

#### Parameters

##### metadata

`Partial`\<[`PgnMetadata`](../interfaces/PgnMetadata.md)\>

#### Returns

`void`

***

### setResult()

> **setResult**(`result`): `void`

Defined in: src/core/PgnNotation.ts:127

Set the game result

#### Parameters

##### result

`string`

#### Returns

`void`

***

### toPgn()

> **toPgn**(`includeHeaders`): `string`

Defined in: src/core/PgnNotation.ts:322

Generate the complete PGN string

#### Parameters

##### includeHeaders

`boolean` = `true`

#### Returns

`string`

***

### toPgnWithAnnotations()

> **toPgnWithAnnotations**(): `string`

Defined in: src/core/PgnNotation.ts:766

Generate PGN with visual annotations embedded in comments

#### Returns

`string`

***

### fromMoveList()

> `static` **fromMoveList**(`moves`, `metadata?`): `string`

Defined in: src/core/PgnNotation.ts:425

Create a PGN from a simple move list

#### Parameters

##### moves

`string`[]

##### metadata?

`Partial`\<[`PgnMetadata`](../interfaces/PgnMetadata.md)\>

#### Returns

`string`
