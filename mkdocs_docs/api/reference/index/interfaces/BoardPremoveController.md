[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/types.ts:501

## Methods

### clear()

> **clear**(`color?`): `void`

Defined in: src/core/types.ts:504

#### Parameters

##### color?

[`PremoveColorOption`](../type-aliases/PremoveColorOption.md)

#### Returns

`void`

***

### config()

> **config**(): [`BoardPremoveControllerConfig`](BoardPremoveControllerConfig.md)

Defined in: src/core/types.ts:510

#### Returns

[`BoardPremoveControllerConfig`](BoardPremoveControllerConfig.md)

***

### disable()

> **disable**(`color?`): `void`

Defined in: src/core/types.ts:503

#### Parameters

##### color?

[`PremoveColorOption`](../type-aliases/PremoveColorOption.md)

#### Returns

`void`

***

### enable()

> **enable**(`options?`): `void`

Defined in: src/core/types.ts:502

#### Parameters

##### options?

[`BoardPremoveEnableOptions`](BoardPremoveEnableOptions.md)

#### Returns

`void`

***

### getQueue()

> **getQueue**(`color?`): [`Premove`](Premove.md)[]

Defined in: src/core/types.ts:505

#### Parameters

##### color?

[`NamedPlayerColor`](../type-aliases/NamedPlayerColor.md)

#### Returns

[`Premove`](Premove.md)[]

***

### getQueues()

> **getQueues**(): `Record`\<[`NamedPlayerColor`](../type-aliases/NamedPlayerColor.md), [`Premove`](Premove.md)[]\>

Defined in: src/core/types.ts:506

#### Returns

`Record`\<[`NamedPlayerColor`](../type-aliases/NamedPlayerColor.md), [`Premove`](Premove.md)[]\>

***

### isEnabled()

> **isEnabled**(): `boolean`

Defined in: src/core/types.ts:507

#### Returns

`boolean`

***

### isMulti()

> **isMulti**(): `boolean`

Defined in: src/core/types.ts:508

#### Returns

`boolean`

***

### setMulti()

> **setMulti**(`enabled`): `void`

Defined in: src/core/types.ts:509

#### Parameters

##### enabled

`boolean`

#### Returns

`void`
