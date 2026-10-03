# SHIFT connected-device procurement gate

Use this before buying, white-labelling or integrating any BP monitor, heart-rate
wearable, scale, pulse-oximeter or other connected device.

A device is not integration-ready because it has Bluetooth.

## Required route into My Timber

At least one documented route must exist before commercial commitment:

1. The manufacturer's app writes the required readings to Apple Health and/or
   Health Connect; or
2. A supported vendor cloud API is contractually available to SHIFT; or
3. The manufacturer supplies a stable BLE GATT/protocol specification and permits
   SHIFT to integrate it directly.

Preference: both Apple Health and Health Connect. Direct BLE/API is the fallback
or premium route, not an excuse to duplicate an integration that the phone health
platform already provides.

## Evidence required from supplier

- Exact model/SKU and firmware.
- UK regulatory status appropriate to the product and claims.
- Apple Health data types actually written by the companion app.
- Health Connect record types actually written by the companion app.
- Whether background sync requires the manufacturer's app/account.
- BLE services/characteristics and protocol documentation if direct integration is offered.
- Vendor API documentation, authentication, rate limits, retention and commercial terms if cloud API is offered.
- Data-controller/processor roles and hosting locations for any vendor cloud.
- Account deletion/export behaviour.
- Firmware update and end-of-support policy.
- At least two physical samples for acceptance testing.

Marketing claims are not evidence of interoperability.

## Minimum My Timber mapping

BP monitor: systolic_mmhg + diastolic_mmhg; heart_rate_bpm when the device measures pulse.
Heart-rate wearable: heart_rate_bpm; resting_heart_rate_bpm where genuinely available.
Scale: weight_kg; body_fat_pct only where the device supplies it.
Pulse oximeter: oxygen_saturation_pct; heart_rate_bpm where supplied.
Sleep/activity wearable: steps, exercise_minutes, sleep_minutes and other agreed supported measures.

## Acceptance

Before launch, prove on physical iPhone and Android devices:
device reading -> source app/device -> Apple Health/Health Connect/direct SHIFT route
-> authenticated My Timber account -> Today/Progress display -> export -> erasure.

A manual screenshot of a reading is not acceptance evidence.
