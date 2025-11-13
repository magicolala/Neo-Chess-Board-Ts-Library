[**@magicolala/neo-chess-board**](../../README.md)

***

Defined in: src/clock/ClockManager.ts:59

## Constructors

### Constructor

> **new ClockManager**(`config`, `eventBus`): `ClockManager`

Defined in: src/clock/ClockManager.ts:68

#### Parameters

##### config

[`ClockConfig`](../interfaces/ClockConfig.md)

##### eventBus

[`EventBus`](EventBus.md)\<[`ClockEvents`](../interfaces/ClockEvents.md)\>

#### Returns

`ClockManager`

## Methods

### addTime()

> **addTime**(`color`, `milliseconds`): `void`

Defined in: src/clock/ClockManager.ts:204

#### Parameters

##### color

[`ClockColor`](../type-aliases/ClockColor.md)

##### milliseconds

`number`

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: src/clock/ClockManager.ts:279

#### Returns

`void`

***

### getState()

> **getState**(): [`ClockState`](../interfaces/ClockState.md)

Defined in: src/clock/ClockManager.ts:275

#### Returns

[`ClockState`](../interfaces/ClockState.md)

***

### pause()

> **pause**(): `void`

Defined in: src/clock/ClockManager.ts:119

#### Returns

`void`

***

### reset()

> **reset**(`configUpdate?`): `void`

Defined in: src/clock/ClockManager.ts:134

#### Parameters

##### configUpdate?

`Partial`\<[`ClockConfig`](../interfaces/ClockConfig.md)\>

#### Returns

`void`

***

### setTime()

> **setTime**(`color`, `milliseconds`): `void`

Defined in: src/clock/ClockManager.ts:174

#### Parameters

##### color

[`ClockColor`](../type-aliases/ClockColor.md)

##### milliseconds

`number`

#### Returns

`void`

***

### start()

> **start**(): `void`

Defined in: src/clock/ClockManager.ts:81

#### Returns

`void`

***

### switchActive()

> **switchActive**(): `void`

Defined in: src/clock/ClockManager.ts:228

#### Returns

`void`
