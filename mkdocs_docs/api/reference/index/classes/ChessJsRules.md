[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/ChessJsRules.ts:12

Rules adapter built on chess.js to provide full move validation

## Implements

- [`RulesAdapter`](../interfaces/RulesAdapter.md)

## Constructors

### Constructor

> **new ChessJsRules**(`fen?`): `ChessJsRules`

Defined in: src/core/ChessJsRules.ts:38

#### Parameters

##### fen?

`string`

#### Returns

`ChessJsRules`

## Properties

### supportsSanMoves

> `readonly` **supportsSanMoves**: `true` = `true`

Defined in: src/core/ChessJsRules.ts:15

Indicates whether the adapter supports SAN/LAN string move submissions.
Adapters should opt in explicitly to avoid accidental invocation with
unsupported argument shapes.

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`supportsSanMoves`](../interfaces/RulesAdapter.md#supportssanmoves)

## Methods

### canCastle()

> **canCastle**(`side`, `color?`): `boolean`

Defined in: src/core/ChessJsRules.ts:343

Check if castling is allowed

#### Parameters

##### side

`"k"` | `"q"`

##### color?

`"w"` | `"b"`

#### Returns

`boolean`

***

### clone()

> **clone**(): `ChessJsRules`

Defined in: src/core/ChessJsRules.ts:371

Create a copy of the current state

#### Returns

`ChessJsRules`

***

### downloadPgn()

> **downloadPgn**(`filename?`): `void`

Defined in: src/core/ChessJsRules.ts:422

Download the current game as a PGN file (browser only)

#### Parameters

##### filename?

`string`

#### Returns

`void`

***

### generateFEN()

> **generateFEN**(): `string`

Defined in: src/core/ChessJsRules.ts:400

Generate the FEN string for the current position

#### Returns

`string`

***

### get()

> **get**(`square`): \{ `color`: `string`; `type`: `string`; \} \| `null`

Defined in: src/core/ChessJsRules.ts:234

Get the piece on a square

#### Parameters

##### square

`string`

#### Returns

\{ `color`: `string`; `type`: `string`; \} \| `null`

***

### getAllMoves()

> **getAllMoves**(): [`Move`](../interfaces/Move.md)[]

Defined in: src/core/ChessJsRules.ts:133

Get every legal move in the current position

#### Returns

[`Move`](../interfaces/Move.md)[]

***

### getAttackedSquares()

> **getAttackedSquares**(): `string`[]

Defined in: src/core/ChessJsRules.ts:274

Get the squares attacked by the side to move

Uses the native chess.js detection to identify every square currently
controlled by the active player.

#### Returns

`string`[]

***

### getCheckSquares()

> **getCheckSquares**(): `string`[]

Defined in: src/core/ChessJsRules.ts:314

Get the king squares that are in check (for highlighting)

#### Returns

`string`[]

***

### getChessInstance()

> **getChessInstance**(): `Chess`

Defined in: src/core/ChessJsRules.ts:34

#### Returns

`Chess`

***

### getFEN()

> **getFEN**(): `string`

Defined in: src/core/ChessJsRules.ts:46

Get the current position in FEN format

#### Returns

`string`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`getFEN`](../interfaces/RulesAdapter.md#getfen)

***

### getGameResult()

> **getGameResult**(): `"*"` \| `"0-1"` \| `"1-0"` \| `"1/2-1/2"`

Defined in: src/core/ChessJsRules.ts:215

Get the result of the game

#### Returns

`"*"` \| `"0-1"` \| `"1-0"` \| `"1/2-1/2"`

***

### getHistory()

> **getHistory**(): `Move`[]

Defined in: src/core/ChessJsRules.ts:257

Get the detailed move history

#### Returns

`Move`[]

***

### getLastMove()

> **getLastMove**(): `Move` \| `null`

Defined in: src/core/ChessJsRules.ts:391

Get information about the last move played

#### Returns

`Move` \| `null`

***

### getLastMoveNotation()

> **getLastMoveNotation**(): `string` \| `null`

Defined in: src/core/ChessJsRules.ts:462

Get the PGN notation for the most recent move

#### Returns

`string` \| `null`

***

### getPgnMoves()

> **getPgnMoves**(): `string`[]

Defined in: src/core/ChessJsRules.ts:471

Retrieve the entire move history in PGN notation

#### Returns

`string`[]

***

### getPgnNotation()

> **getPgnNotation**(): [`PgnNotation`](PgnNotation.md)

Defined in: src/core/ChessJsRules.ts:430

Get the PgnNotation instance for advanced manipulation

#### Returns

[`PgnNotation`](PgnNotation.md)

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`getPgnNotation`](../interfaces/RulesAdapter.md#getpgnnotation)

***

### halfMoves()

> **halfMoves**(): `number`

Defined in: src/core/ChessJsRules.ts:360

Get the halfmove clock since the last capture or pawn move

#### Returns

`number`

***

### history()

> **history**(): `string`[]

Defined in: src/core/ChessJsRules.ts:250

Get the list of moves played

#### Returns

`string`[]

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`history`](../interfaces/RulesAdapter.md#history)

***

### inCheck()

> **inCheck**(): `boolean`

Defined in: src/core/ChessJsRules.ts:166

Check whether the side to move is in check

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`inCheck`](../interfaces/RulesAdapter.md#incheck)

***

### isCheckmate()

> **isCheckmate**(): `boolean`

Defined in: src/core/ChessJsRules.ts:173

Check whether the position is checkmate

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`isCheckmate`](../interfaces/RulesAdapter.md#ischeckmate)

***

### isDraw()

> **isDraw**(): `boolean`

Defined in: src/core/ChessJsRules.ts:187

Check whether the game is drawn

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`isDraw`](../interfaces/RulesAdapter.md#isdraw)

***

### isGameOver()

> **isGameOver**(): `boolean`

Defined in: src/core/ChessJsRules.ts:208

Determine whether the game has ended

#### Returns

`boolean`

***

### isInsufficientMaterial()

> **isInsufficientMaterial**(): `boolean`

Defined in: src/core/ChessJsRules.ts:194

Check whether the game is drawn by insufficient material

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`isInsufficientMaterial`](../interfaces/RulesAdapter.md#isinsufficientmaterial)

***

### isLegalMove()

> **isLegalMove**(`from`, `to`, `promotion?`): `boolean`

Defined in: src/core/ChessJsRules.ts:148

Check if a move is legal

#### Parameters

##### from

`string`

##### to

`string`

##### promotion?

`string`

#### Returns

`boolean`

***

### isSquareAttacked()

> **isSquareAttacked**(`square`, `by?`): `boolean`

Defined in: src/core/ChessJsRules.ts:289

Check whether a square is attacked

#### Parameters

##### square

`string`

Square to inspect (algebraic notation, case insensitive)

##### by?

Optional color to check a specific side

`"w"` | `"b"`

#### Returns

`boolean`

#### Throws

if the square or color value is invalid

***

### isStalemate()

> **isStalemate**(): `boolean`

Defined in: src/core/ChessJsRules.ts:180

Check whether the position is stalemate

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`isStalemate`](../interfaces/RulesAdapter.md#isstalemate)

***

### isThreefoldRepetition()

> **isThreefoldRepetition**(): `boolean`

Defined in: src/core/ChessJsRules.ts:201

Check whether the current position has occurred three times

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`isThreefoldRepetition`](../interfaces/RulesAdapter.md#isthreefoldrepetition)

***

### loadPgn()

> **loadPgn**(`pgn`): `boolean`

Defined in: src/core/ChessJsRules.ts:437

Load a game from a PGN string

#### Parameters

##### pgn

`string`

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`loadPgn`](../interfaces/RulesAdapter.md#loadpgn)

***

### move()

#### Call Signature

> **move**(`moveData`): [`RulesMoveResponse`](../interfaces/RulesMoveResponse.md)

Defined in: src/core/ChessJsRules.ts:75

Play a move

##### Parameters

###### moveData

`string`

##### Returns

[`RulesMoveResponse`](../interfaces/RulesMoveResponse.md)

##### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`move`](../interfaces/RulesAdapter.md#move)

#### Call Signature

> **move**(`moveData`): [`RulesMoveResponse`](../interfaces/RulesMoveResponse.md)

Defined in: src/core/ChessJsRules.ts:76

Play a move

##### Parameters

###### moveData

###### from

`string`

###### promotion?

`string`

###### to

`string`

##### Returns

[`RulesMoveResponse`](../interfaces/RulesMoveResponse.md)

##### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`move`](../interfaces/RulesAdapter.md#move)

***

### moveNumber()

> **moveNumber**(): `number`

Defined in: src/core/ChessJsRules.ts:353

Get the current move number

#### Returns

`number`

***

### movesFrom()

> **movesFrom**(`square`): [`Move`](../interfaces/Move.md)[]

Defined in: src/core/ChessJsRules.ts:115

Get every legal move from a square

#### Parameters

##### square

`string`

#### Returns

[`Move`](../interfaces/Move.md)[]

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`movesFrom`](../interfaces/RulesAdapter.md#movesfrom)

***

### reset()

> **reset**(): `void`

Defined in: src/core/ChessJsRules.ts:264

Reset the game to the initial position

#### Returns

`void`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`reset`](../interfaces/RulesAdapter.md#reset)

***

### setFEN()

> **setFEN**(`fen`): `void`

Defined in: src/core/ChessJsRules.ts:53

Set a position from a FEN string

#### Parameters

##### fen

`string`

#### Returns

`void`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`setFEN`](../interfaces/RulesAdapter.md#setfen)

***

### setPgnMetadata()

> **setPgnMetadata**(`metadata`): `void`

Defined in: src/core/ChessJsRules.ts:407

Set PGN metadata for the current game

#### Parameters

##### metadata

`Partial`\<[`PgnMetadata`](../interfaces/PgnMetadata.md)\>

#### Returns

`void`

***

### toPgn()

> **toPgn**(`includeHeaders`): `string`

Defined in: src/core/ChessJsRules.ts:414

Export the current game as PGN

#### Parameters

##### includeHeaders

`boolean` = `true`

#### Returns

`string`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`toPgn`](../interfaces/RulesAdapter.md#topgn)

***

### turn()

> **turn**(): `"w"` \| `"b"`

Defined in: src/core/ChessJsRules.ts:227

Get the player to move

#### Returns

`"w"` \| `"b"`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`turn`](../interfaces/RulesAdapter.md#turn)

***

### undo()

> **undo**(): `boolean`

Defined in: src/core/ChessJsRules.ts:242

Undo the last move

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`undo`](../interfaces/RulesAdapter.md#undo)

***

### isValidFEN()

> `static` **isValidFEN**(`fen`): `boolean`

Defined in: src/core/ChessJsRules.ts:378

Validate a FEN string

#### Parameters

##### fen

`string`

#### Returns

`boolean`
