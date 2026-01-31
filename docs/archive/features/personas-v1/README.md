# Personas V1 Archive (Deprecated)

**Archive Date:** January 31, 2026
**Status:** DEPRECATED - Do not use for new development

---

## Why Archived

V1 personas have been superseded by the V2 format. The V2 format is:
- Simpler and more maintainable
- Uses cleaner ID format (`BOOT_01` vs `BOOT_1.1_GaryHendricks`)
- Better integrated with image generation
- The authoritative format for all new development

## Contents

10 archetype JSON files in V1 format:
- `bootstrappers.json`
- `calculators.json`
- `captains.json`
- `chameleons.json`
- `crusaders.json`
- `hearts.json`
- `mavericks.json`
- `scale_balancers.json`
- `scarreds.json`
- `trojan_horses.json`

## V1 Format Reference

```json
{
  "archetype": "bootstrapper",
  "archetype_display_name": "The Bootstrapper",
  "archetype_centroids": {
    "attribution_orientation": 1.5,
    "just_world_belief": 4.5,
    // ... detailed psychological dimensions
  },
  "personas": [
    {
      "persona_id": "BOOT_1.1_GaryHendricks",
      "full_name": "Gary Hendricks",
      "nickname": "Gary",
      // ...
    }
  ]
}
```

## Migration to V2

See `personas/README.md` for the V1 deprecation checklist and migration instructions.

## When to Reference

Only reference these files if:
- Debugging legacy persona issues
- Understanding historical persona structure
- Migrating old data to V2 format

**For all new development, use V2 personas in `personas/data/`**
