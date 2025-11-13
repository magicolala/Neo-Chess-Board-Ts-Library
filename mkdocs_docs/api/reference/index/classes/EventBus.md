[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/EventBus.ts:3

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\>

## Constructors

### Constructor

> **new EventBus**\<`T`\>(): `EventBus`\<`T`\>

#### Returns

`EventBus`\<`T`\>

## Methods

### emit()

> **emit**\<`K`\>(`type`, `payload`): `void`

Defined in: src/core/EventBus.ts:13

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

##### payload

`T`\[`K`\]

#### Returns

`void`

***

### off()

> **off**\<`K`\>(`type`, `fn`): `void`

Defined in: src/core/EventBus.ts:10

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

##### fn

(`p`) => `void`

#### Returns

`void`

***

### on()

> **on**\<`K`\>(`type`, `fn`): () => `void`

Defined in: src/core/EventBus.ts:5

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

##### fn

(`p`) => `void`

#### Returns

> (): `void`

##### Returns

`void`
