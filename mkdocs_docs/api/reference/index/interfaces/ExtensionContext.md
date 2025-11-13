[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/types.ts:513

## Type Parameters

### TOptions

`TOptions` = `unknown`

## Properties

### board

> `readonly` **board**: [`NeoChessBoard`](../classes/NeoChessBoard.md)

Defined in: src/core/types.ts:515

***

### bus

> `readonly` **bus**: [`EventBus`](../classes/EventBus.md)\<[`BoardEventMap`](BoardEventMap.md)\>

Defined in: src/core/types.ts:516

***

### id

> `readonly` **id**: `string`

Defined in: src/core/types.ts:514

***

### initialOptions

> `readonly` **initialOptions**: `Readonly`\<[`BoardOptions`](BoardOptions.md)\>

Defined in: src/core/types.ts:518

***

### options

> `readonly` **options**: `TOptions`

Defined in: src/core/types.ts:517

## Methods

### registerExtensionPoint()

> **registerExtensionPoint**\<`K`\>(`event`, `handler`): () => `void`

Defined in: src/core/types.ts:519

#### Type Parameters

##### K

`K` *extends* keyof [`BoardEventMap`](BoardEventMap.md)

#### Parameters

##### event

`K`

##### handler

(`payload`) => `void`

#### Returns

> (): `void`

##### Returns

`void`
