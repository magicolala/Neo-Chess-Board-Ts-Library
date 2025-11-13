[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/types.ts:525

## Type Parameters

### TOptions

`TOptions` = `unknown`

## Methods

### onAfterRender()?

> `optional` **onAfterRender**(`context`): `void`

Defined in: src/core/types.ts:528

#### Parameters

##### context

[`ExtensionContext`](ExtensionContext.md)\<`TOptions`\>

#### Returns

`void`

***

### onBeforeRender()?

> `optional` **onBeforeRender**(`context`): `void`

Defined in: src/core/types.ts:527

#### Parameters

##### context

[`ExtensionContext`](ExtensionContext.md)\<`TOptions`\>

#### Returns

`void`

***

### onDestroy()?

> `optional` **onDestroy**(`context`): `void`

Defined in: src/core/types.ts:532

#### Parameters

##### context

[`ExtensionContext`](ExtensionContext.md)\<`TOptions`\>

#### Returns

`void`

***

### onIllegalMove()?

> `optional` **onIllegalMove**(`context`, `payload`): `void`

Defined in: src/core/types.ts:530

#### Parameters

##### context

[`ExtensionContext`](ExtensionContext.md)\<`TOptions`\>

##### payload

###### from

`` `${string}${number}` ``

###### reason

`string`

###### to

`` `${string}${number}` ``

#### Returns

`void`

***

### onInit()?

> `optional` **onInit**(`context`): `void`

Defined in: src/core/types.ts:526

#### Parameters

##### context

[`ExtensionContext`](ExtensionContext.md)\<`TOptions`\>

#### Returns

`void`

***

### onMove()?

> `optional` **onMove**(`context`, `payload`): `void`

Defined in: src/core/types.ts:529

#### Parameters

##### context

[`ExtensionContext`](ExtensionContext.md)\<`TOptions`\>

##### payload

###### fen

`string`

###### from

`` `${string}${number}` ``

###### to

`` `${string}${number}` ``

#### Returns

`void`

***

### onUpdate()?

> `optional` **onUpdate**(`context`, `payload`): `void`

Defined in: src/core/types.ts:531

#### Parameters

##### context

[`ExtensionContext`](ExtensionContext.md)\<`TOptions`\>

##### payload

###### fen

`string`

#### Returns

`void`
