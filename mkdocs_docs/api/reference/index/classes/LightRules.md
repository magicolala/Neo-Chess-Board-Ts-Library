[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/LightRules.ts:28

## Implements

- [`RulesAdapter`](../interfaces/RulesAdapter.md)

## Constructors

### Constructor

> **new LightRules**(): `LightRules`

#### Returns

`LightRules`

## Properties

### supportsSanMoves

> `readonly` **supportsSanMoves**: `false` = `false`

Defined in: src/core/LightRules.ts:31

Indicates whether the adapter supports SAN/LAN string move submissions.
Adapters should opt in explicitly to avoid accidental invocation with
unsupported argument shapes.

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`supportsSanMoves`](../interfaces/RulesAdapter.md#supportssanmoves)

## Methods

### getFEN()

> **getFEN**(): `string`

Defined in: src/core/LightRules.ts:50

#### Returns

`string`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`getFEN`](../interfaces/RulesAdapter.md#getfen)

***

### isDraw()

> **isDraw**(): `boolean`

Defined in: src/core/LightRules.ts:230

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`isDraw`](../interfaces/RulesAdapter.md#isdraw)

***

### isInsufficientMaterial()

> **isInsufficientMaterial**(): `boolean`

Defined in: src/core/LightRules.ts:234

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`isInsufficientMaterial`](../interfaces/RulesAdapter.md#isinsufficientmaterial)

***

### isThreefoldRepetition()

> **isThreefoldRepetition**(): `boolean`

Defined in: src/core/LightRules.ts:238

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`isThreefoldRepetition`](../interfaces/RulesAdapter.md#isthreefoldrepetition)

***

### move()

#### Call Signature

> **move**(`move`): [`RulesMoveResponse`](../interfaces/RulesMoveResponse.md)

Defined in: src/core/LightRules.ts:173

Execute a move. When a string is provided it should be interpreted as SAN/LAN notation.

##### Parameters

###### move

`string`

##### Returns

[`RulesMoveResponse`](../interfaces/RulesMoveResponse.md)

##### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`move`](../interfaces/RulesAdapter.md#move)

#### Call Signature

> **move**(`__namedParameters`): [`RulesMoveResponse`](../interfaces/RulesMoveResponse.md)

Defined in: src/core/LightRules.ts:174

##### Parameters

###### \_\_namedParameters

###### from

`` `${string}${number}` ``

###### promotion?

`"b"` \| `"r"` \| `"q"` \| `"n"`

###### to

`` `${string}${number}` ``

##### Returns

[`RulesMoveResponse`](../interfaces/RulesMoveResponse.md)

##### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`move`](../interfaces/RulesAdapter.md#move)

***

### movesFrom()

> **movesFrom**(`square`): [`Move`](../interfaces/Move.md)[]

Defined in: src/core/LightRules.ts:61

#### Parameters

##### square

`` `${string}${number}` ``

#### Returns

[`Move`](../interfaces/Move.md)[]

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`movesFrom`](../interfaces/RulesAdapter.md#movesfrom)

***

### pieceAt()

> **pieceAt**(`square`): `string` \| `null`

Defined in: src/core/LightRules.ts:56

#### Parameters

##### square

`` `${string}${number}` ``

#### Returns

`string` \| `null`

***

### reset()

> **reset**(): `void`

Defined in: src/core/LightRules.ts:42

#### Returns

`void`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`reset`](../interfaces/RulesAdapter.md#reset)

***

### setFEN()

> **setFEN**(`f`): `void`

Defined in: src/core/LightRules.ts:46

#### Parameters

##### f

`string`

#### Returns

`void`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`setFEN`](../interfaces/RulesAdapter.md#setfen)

***

### turn()

> **turn**(): [`Color`](../type-aliases/Color.md)

Defined in: src/core/LightRules.ts:53

#### Returns

[`Color`](../type-aliases/Color.md)

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`turn`](../interfaces/RulesAdapter.md#turn)

***

### undo()

> **undo**(): `boolean`

Defined in: src/core/LightRules.ts:223

#### Returns

`boolean`

#### Implementation of

[`RulesAdapter`](../interfaces/RulesAdapter.md).[`undo`](../interfaces/RulesAdapter.md#undo)
