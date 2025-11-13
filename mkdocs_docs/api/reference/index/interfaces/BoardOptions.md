[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/types.ts:416

## Properties

### allowAutoScroll?

> `optional` **allowAutoScroll**: `boolean`

Defined in: src/core/types.ts:436

***

### allowDragging?

> `optional` **allowDragging**: `boolean`

Defined in: src/core/types.ts:437

***

### allowDragOffBoard?

> `optional` **allowDragOffBoard**: `boolean`

Defined in: src/core/types.ts:438

***

### allowDrawingArrows?

> `optional` **allowDrawingArrows**: `boolean`

Defined in: src/core/types.ts:460

***

### allowPremoves?

> `optional` **allowPremoves**: `boolean`

Defined in: src/core/types.ts:445

***

### alphaNotationStyle?

> `optional` **alphaNotationStyle**: [`NotationStyleOptions`](NotationStyleOptions.md)

Defined in: src/core/types.ts:473

***

### animation?

> `optional` **animation**: [`BoardAnimationConfig`](BoardAnimationConfig.md)

Defined in: src/core/types.ts:426

***

### animationDurationInMs?

> `optional` **animationDurationInMs**: `number`

Defined in: src/core/types.ts:428

***

### animationEasing?

> `optional` **animationEasing**: [`AnimationEasing`](../type-aliases/AnimationEasing.md)

Defined in: src/core/types.ts:429

***

### animationMs?

> `optional` **animationMs**: `number`

Defined in: src/core/types.ts:427

***

### arrowOptions?

> `optional` **arrowOptions**: [`ArrowStyleOptions`](ArrowStyleOptions.md)

Defined in: src/core/types.ts:462

***

### arrows?

> `optional` **arrows**: [`Arrow`](Arrow.md)[]

Defined in: src/core/types.ts:461

***

### autoFlip?

> `optional` **autoFlip**: `boolean`

Defined in: src/core/types.ts:454

***

### boardOrientation?

> `optional` **boardOrientation**: `"white"` \| `"black"`

Defined in: src/core/types.ts:419

***

### boardStyle?

> `optional` **boardStyle**: [`InlineStyle`](../type-aliases/InlineStyle.md)

Defined in: src/core/types.ts:466

***

### canDragPiece()?

> `optional` **canDragPiece**: (`params`) => `boolean`

Defined in: src/core/types.ts:439

#### Parameters

##### params

[`PieceCanDragHandlerArgs`](PieceCanDragHandlerArgs.md)

#### Returns

`boolean`

***

### chessboardColumns?

> `optional` **chessboardColumns**: `number`

Defined in: src/core/types.ts:421

***

### chessboardRows?

> `optional` **chessboardRows**: `number`

Defined in: src/core/types.ts:420

***

### clearArrowsOnClick?

> `optional` **clearArrowsOnClick**: `boolean`

Defined in: src/core/types.ts:464

***

### clock?

> `optional` **clock**: [`ClockConfig`](ClockConfig.md)

Defined in: src/core/types.ts:479

***

### darkSquareNotationStyle?

> `optional` **darkSquareNotationStyle**: [`NotationStyleOptions`](NotationStyleOptions.md)

Defined in: src/core/types.ts:472

***

### darkSquareStyle?

> `optional` **darkSquareStyle**: [`SquareStyleOptions`](SquareStyleOptions.md)

Defined in: src/core/types.ts:469

***

### dragActivationDistance?

> `optional` **dragActivationDistance**: `number`

Defined in: src/core/types.ts:440

***

### dragCancelOnEsc?

> `optional` **dragCancelOnEsc**: `boolean`

Defined in: src/core/types.ts:444

***

### dragGhostOpacity?

> `optional` **dragGhostOpacity**: `number`

Defined in: src/core/types.ts:443

***

### dragGhostPiece?

> `optional` **dragGhostPiece**: `boolean`

Defined in: src/core/types.ts:442

***

### dragSnapToSquare?

> `optional` **dragSnapToSquare**: `boolean`

Defined in: src/core/types.ts:441

***

### extensions?

> `optional` **extensions**: [`ExtensionConfig`](ExtensionConfig.md)\<`unknown`\>[]

Defined in: src/core/types.ts:458

***

### fen?

> `optional` **fen**: `string`

Defined in: src/core/types.ts:432

***

### highlightLegal?

> `optional` **highlightLegal**: `boolean`

Defined in: src/core/types.ts:431

***

### id?

> `optional` **id**: `string`

Defined in: src/core/types.ts:465

***

### interactive?

> `optional` **interactive**: `boolean`

Defined in: src/core/types.ts:422

***

### lightSquareNotationStyle?

> `optional` **lightSquareNotationStyle**: [`NotationStyleOptions`](NotationStyleOptions.md)

Defined in: src/core/types.ts:471

***

### lightSquareStyle?

> `optional` **lightSquareStyle**: [`SquareStyleOptions`](SquareStyleOptions.md)

Defined in: src/core/types.ts:468

***

### maxArrows?

> `optional` **maxArrows**: `number`

Defined in: src/core/types.ts:450

***

### maxHighlights?

> `optional` **maxHighlights**: `number`

Defined in: src/core/types.ts:451

***

### numericNotationStyle?

> `optional` **numericNotationStyle**: [`NotationStyleOptions`](NotationStyleOptions.md)

Defined in: src/core/types.ts:474

***

### onArrowsChange()?

> `optional` **onArrowsChange**: (`arrows`) => `void`

Defined in: src/core/types.ts:463

#### Parameters

##### arrows

[`Arrow`](Arrow.md)[]

#### Returns

`void`

***

### onPromotionRequired()?

> `optional` **onPromotionRequired**: (`request`) => `void` \| `Promise`\<`void`\>

Defined in: src/core/types.ts:459

#### Parameters

##### request

[`PromotionRequest`](PromotionRequest.md)

#### Returns

`void` \| `Promise`\<`void`\>

***

### orientation?

> `optional` **orientation**: `"white"` \| `"black"`

Defined in: src/core/types.ts:418

***

### pieces?

> `optional` **pieces**: `Partial`\<`Record`\<[`Piece`](../type-aliases/Piece.md), [`PieceRenderer`](../type-aliases/PieceRenderer.md)\>\>

Defined in: src/core/types.ts:477

***

### pieceSet?

> `optional` **pieceSet**: [`PieceSet`](PieceSet.md)

Defined in: src/core/types.ts:424

***

### position?

> `optional` **position**: `string`

Defined in: src/core/types.ts:433

***

### premove?

> `optional` **premove**: [`BoardPremoveSettings`](BoardPremoveSettings.md)

Defined in: src/core/types.ts:446

***

### promotion?

> `optional` **promotion**: [`PromotionOptions`](PromotionOptions.md)

Defined in: src/core/types.ts:478

***

### rightClickHighlights?

> `optional` **rightClickHighlights**: `boolean`

Defined in: src/core/types.ts:449

***

### rulesAdapter?

> `optional` **rulesAdapter**: [`RulesAdapter`](RulesAdapter.md)

Defined in: src/core/types.ts:434

***

### showAnimations?

> `optional` **showAnimations**: `boolean`

Defined in: src/core/types.ts:430

***

### showArrows?

> `optional` **showArrows**: `boolean`

Defined in: src/core/types.ts:447

***

### showCoordinates?

> `optional` **showCoordinates**: `boolean`

Defined in: src/core/types.ts:425

***

### showHighlights?

> `optional` **showHighlights**: `boolean`

Defined in: src/core/types.ts:448

***

### showNotation?

> `optional` **showNotation**: `boolean`

Defined in: src/core/types.ts:475

***

### showSquareNames?

> `optional` **showSquareNames**: `boolean`

Defined in: src/core/types.ts:453

***

### size?

> `optional` **size**: `number`

Defined in: src/core/types.ts:417

***

### soundEnabled?

> `optional` **soundEnabled**: `boolean`

Defined in: src/core/types.ts:452

***

### soundEventUrls?

> `optional` **soundEventUrls**: `Partial`\<`Record`\<[`BoardSoundEventType`](../type-aliases/BoardSoundEventType.md), [`BoardSoundEventUrl`](../type-aliases/BoardSoundEventUrl.md)\>\>

Defined in: src/core/types.ts:457

***

### soundUrl?

> `optional` **soundUrl**: `string`

Defined in: src/core/types.ts:455

***

### soundUrls?

> `optional` **soundUrls**: `Partial`\<`Record`\<`"white"` \| `"black"`, `string`\>\>

Defined in: src/core/types.ts:456

***

### squareRenderer?

> `optional` **squareRenderer**: [`SquareRenderer`](../type-aliases/SquareRenderer.md)

Defined in: src/core/types.ts:476

***

### squareStyle?

> `optional` **squareStyle**: [`SquareStyleOptions`](SquareStyleOptions.md)

Defined in: src/core/types.ts:467

***

### squareStyles?

> `optional` **squareStyles**: `Partial`\<`Record`\<`` `${string}${number}` ``, [`SquareStyleOptions`](SquareStyleOptions.md)\>\>

Defined in: src/core/types.ts:470

***

### theme?

> `optional` **theme**: `string` \| [`Theme`](Theme.md)

Defined in: src/core/types.ts:423
