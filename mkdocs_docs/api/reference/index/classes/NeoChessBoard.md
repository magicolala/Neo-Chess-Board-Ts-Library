[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/core/NeoChessBoard.ts:214

## Constructors

### Constructor

> **new NeoChessBoard**(`root`, `options`): `NeoChessBoard`

Defined in: src/core/NeoChessBoard.ts:362

#### Parameters

##### root

`HTMLElement`

##### options

[`BoardOptions`](../interfaces/BoardOptions.md) = `{}`

#### Returns

`NeoChessBoard`

## Properties

### bus

> **bus**: [`EventBus`](EventBus.md)\<[`BoardEventMap`](../interfaces/BoardEventMap.md)\>

Defined in: src/core/NeoChessBoard.ts:216

***

### drawingManager

> **drawingManager**: `DrawingManager`

Defined in: src/core/NeoChessBoard.ts:295

***

### premove

> `readonly` **premove**: [`BoardPremoveController`](../interfaces/BoardPremoveController.md)

Defined in: src/core/NeoChessBoard.ts:310

## Methods

### addAnnotationsToCurrentMove()

> **addAnnotationsToCurrentMove**(`arrows`, `circles`, `comment`): `void`

Defined in: src/core/NeoChessBoard.ts:892

#### Parameters

##### arrows

[`Arrow`](../interfaces/Arrow.md)[] = `[]`

##### circles

[`SquareHighlight`](../interfaces/SquareHighlight.md)[] = `[]`

##### comment

`string` = `''`

#### Returns

`void`

***

### addArrow()

> **addArrow**(`arrow`): `void`

Defined in: src/core/NeoChessBoard.ts:1359

#### Parameters

##### arrow

[`Arrow`](../interfaces/Arrow.md) | \{ `color?`: `string`; `from`: `` `${string}${number}` ``; `to`: `` `${string}${number}` ``; \}

#### Returns

`void`

***

### addClockTime()

> **addClockTime**(`color`, `milliseconds`): `void`

Defined in: src/core/NeoChessBoard.ts:1547

#### Parameters

##### color

[`Color`](../type-aliases/Color.md)

##### milliseconds

`number`

#### Returns

`void`

***

### addHighlight()

> **addHighlight**(`square`, `type?`): `void`

Defined in: src/core/NeoChessBoard.ts:1386

#### Parameters

##### square

`` `${string}${number}` `` | [`SquareHighlight`](../interfaces/SquareHighlight.md)

##### type?

`string`

#### Returns

`void`

***

### applyTheme()

> **applyTheme**(`theme`): `void`

Defined in: src/core/NeoChessBoard.ts:1005

#### Parameters

##### theme

`string` | [`Theme`](../interfaces/Theme.md)

#### Returns

`void`

***

### attemptMove()

> **attemptMove**(`from`, `to`, `options`): `boolean`

Defined in: src/core/NeoChessBoard.ts:746

#### Parameters

##### from

`` `${string}${number}` ``

##### to

`` `${string}${number}` ``

##### options

###### promotion?

`"b"` \| `"r"` \| `"q"` \| `"n"`

#### Returns

`boolean`

***

### clearAllDrawings()

> **clearAllDrawings**(): `void`

Defined in: src/core/NeoChessBoard.ts:1434

#### Returns

`void`

***

### clearArrows()

> **clearArrows**(): `void`

Defined in: src/core/NeoChessBoard.ts:1379

#### Returns

`void`

***

### clearHighlights()

> **clearHighlights**(): `void`

Defined in: src/core/NeoChessBoard.ts:1404

#### Returns

`void`

***

### clearPremove()

> **clearPremove**(`color?`): `void`

Defined in: src/core/NeoChessBoard.ts:1420

#### Parameters

##### color?

[`PremoveColorOption`](../type-aliases/PremoveColorOption.md)

#### Returns

`void`

***

### clearPromotionPreview()

> **clearPromotionPreview**(): `void`

Defined in: src/core/NeoChessBoard.ts:1473

#### Returns

`void`

***

### configure()

> **configure**(`configuration`): `void`

Defined in: src/core/NeoChessBoard.ts:1056

#### Parameters

##### configuration

[`BoardConfiguration`](../interfaces/BoardConfiguration.md)

#### Returns

`void`

***

### convertMoveNotation()

> **convertMoveNotation**(`notation`, `from`, `to`): `string` \| `null`

Defined in: src/core/NeoChessBoard.ts:908

#### Parameters

##### notation

`string`

##### from

[`MoveNotation`](../type-aliases/MoveNotation.md)

##### to

[`MoveNotation`](../type-aliases/MoveNotation.md)

#### Returns

`string` \| `null`

***

### coordinatesToSan()

> **coordinatesToSan**(`coordinates`): `string` \| `null`

Defined in: src/core/NeoChessBoard.ts:961

#### Parameters

##### coordinates

`string`

#### Returns

`string` \| `null`

***

### coordinatesToUci()

> **coordinatesToUci**(`coordinates`): `string` \| `null`

Defined in: src/core/NeoChessBoard.ts:965

#### Parameters

##### coordinates

`string`

#### Returns

`string` \| `null`

***

### destroy()

> **destroy**(): `void`

Defined in: src/core/NeoChessBoard.ts:1596

#### Returns

`void`

***

### exportDrawings()

> **exportDrawings**(): `string` \| `null`

Defined in: src/core/NeoChessBoard.ts:1443

#### Returns

`string` \| `null`

***

### exportPGN()

> **exportPGN**(`options`): `string`

Defined in: src/core/NeoChessBoard.ts:794

#### Parameters

##### options

###### includeComments?

`boolean`

###### includeHeaders?

`boolean`

#### Returns

`string`

***

### exportPgnWithAnnotations()

> **exportPgnWithAnnotations**(): `string`

Defined in: src/core/NeoChessBoard.ts:884

#### Returns

`string`

***

### getClockState()

> **getClockState**(): [`ClockState`](../interfaces/ClockState.md) \| `null`

Defined in: src/core/NeoChessBoard.ts:1498

#### Returns

[`ClockState`](../interfaces/ClockState.md) \| `null`

***

### getCurrentFEN()

> **getCurrentFEN**(): `string`

Defined in: src/core/NeoChessBoard.ts:574

#### Returns

`string`

***

### getLastPgnLoadIssues()

> **getLastPgnLoadIssues**(): readonly [`PgnParseError`](PgnParseError.md)[]

Defined in: src/core/NeoChessBoard.ts:851

#### Returns

readonly [`PgnParseError`](PgnParseError.md)[]

***

### getMoveHistory()

> **getMoveHistory**(): `string`[]

Defined in: src/core/NeoChessBoard.ts:626

#### Returns

`string`[]

***

### getOrientation()

> **getOrientation**(): `"white"` \| `"black"`

Defined in: src/core/NeoChessBoard.ts:588

#### Returns

`"white"` \| `"black"`

***

### getPendingPromotion()

> **getPendingPromotion**(): `PendingPromotionSummary` \| `null`

Defined in: src/core/NeoChessBoard.ts:1485

#### Returns

`PendingPromotionSummary` \| `null`

***

### getPieceAt()

> **getPieceAt**(`square`): `string` \| `null`

Defined in: src/core/NeoChessBoard.ts:596

#### Parameters

##### square

`` `${string}${number}` ``

#### Returns

`string` \| `null`

***

### getPieceSquares()

> **getPieceSquares**(`piece`): `` `${string}${number}` ``[]

Defined in: src/core/NeoChessBoard.ts:609

Returns every square currently occupied by the requested piece.

The `piece` parameter must use FEN notation: uppercase letters (`K`, `Q`, `R`, `B`, `N`, `P`)
target white pieces while their lowercase counterparts (`k`, `q`, `r`, `b`, `n`, `p`) target
black pieces. The resulting array is sorted from the lowest rank/file combination (for
example `a1`) up to the highest (such as `h8`) to provide a stable order for assertions and
deterministic rendering helpers.

#### Parameters

##### piece

[`Piece`](../type-aliases/Piece.md)

#### Returns

`` `${string}${number}` ``[]

***

### getPosition()

> **getPosition**(): `string`

Defined in: src/core/NeoChessBoard.ts:570

#### Returns

`string`

***

### getPremove()

> **getPremove**(): [`Premove`](../interfaces/Premove.md) \| `null`

Defined in: src/core/NeoChessBoard.ts:1430

#### Returns

[`Premove`](../interfaces/Premove.md) \| `null`

***

### getRootElement()

> **getRootElement**(): `HTMLElement`

Defined in: src/core/NeoChessBoard.ts:578

#### Returns

`HTMLElement`

***

### getTurn()

> **getTurn**(): `"w"` \| `"b"`

Defined in: src/core/NeoChessBoard.ts:592

#### Returns

`"w"` \| `"b"`

***

### importDrawings()

> **importDrawings**(`state`): `void`

Defined in: src/core/NeoChessBoard.ts:1447

#### Parameters

##### state

`string`

#### Returns

`void`

***

### isDraw()

> **isDraw**(): `boolean`

Defined in: src/core/NeoChessBoard.ts:633

#### Returns

`boolean`

***

### isInsufficientMaterial()

> **isInsufficientMaterial**(): `boolean`

Defined in: src/core/NeoChessBoard.ts:637

#### Returns

`boolean`

***

### isPromotionPending()

> **isPromotionPending**(): `boolean`

Defined in: src/core/NeoChessBoard.ts:1481

#### Returns

`boolean`

***

### isThreefoldRepetition()

> **isThreefoldRepetition**(): `boolean`

Defined in: src/core/NeoChessBoard.ts:641

#### Returns

`boolean`

***

### loadFEN()

> **loadFEN**(`fen`, `immediate`): `void`

Defined in: src/core/NeoChessBoard.ts:658

#### Parameters

##### fen

`string`

##### immediate

`boolean` = `true`

#### Returns

`void`

***

### loadPgnWithAnnotations()

> **loadPgnWithAnnotations**(`pgnString`): `boolean`

Defined in: src/core/NeoChessBoard.ts:821

#### Parameters

##### pgnString

`string`

#### Returns

`boolean`

***

### loadPosition()

> **loadPosition**(`fen`, `immediate`): `void`

Defined in: src/core/NeoChessBoard.ts:653

#### Parameters

##### fen

`string`

##### immediate

`boolean` = `true`

#### Returns

`void`

***

### on()

> **on**\<`K`\>(`event`, `handler`): () => `void`

Defined in: src/core/NeoChessBoard.ts:1555

#### Type Parameters

##### K

`K` *extends* keyof [`BoardEventMap`](../interfaces/BoardEventMap.md)

#### Parameters

##### event

`K`

##### handler

(`payload`) => `void`

#### Returns

> (): `void`

##### Returns

`void`

***

### pauseClock()

> **pauseClock**(): `void`

Defined in: src/core/NeoChessBoard.ts:1506

#### Returns

`void`

***

### previewPromotionPiece()

> **previewPromotionPiece**(`piece`): `void`

Defined in: src/core/NeoChessBoard.ts:1459

#### Parameters

##### piece

`"b"` | `"r"` | `"q"` | `"n"` | `null`

#### Returns

`void`

***

### registerExtensionPoint()

> **registerExtensionPoint**\<`K`\>(`extensionId`, `event`, `handler`): () => `void`

Defined in: src/core/NeoChessBoard.ts:1562

#### Type Parameters

##### K

`K` *extends* keyof [`BoardEventMap`](../interfaces/BoardEventMap.md)

#### Parameters

##### extensionId

`string`

##### event

`K`

##### handler

(`payload`) => `void`

#### Returns

> (): `void`

##### Returns

`void`

***

### removeArrow()

> **removeArrow**(`from`, `to`): `void`

Defined in: src/core/NeoChessBoard.ts:1372

#### Parameters

##### from

`` `${string}${number}` ``

##### to

`` `${string}${number}` ``

#### Returns

`void`

***

### removeHighlight()

> **removeHighlight**(`square`): `void`

Defined in: src/core/NeoChessBoard.ts:1397

#### Parameters

##### square

`` `${string}${number}` ``

#### Returns

`void`

***

### renderAll()

> **renderAll**(): `void`

Defined in: src/core/NeoChessBoard.ts:1586

#### Returns

`void`

***

### reset()

> **reset**(`immediate`): `void`

Defined in: src/core/NeoChessBoard.ts:662

#### Parameters

##### immediate

`boolean` = `true`

#### Returns

`void`

***

### resetClock()

> **resetClock**(`config?`): `void`

Defined in: src/core/NeoChessBoard.ts:1510

#### Parameters

##### config?

`Partial`\<[`ClockConfig`](../interfaces/ClockConfig.md)\> | `null`

#### Returns

`void`

***

### resize()

> **resize**(): `void`

Defined in: src/core/NeoChessBoard.ts:1578

#### Returns

`void`

***

### sanToCoordinates()

> **sanToCoordinates**(`san`): `string` \| `null`

Defined in: src/core/NeoChessBoard.ts:949

#### Parameters

##### san

`string`

#### Returns

`string` \| `null`

***

### sanToUci()

> **sanToUci**(`san`): `string` \| `null`

Defined in: src/core/NeoChessBoard.ts:945

#### Parameters

##### san

`string`

#### Returns

`string` \| `null`

***

### setAllowDragOffBoard()

> **setAllowDragOffBoard**(`allow`): `void`

Defined in: src/core/NeoChessBoard.ts:1183

#### Parameters

##### allow

`boolean`

#### Returns

`void`

***

### setAllowDrawingArrows()

> **setAllowDrawingArrows**(`allow`): `void`

Defined in: src/core/NeoChessBoard.ts:1326

#### Parameters

##### allow

`boolean`

#### Returns

`void`

***

### setAllowPremoves()

> **setAllowPremoves**(`allow`): `void`

Defined in: src/core/NeoChessBoard.ts:1304

#### Parameters

##### allow

`boolean`

#### Returns

`void`

***

### setAlphaNotationStyle()

> **setAlphaNotationStyle**(`style?`): `void`

Defined in: src/core/NeoChessBoard.ts:1262

#### Parameters

##### style?

[`NotationStyleOptions`](../interfaces/NotationStyleOptions.md)

#### Returns

`void`

***

### setAnimation()

> **setAnimation**(`animation`): `void`

Defined in: src/core/NeoChessBoard.ts:1129

#### Parameters

##### animation

[`BoardAnimationConfig`](../interfaces/BoardAnimationConfig.md) | `undefined`

#### Returns

`void`

***

### setAnimationDuration()

> **setAnimationDuration**(`duration`): `void`

Defined in: src/core/NeoChessBoard.ts:1122

#### Parameters

##### duration

`number` | `undefined`

#### Returns

`void`

***

### setArrowOptions()

> **setArrowOptions**(`options?`): `void`

Defined in: src/core/NeoChessBoard.ts:1336

#### Parameters

##### options?

[`ArrowStyleOptions`](../interfaces/ArrowStyleOptions.md)

#### Returns

`void`

***

### setArrows()

> **setArrows**(`arrows`): `void`

Defined in: src/core/NeoChessBoard.ts:1342

#### Parameters

##### arrows

[`Arrow`](../interfaces/Arrow.md)[] | `undefined`

#### Returns

`void`

***

### setAutoFlip()

> **setAutoFlip**(`autoFlip`): `void`

Defined in: src/core/NeoChessBoard.ts:1115

#### Parameters

##### autoFlip

`boolean`

#### Returns

`void`

***

### setAutoScrollEnabled()

> **setAutoScrollEnabled**(`allow`): `void`

Defined in: src/core/NeoChessBoard.ts:1187

#### Parameters

##### allow

`boolean`

#### Returns

`void`

***

### setBoardId()

> **setBoardId**(`id?`): `void`

Defined in: src/core/NeoChessBoard.ts:1211

#### Parameters

##### id?

`string`

#### Returns

`void`

***

### setBoardStyle()

> **setBoardStyle**(`style?`): `void`

Defined in: src/core/NeoChessBoard.ts:1207

#### Parameters

##### style?

[`InlineStyle`](../type-aliases/InlineStyle.md)

#### Returns

`void`

***

### setCanDragPiece()

> **setCanDragPiece**(`evaluator`): `void`

Defined in: src/core/NeoChessBoard.ts:1196

#### Parameters

##### evaluator

(`params`) => `boolean` | `undefined`

#### Returns

`void`

***

### setClearArrowsOnClick()

> **setClearArrowsOnClick**(`clear`): `void`

Defined in: src/core/NeoChessBoard.ts:1331

#### Parameters

##### clear

`boolean`

#### Returns

`void`

***

### setClockTime()

> **setClockTime**(`color`, `milliseconds`): `void`

Defined in: src/core/NeoChessBoard.ts:1543

#### Parameters

##### color

[`Color`](../type-aliases/Color.md)

##### milliseconds

`number`

#### Returns

`void`

***

### setDarkSquareNotationStyle()

> **setDarkSquareNotationStyle**(`style?`): `void`

Defined in: src/core/NeoChessBoard.ts:1256

#### Parameters

##### style?

[`NotationStyleOptions`](../interfaces/NotationStyleOptions.md)

#### Returns

`void`

***

### setDarkSquareStyle()

> **setDarkSquareStyle**(`style?`): `void`

Defined in: src/core/NeoChessBoard.ts:1230

#### Parameters

##### style?

[`SquareStyleOptions`](../interfaces/SquareStyleOptions.md)

#### Returns

`void`

***

### setDragActivationDistance()

> **setDragActivationDistance**(`distance`): `void`

Defined in: src/core/NeoChessBoard.ts:1200

#### Parameters

##### distance

`number`

#### Returns

`void`

***

### setDraggingEnabled()

> **setDraggingEnabled**(`enabled`): `void`

Defined in: src/core/NeoChessBoard.ts:1170

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

***

### setFEN()

> **setFEN**(`fen`, `immediate`): `void`

Defined in: src/core/NeoChessBoard.ts:668

#### Parameters

##### fen

`string`

##### immediate

`boolean` = `false`

#### Returns

`void`

***

### setHighlightLegal()

> **setHighlightLegal**(`highlight`): `void`

Defined in: src/core/NeoChessBoard.ts:1313

#### Parameters

##### highlight

`boolean`

#### Returns

`void`

***

### setLightSquareNotationStyle()

> **setLightSquareNotationStyle**(`style?`): `void`

Defined in: src/core/NeoChessBoard.ts:1250

#### Parameters

##### style?

[`NotationStyleOptions`](../interfaces/NotationStyleOptions.md)

#### Returns

`void`

***

### setLightSquareStyle()

> **setLightSquareStyle**(`style?`): `void`

Defined in: src/core/NeoChessBoard.ts:1225

#### Parameters

##### style?

[`SquareStyleOptions`](../interfaces/SquareStyleOptions.md)

#### Returns

`void`

***

### setNumericNotationStyle()

> **setNumericNotationStyle**(`style?`): `void`

Defined in: src/core/NeoChessBoard.ts:1268

#### Parameters

##### style?

[`NotationStyleOptions`](../interfaces/NotationStyleOptions.md)

#### Returns

`void`

***

### setOnArrowsChange()

> **setOnArrowsChange**(`handler?`): `void`

Defined in: src/core/NeoChessBoard.ts:1351

#### Parameters

##### handler?

(`arrows`) => `void`

#### Returns

`void`

***

### setOrientation()

> **setOrientation**(`orientation`): `void`

Defined in: src/core/NeoChessBoard.ts:1031

#### Parameters

##### orientation

`"white"` | `"black"`

#### Returns

`void`

***

### setPieceRenderers()

> **setPieceRenderers**(`renderers?`): `void`

Defined in: src/core/NeoChessBoard.ts:1286

#### Parameters

##### renderers?

`Partial`\<`Record`\<[`Piece`](../type-aliases/Piece.md), [`PieceRenderer`](../type-aliases/PieceRenderer.md)\>\>

#### Returns

`void`

***

### setPieceSet()

> **setPieceSet**(`pieceSet?`): `Promise`\<`void`\>

Defined in: src/core/NeoChessBoard.ts:1018

#### Parameters

##### pieceSet?

[`PieceSet`](../interfaces/PieceSet.md) | `null`

#### Returns

`Promise`\<`void`\>

***

### setPosition()

> **setPosition**(`fen`, `immediate`): `void`

Defined in: src/core/NeoChessBoard.ts:649

#### Parameters

##### fen

`string`

##### immediate

`boolean` = `false`

#### Returns

`void`

***

### setPremove()

> **setPremove**(`premove`, `color?`): `void`

Defined in: src/core/NeoChessBoard.ts:1411

#### Parameters

##### premove

[`Premove`](../interfaces/Premove.md)

##### color?

[`ColorInput`](../type-aliases/ColorInput.md)

#### Returns

`void`

***

### setRenderObserver()

> **setRenderObserver**(`observer`): `void`

Defined in: src/core/NeoChessBoard.ts:582

#### Parameters

##### observer

[`RenderObserver`](../type-aliases/RenderObserver.md) | `null`

#### Returns

`void`

***

### setShowAnimations()

> **setShowAnimations**(`show`): `void`

Defined in: src/core/NeoChessBoard.ts:1151

#### Parameters

##### show

`boolean`

#### Returns

`void`

***

### setShowArrows()

> **setShowArrows**(`show`): `void`

Defined in: src/core/NeoChessBoard.ts:1294

#### Parameters

##### show

`boolean`

#### Returns

`void`

***

### setShowHighlights()

> **setShowHighlights**(`show`): `void`

Defined in: src/core/NeoChessBoard.ts:1299

#### Parameters

##### show

`boolean`

#### Returns

`void`

***

### setShowNotation()

> **setShowNotation**(`show`): `void`

Defined in: src/core/NeoChessBoard.ts:1274

#### Parameters

##### show

`boolean`

#### Returns

`void`

***

### setShowSquareNames()

> **setShowSquareNames**(`show`): `void`

Defined in: src/core/NeoChessBoard.ts:1318

#### Parameters

##### show

`boolean`

#### Returns

`void`

***

### setSoundEnabled()

> **setSoundEnabled**(`enabled`): `void`

Defined in: src/core/NeoChessBoard.ts:1043

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

***

### setSoundEventUrls()

> **setSoundEventUrls**(`soundEventUrls`): `void`

Defined in: src/core/NeoChessBoard.ts:1052

#### Parameters

##### soundEventUrls

`Partial`\<`Record`\<[`BoardSoundEventType`](../type-aliases/BoardSoundEventType.md), [`BoardSoundEventUrl`](../type-aliases/BoardSoundEventUrl.md)\>\> | `undefined`

#### Returns

`void`

***

### setSoundUrls()

> **setSoundUrls**(`soundUrls`): `void`

Defined in: src/core/NeoChessBoard.ts:1048

#### Parameters

##### soundUrls

`Partial`\<`Record`\<`"white"` \| `"black"`, `string`\>\> | `undefined`

#### Returns

`void`

***

### setSquareRenderer()

> **setSquareRenderer**(`renderer?`): `void`

Defined in: src/core/NeoChessBoard.ts:1278

#### Parameters

##### renderer?

[`SquareRenderer`](../type-aliases/SquareRenderer.md)

#### Returns

`void`

***

### setSquareStyle()

> **setSquareStyle**(`style?`): `void`

Defined in: src/core/NeoChessBoard.ts:1220

#### Parameters

##### style?

[`SquareStyleOptions`](../interfaces/SquareStyleOptions.md)

#### Returns

`void`

***

### setSquareStyles()

> **setSquareStyles**(`styles?`): `void`

Defined in: src/core/NeoChessBoard.ts:1235

#### Parameters

##### styles?

`Partial`\<`Record`\<`` `${string}${number}` ``, [`SquareStyleOptions`](../interfaces/SquareStyleOptions.md)\>\>

#### Returns

`void`

***

### setTheme()

> **setTheme**(`theme`): `void`

Defined in: src/core/NeoChessBoard.ts:973

#### Parameters

##### theme

`string` | `Partial`\<[`Theme`](../interfaces/Theme.md)\>

#### Returns

`void`

***

### showPgnAnnotationsForPly()

> **showPgnAnnotationsForPly**(`ply`): `boolean`

Defined in: src/core/NeoChessBoard.ts:855

#### Parameters

##### ply

`number`

#### Returns

`boolean`

***

### startClock()

> **startClock**(): `void`

Defined in: src/core/NeoChessBoard.ts:1502

#### Returns

`void`

***

### submitMove()

> **submitMove**(`notation`): `boolean`

Defined in: src/core/NeoChessBoard.ts:707

#### Parameters

##### notation

`string`

#### Returns

`boolean`

***

### uciToCoordinates()

> **uciToCoordinates**(`uci`): `string` \| `null`

Defined in: src/core/NeoChessBoard.ts:957

#### Parameters

##### uci

`string`

#### Returns

`string` \| `null`

***

### uciToSan()

> **uciToSan**(`uci`): `string` \| `null`

Defined in: src/core/NeoChessBoard.ts:953

#### Parameters

##### uci

`string`

#### Returns

`string` \| `null`

***

### undoMove()

> **undoMove**(`immediate`): `boolean`

Defined in: src/core/NeoChessBoard.ts:755

#### Parameters

##### immediate

`boolean` = `false`

#### Returns

`boolean`
