[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/react/NeoChessBoard.tsx:132

## Extends

- `Omit`\<[`BoardOptions`](../../index/interfaces/BoardOptions.md), `"fen"` \| `"position"` \| `"rulesAdapter"` \| `"squareRenderer"` \| `"pieces"` \| `"boardStyle"`\>

## Properties

### allowAutoScroll?

> `optional` **allowAutoScroll**: `boolean`

Defined in: src/core/types.ts:436

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`allowAutoScroll`](../../index/interfaces/BoardOptions.md#allowautoscroll)

***

### allowDragging?

> `optional` **allowDragging**: `boolean`

Defined in: src/core/types.ts:437

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`allowDragging`](../../index/interfaces/BoardOptions.md#allowdragging)

***

### allowDragOffBoard?

> `optional` **allowDragOffBoard**: `boolean`

Defined in: src/core/types.ts:438

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`allowDragOffBoard`](../../index/interfaces/BoardOptions.md#allowdragoffboard)

***

### allowDrawingArrows?

> `optional` **allowDrawingArrows**: `boolean`

Defined in: src/core/types.ts:460

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`allowDrawingArrows`](../../index/interfaces/BoardOptions.md#allowdrawingarrows)

***

### allowPremoves?

> `optional` **allowPremoves**: `boolean`

Defined in: src/core/types.ts:445

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`allowPremoves`](../../index/interfaces/BoardOptions.md#allowpremoves)

***

### alphaNotationStyle?

> `optional` **alphaNotationStyle**: [`NotationStyleOptions`](../../index/interfaces/NotationStyleOptions.md)

Defined in: src/core/types.ts:473

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`alphaNotationStyle`](../../index/interfaces/BoardOptions.md#alphanotationstyle)

***

### animation?

> `optional` **animation**: [`BoardAnimationConfig`](../../index/interfaces/BoardAnimationConfig.md)

Defined in: src/core/types.ts:426

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`animation`](../../index/interfaces/BoardOptions.md#animation)

***

### animationDurationInMs?

> `optional` **animationDurationInMs**: `number`

Defined in: src/core/types.ts:428

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`animationDurationInMs`](../../index/interfaces/BoardOptions.md#animationdurationinms)

***

### animationEasing?

> `optional` **animationEasing**: [`AnimationEasing`](../../index/type-aliases/AnimationEasing.md)

Defined in: src/core/types.ts:429

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`animationEasing`](../../index/interfaces/BoardOptions.md#animationeasing)

***

### animationMs?

> `optional` **animationMs**: `number`

Defined in: src/core/types.ts:427

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`animationMs`](../../index/interfaces/BoardOptions.md#animationms)

***

### arrowOptions?

> `optional` **arrowOptions**: [`ArrowStyleOptions`](../../index/interfaces/ArrowStyleOptions.md)

Defined in: src/core/types.ts:462

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`arrowOptions`](../../index/interfaces/BoardOptions.md#arrowoptions)

***

### arrows?

> `optional` **arrows**: [`Arrow`](../../index/interfaces/Arrow.md)[]

Defined in: src/core/types.ts:461

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`arrows`](../../index/interfaces/BoardOptions.md#arrows)

***

### autoFlip?

> `optional` **autoFlip**: `boolean`

Defined in: src/core/types.ts:454

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`autoFlip`](../../index/interfaces/BoardOptions.md#autoflip)

***

### boardOrientation?

> `optional` **boardOrientation**: `"white"` \| `"black"`

Defined in: src/react/NeoChessBoard.tsx:142

#### Overrides

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`boardOrientation`](../../index/interfaces/BoardOptions.md#boardorientation)

***

### boardStyle?

> `optional` **boardStyle**: [`InlineStyle`](../../index/type-aliases/InlineStyle.md) \| `CSSProperties`

Defined in: src/react/NeoChessBoard.tsx:141

***

### canDragPiece()?

> `optional` **canDragPiece**: (`params`) => `boolean`

Defined in: src/core/types.ts:439

#### Parameters

##### params

[`PieceCanDragHandlerArgs`](../../index/interfaces/PieceCanDragHandlerArgs.md)

#### Returns

`boolean`

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`canDragPiece`](../../index/interfaces/BoardOptions.md#candragpiece)

***

### chessboardColumns?

> `optional` **chessboardColumns**: `number`

Defined in: src/core/types.ts:421

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`chessboardColumns`](../../index/interfaces/BoardOptions.md#chessboardcolumns)

***

### chessboardRows?

> `optional` **chessboardRows**: `number`

Defined in: src/core/types.ts:420

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`chessboardRows`](../../index/interfaces/BoardOptions.md#chessboardrows)

***

### className?

> `optional` **className**: `string`

Defined in: src/react/NeoChessBoard.tsx:139

***

### clearArrowsOnClick?

> `optional` **clearArrowsOnClick**: `boolean`

Defined in: src/core/types.ts:464

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`clearArrowsOnClick`](../../index/interfaces/BoardOptions.md#cleararrowsonclick)

***

### clock?

> `optional` **clock**: [`ClockConfig`](../../index/interfaces/ClockConfig.md)

Defined in: src/core/types.ts:479

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`clock`](../../index/interfaces/BoardOptions.md#clock)

***

### darkSquareNotationStyle?

> `optional` **darkSquareNotationStyle**: [`NotationStyleOptions`](../../index/interfaces/NotationStyleOptions.md)

Defined in: src/core/types.ts:472

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`darkSquareNotationStyle`](../../index/interfaces/BoardOptions.md#darksquarenotationstyle)

***

### darkSquareStyle?

> `optional` **darkSquareStyle**: [`SquareStyleOptions`](../../index/interfaces/SquareStyleOptions.md)

Defined in: src/core/types.ts:469

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`darkSquareStyle`](../../index/interfaces/BoardOptions.md#darksquarestyle)

***

### dragActivationDistance?

> `optional` **dragActivationDistance**: `number`

Defined in: src/core/types.ts:440

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`dragActivationDistance`](../../index/interfaces/BoardOptions.md#dragactivationdistance)

***

### dragCancelOnEsc?

> `optional` **dragCancelOnEsc**: `boolean`

Defined in: src/core/types.ts:444

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`dragCancelOnEsc`](../../index/interfaces/BoardOptions.md#dragcancelonesc)

***

### dragGhostOpacity?

> `optional` **dragGhostOpacity**: `number`

Defined in: src/core/types.ts:443

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`dragGhostOpacity`](../../index/interfaces/BoardOptions.md#dragghostopacity)

***

### dragGhostPiece?

> `optional` **dragGhostPiece**: `boolean`

Defined in: src/core/types.ts:442

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`dragGhostPiece`](../../index/interfaces/BoardOptions.md#dragghostpiece)

***

### dragSnapToSquare?

> `optional` **dragSnapToSquare**: `boolean`

Defined in: src/core/types.ts:441

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`dragSnapToSquare`](../../index/interfaces/BoardOptions.md#dragsnaptosquare)

***

### extensions?

> `optional` **extensions**: [`ExtensionConfig`](../../index/interfaces/ExtensionConfig.md)\<`unknown`\>[]

Defined in: src/core/types.ts:458

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`extensions`](../../index/interfaces/BoardOptions.md#extensions)

***

### fen?

> `optional` **fen**: `string`

Defined in: src/react/NeoChessBoard.tsx:137

***

### highlightLegal?

> `optional` **highlightLegal**: `boolean`

Defined in: src/core/types.ts:431

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`highlightLegal`](../../index/interfaces/BoardOptions.md#highlightlegal)

***

### id?

> `optional` **id**: `string`

Defined in: src/core/types.ts:465

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`id`](../../index/interfaces/BoardOptions.md#id)

***

### interactive?

> `optional` **interactive**: `boolean`

Defined in: src/core/types.ts:422

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`interactive`](../../index/interfaces/BoardOptions.md#interactive)

***

### lightSquareNotationStyle?

> `optional` **lightSquareNotationStyle**: [`NotationStyleOptions`](../../index/interfaces/NotationStyleOptions.md)

Defined in: src/core/types.ts:471

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`lightSquareNotationStyle`](../../index/interfaces/BoardOptions.md#lightsquarenotationstyle)

***

### lightSquareStyle?

> `optional` **lightSquareStyle**: [`SquareStyleOptions`](../../index/interfaces/SquareStyleOptions.md)

Defined in: src/core/types.ts:468

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`lightSquareStyle`](../../index/interfaces/BoardOptions.md#lightsquarestyle)

***

### maxArrows?

> `optional` **maxArrows**: `number`

Defined in: src/core/types.ts:450

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`maxArrows`](../../index/interfaces/BoardOptions.md#maxarrows)

***

### maxHighlights?

> `optional` **maxHighlights**: `number`

Defined in: src/core/types.ts:451

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`maxHighlights`](../../index/interfaces/BoardOptions.md#maxhighlights)

***

### numericNotationStyle?

> `optional` **numericNotationStyle**: [`NotationStyleOptions`](../../index/interfaces/NotationStyleOptions.md)

Defined in: src/core/types.ts:474

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`numericNotationStyle`](../../index/interfaces/BoardOptions.md#numericnotationstyle)

***

### onArrowsChange()?

> `optional` **onArrowsChange**: (`arrows`) => `void`

Defined in: src/core/types.ts:463

#### Parameters

##### arrows

[`Arrow`](../../index/interfaces/Arrow.md)[]

#### Returns

`void`

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`onArrowsChange`](../../index/interfaces/BoardOptions.md#onarrowschange)

***

### onClockChange()?

> `optional` **onClockChange**: (`state`) => `void`

Defined in: src/react/NeoChessBoard.tsx:157

#### Parameters

##### state

[`ClockState`](../../index/interfaces/ClockState.md)

#### Returns

`void`

***

### onClockFlag()?

> `optional` **onClockFlag**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:160

#### Parameters

##### e

###### color

[`Color`](../../index/type-aliases/Color.md)

###### remaining

`number`

#### Returns

`void`

***

### onClockPause()?

> `optional` **onClockPause**: () => `void`

Defined in: src/react/NeoChessBoard.tsx:159

#### Returns

`void`

***

### onClockStart()?

> `optional` **onClockStart**: () => `void`

Defined in: src/react/NeoChessBoard.tsx:158

#### Returns

`void`

***

### onIllegal()?

> `optional` **onIllegal**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:146

#### Parameters

##### e

###### from

`` `${string}${number}` ``

###### reason

`string`

###### to

`` `${string}${number}` ``

#### Returns

`void`

***

### onMove()?

> `optional` **onMove**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:145

#### Parameters

##### e

###### fen

`string`

###### from

`` `${string}${number}` ``

###### to

`` `${string}${number}` ``

#### Returns

`void`

***

### onPieceClick()?

> `optional` **onPieceClick**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:154

#### Parameters

##### e

[`PiecePointerEventPayload`](../../index/interfaces/PiecePointerEventPayload.md)

#### Returns

`void`

***

### onPieceDrag()?

> `optional` **onPieceDrag**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:155

#### Parameters

##### e

[`PieceDragEventPayload`](../../index/interfaces/PieceDragEventPayload.md)

#### Returns

`void`

***

### onPieceDrop()?

> `optional` **onPieceDrop**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:156

#### Parameters

##### e

[`PieceDropEventPayload`](../../index/interfaces/PieceDropEventPayload.md)

#### Returns

`void`

***

### onPromotionRequired()?

> `optional` **onPromotionRequired**: (`request`) => `void` \| `Promise`\<`void`\>

Defined in: src/core/types.ts:459

#### Parameters

##### request

[`PromotionRequest`](../../index/interfaces/PromotionRequest.md)

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`onPromotionRequired`](../../index/interfaces/BoardOptions.md#onpromotionrequired)

***

### onSquareClick()?

> `optional` **onSquareClick**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:148

#### Parameters

##### e

[`SquarePointerEventPayload`](../../index/interfaces/SquarePointerEventPayload.md)

#### Returns

`void`

***

### onSquareMouseDown()?

> `optional` **onSquareMouseDown**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:149

#### Parameters

##### e

[`SquarePointerEventPayload`](../../index/interfaces/SquarePointerEventPayload.md)

#### Returns

`void`

***

### onSquareMouseOut()?

> `optional` **onSquareMouseOut**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:153

#### Parameters

##### e

[`SquareTransitionEventPayload`](../../index/interfaces/SquareTransitionEventPayload.md)

#### Returns

`void`

***

### onSquareMouseOver()?

> `optional` **onSquareMouseOver**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:152

#### Parameters

##### e

[`SquareTransitionEventPayload`](../../index/interfaces/SquareTransitionEventPayload.md)

#### Returns

`void`

***

### onSquareMouseUp()?

> `optional` **onSquareMouseUp**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:150

#### Parameters

##### e

[`SquarePointerEventPayload`](../../index/interfaces/SquarePointerEventPayload.md)

#### Returns

`void`

***

### onSquareRightClick()?

> `optional` **onSquareRightClick**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:151

#### Parameters

##### e

[`SquarePointerEventPayload`](../../index/interfaces/SquarePointerEventPayload.md)

#### Returns

`void`

***

### onUpdate()?

> `optional` **onUpdate**: (`e`) => `void`

Defined in: src/react/NeoChessBoard.tsx:147

#### Parameters

##### e

###### fen

`string`

#### Returns

`void`

***

### orientation?

> `optional` **orientation**: `"white"` \| `"black"`

Defined in: src/core/types.ts:418

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`orientation`](../../index/interfaces/BoardOptions.md#orientation)

***

### pieces?

> `optional` **pieces**: `Partial`\<`Record`\<[`Piece`](../../index/type-aliases/Piece.md), [`PieceRenderer`](../../index/type-aliases/PieceRenderer.md)\>\> \| `Partial`\<`Record`\<[`Piece`](../../index/type-aliases/Piece.md), `ReactPieceRenderer`\>\>

Defined in: src/react/NeoChessBoard.tsx:144

***

### pieceSet?

> `optional` **pieceSet**: [`PieceSet`](../../index/interfaces/PieceSet.md)

Defined in: src/core/types.ts:424

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`pieceSet`](../../index/interfaces/BoardOptions.md#pieceset)

***

### position?

> `optional` **position**: `string`

Defined in: src/react/NeoChessBoard.tsx:138

***

### premove?

> `optional` **premove**: [`BoardPremoveSettings`](../../index/interfaces/BoardPremoveSettings.md)

Defined in: src/core/types.ts:446

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`premove`](../../index/interfaces/BoardOptions.md#premove)

***

### promotion?

> `optional` **promotion**: [`PromotionOptions`](../../index/interfaces/PromotionOptions.md)

Defined in: src/core/types.ts:478

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`promotion`](../../index/interfaces/BoardOptions.md#promotion)

***

### rightClickHighlights?

> `optional` **rightClickHighlights**: `boolean`

Defined in: src/core/types.ts:449

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`rightClickHighlights`](../../index/interfaces/BoardOptions.md#rightclickhighlights)

***

### showAnimations?

> `optional` **showAnimations**: `boolean`

Defined in: src/core/types.ts:430

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`showAnimations`](../../index/interfaces/BoardOptions.md#showanimations)

***

### showArrows?

> `optional` **showArrows**: `boolean`

Defined in: src/core/types.ts:447

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`showArrows`](../../index/interfaces/BoardOptions.md#showarrows)

***

### showCoordinates?

> `optional` **showCoordinates**: `boolean`

Defined in: src/core/types.ts:425

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`showCoordinates`](../../index/interfaces/BoardOptions.md#showcoordinates)

***

### showHighlights?

> `optional` **showHighlights**: `boolean`

Defined in: src/core/types.ts:448

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`showHighlights`](../../index/interfaces/BoardOptions.md#showhighlights)

***

### showNotation?

> `optional` **showNotation**: `boolean`

Defined in: src/core/types.ts:475

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`showNotation`](../../index/interfaces/BoardOptions.md#shownotation)

***

### showSquareNames?

> `optional` **showSquareNames**: `boolean`

Defined in: src/core/types.ts:453

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`showSquareNames`](../../index/interfaces/BoardOptions.md#showsquarenames)

***

### size?

> `optional` **size**: `number`

Defined in: src/core/types.ts:417

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`size`](../../index/interfaces/BoardOptions.md#size)

***

### soundEnabled?

> `optional` **soundEnabled**: `boolean`

Defined in: src/core/types.ts:452

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`soundEnabled`](../../index/interfaces/BoardOptions.md#soundenabled)

***

### soundEventUrls?

> `optional` **soundEventUrls**: `Partial`\<`Record`\<[`BoardSoundEventType`](../../index/type-aliases/BoardSoundEventType.md), [`BoardSoundEventUrl`](../../index/type-aliases/BoardSoundEventUrl.md)\>\>

Defined in: src/core/types.ts:457

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`soundEventUrls`](../../index/interfaces/BoardOptions.md#soundeventurls)

***

### soundUrl?

> `optional` **soundUrl**: `string`

Defined in: src/core/types.ts:455

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`soundUrl`](../../index/interfaces/BoardOptions.md#soundurl)

***

### soundUrls?

> `optional` **soundUrls**: `Partial`\<`Record`\<`"white"` \| `"black"`, `string`\>\>

Defined in: src/core/types.ts:456

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`soundUrls`](../../index/interfaces/BoardOptions.md#soundurls)

***

### squareRenderer?

> `optional` **squareRenderer**: [`SquareRenderer`](../../index/type-aliases/SquareRenderer.md) \| `ReactSquareRenderer`

Defined in: src/react/NeoChessBoard.tsx:143

***

### squareStyle?

> `optional` **squareStyle**: [`SquareStyleOptions`](../../index/interfaces/SquareStyleOptions.md)

Defined in: src/core/types.ts:467

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`squareStyle`](../../index/interfaces/BoardOptions.md#squarestyle)

***

### squareStyles?

> `optional` **squareStyles**: `Partial`\<`Record`\<`` `${string}${number}` ``, [`SquareStyleOptions`](../../index/interfaces/SquareStyleOptions.md)\>\>

Defined in: src/core/types.ts:470

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`squareStyles`](../../index/interfaces/BoardOptions.md#squarestyles)

***

### style?

> `optional` **style**: `CSSProperties`

Defined in: src/react/NeoChessBoard.tsx:140

***

### theme?

> `optional` **theme**: `string` \| [`Theme`](../../index/interfaces/Theme.md)

Defined in: src/core/types.ts:423

#### Inherited from

[`BoardOptions`](../../index/interfaces/BoardOptions.md).[`theme`](../../index/interfaces/BoardOptions.md#theme)
