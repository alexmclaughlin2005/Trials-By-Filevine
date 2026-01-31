# Personas Data

**Purpose:** V2 persona data and documentation for the Trials by Filevine persona system.

**Last Updated:** January 31, 2026

---

## Structure

```
personas/
├── data/           # V2 persona JSON files (authoritative)
│   ├── archetype_master_reference.json
│   ├── bootstrappers.json
│   ├── calculators.json
│   ├── captains.json
│   ├── chameleons.json
│   ├── crusaders.json
│   ├── hearts.json
│   ├── mavericks.json
│   ├── scale_balancers.json
│   ├── scarred.json
│   ├── trojan_horses.json
│   └── simulation_config.json
├── docs/           # Persona documentation
│   ├── ENGINEERING_HANDOFF.md
│   ├── juror_profile_framework.md
│   ├── juror_personas_seed_data.md
│   └── ... (headshot docs, etc.)
└── README.md       # This file
```

## V2 Format

The V2 persona format uses:
- `id` field (e.g., `BOOT_01`)
- `name` field (e.g., `Bootstrap Bob`)
- Simpler structure with taglines and instant_read fields
- 10 archetypes with multiple personas each

## Usage

Persona data is loaded into the database via:
1. Import scripts in `scripts/`
2. Admin UI persona import
3. Seed data during deployment

See `docs/PERSONA_V2_IMPORT_GUIDE.md` for import instructions.

---

## V1 Deprecation

**V1 personas are deprecated.** The V1 format has been archived.

### V1 Archive Location
- `docs/archive/features/personas-v1/` - V1 JSON data files

### Full Deprecation Checklist

To fully remove V1 from the codebase:

1. **Database Migration**
   - [ ] Verify all database personas use V2 format
   - [ ] Run migration to update any remaining V1 references
   - [ ] Update `jsonPersonaId` field to use V2 IDs

2. **Code Cleanup**
   - [ ] Search codebase for V1 ID patterns (`BOOT_1.1_*`, `persona_id`)
   - [ ] Update any hardcoded V1 references to V2 format
   - [ ] Remove V1 parsing logic from import scripts
   - [ ] Update `persona-image-utils.ts` to remove V1 fallback

3. **Testing**
   - [ ] Test persona import with V2 data only
   - [ ] Verify persona matching uses V2 IDs
   - [ ] Test image generation with V2 personas
   - [ ] Verify focus group simulations work with V2

4. **Documentation**
   - [ ] Update AI_instructions.md to remove V1 references
   - [ ] Update any API docs referencing V1 format

5. **Final Cleanup**
   - [ ] Delete archived V1 files if no longer needed
   - [ ] Remove this deprecation section from README

### Key Differences: V1 vs V2

| Aspect | V1 (Deprecated) | V2 (Current) |
|--------|-----------------|--------------|
| ID format | `BOOT_1.1_GaryHendricks` | `BOOT_01` |
| Name field | `full_name` | `name` |
| ID field | `persona_id` | `id` |
| Dimensions | `archetype_centroids` object | Simplified |
| File location | `Juror Personas/generated/` | `personas/data/` |

---

## Related Documentation

- [docs/features/personas/](../docs/features/personas/) - Persona feature documentation
- [docs/PERSONA_V2_IMPORT_GUIDE.md](../docs/PERSONA_V2_IMPORT_GUIDE.md) - Import guide
- [docs/ACCESSING_PERSONAS.md](../docs/ACCESSING_PERSONAS.md) - Usage guide
