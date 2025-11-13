[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/types.ts:131

## Properties

### activePremoveColor?

> `optional` **activePremoveColor**: [`Color`](../type-aliases/Color.md)

Defined in: src/core/types.ts:136

***

### arrows

> **arrows**: [`Arrow`](Arrow.md)[]

Defined in: src/core/types.ts:132

***

### highlights

> **highlights**: [`SquareHighlight`](SquareHighlight.md)[]

Defined in: src/core/types.ts:133

***

### premove?

> `optional` **premove**: [`Premove`](Premove.md)

Defined in: src/core/types.ts:134

***

### premoves?

> `optional` **premoves**: `Partial`\<`Record`\<[`Color`](../type-aliases/Color.md), [`Premove`](Premove.md)[]\>\>

Defined in: src/core/types.ts:135

***

### promotionPreview?

> `optional` **promotionPreview**: `object`

Defined in: src/core/types.ts:137

#### color

> **color**: [`Color`](../type-aliases/Color.md)

#### piece?

> `optional` **piece**: `"b"` \| `"r"` \| `"q"` \| `"n"`

#### square

> **square**: `` `${string}${number}` ``

***

### statusHighlight?

> `optional` **statusHighlight**: [`StatusHighlight`](StatusHighlight.md) \| `null`

Defined in: src/core/types.ts:142
