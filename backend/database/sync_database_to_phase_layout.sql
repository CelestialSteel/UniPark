\
set ON_ERROR_STOP on BEGIN;
\ ir update_parking_zones.sql \ ir cleanup_legacy_zones.sql COMMIT;
\ echo 'Zone alignment verification:' \ ir verify_zone_alignment.sql