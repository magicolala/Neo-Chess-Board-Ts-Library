[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/PGN.ts:9

PGNRecorder
- If adapter exposes getPGN (chess.js), we proxy it.
- Else we build a light PGN from LAN (algebraic squares), with minimal SAN (no disamb/check/mate).
- Adds helpers to export as a downloadable .pgn file.

## Constructors

### Constructor

> **new PGNRecorder**(`adapter?`): `PGNRecorder`

Defined in: src/core/PGN.ts:20

#### Parameters

##### adapter?

[`RulesAdapter`](../interfaces/RulesAdapter.md)

#### Returns

`PGNRecorder`

## Methods

### download()

> **download**(`filename`): `void`

Defined in: src/core/PGN.ts:60

#### Parameters

##### filename

`string` = `...`

#### Returns

`void`

***

### getPGN()

> **getPGN**(): `string`

Defined in: src/core/PGN.ts:34

#### Returns

`string`

***

### push()

> **push**(`move`): `void`

Defined in: src/core/PGN.ts:24

#### Parameters

##### move

[`Move`](../interfaces/Move.md)

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: src/core/PGN.ts:21

#### Returns

`void`

***

### setHeaders()

> **setHeaders**(`h`): `void`

Defined in: src/core/PGN.ts:27

#### Parameters

##### h

`Partial`\<`Record`\<keyof *typeof* `this.headers`, `string`\>\>

#### Returns

`void`

***

### setResult()

> **setResult**(`res`): `void`

Defined in: src/core/PGN.ts:31

#### Parameters

##### res

`"*"` | `"0-1"` | `"1-0"` | `"1/2-1/2"`

#### Returns

`void`

***

### suggestFilename()

> **suggestFilename**(): `string`

Defined in: src/core/PGN.ts:55

#### Returns

`string`

***

### toBlob()

> **toBlob**(): `Blob`

Defined in: src/core/PGN.ts:51

#### Returns

`Blob`
