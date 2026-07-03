# UniPark Zone Sync Guide (For Team Members)

This guide helps you make your local UniPark database match the current shared zone layout.

It also records the driver identity field used at sign-up so team members can keep the database and driver profile aligned when user-account data changes.

Target zone layout:
- Phase 1 (PH1)
- Phase 2 (PH2)
- SBS Lot (SBS)
- Sports Complex Lot (SCL)
- Library Lot (P2LIB)
- Graduation Square (P2GRAD)
- MSB Lot (P2MSB)
- Engineering Lot (P2ENG)
- Gate E Lot (P2GATEE)

This sync process is idempotent:
- Safe to run multiple times
- Updates existing zone rows by zone_code
- Removes legacy mock zones only

Legacy mock zones that are removed:
- North Campus A (NCA)
- North Campus B (NCB)
- South Campus (SCA)
- East Campus (ECA)
- West Campus (WCA)

## Driver Sign-Up ID

The sign-up form collects a university ID number for driver accounts.

Database mapping:
- Students store the value in `drivers.student_id`
- Lecturers store the value in `drivers.faculty_id`
- Future staff accounts can use `drivers.staff_id`

Frontend display:
- The driver profile shows the same ID value in the Personal Information card
- If no ID has been saved yet, the profile shows `Not set`

## Files Included

- backend/database/sync_database_to_phase_layout.sql
- backend/database/update_parking_zones.sql
- backend/database/cleanup_legacy_zones.sql
- backend/database/verify_zone_alignment.sql

## Option A: Run From Command Prompt / PowerShell

From repository root:

psql -U user -d unipark_db -v ON_ERROR_STOP=1 -f backend/database/sync_database_to_phase_layout.sql

If your postgres role is different, replace user with your own role.

## Option B: Run Inside psql

1) Connect:

psql -U user -d unipark_db

2) Run using absolute path with forward slashes:

\i UniPark/backend/database/sync_database_to_phase_layout.sql

## Verify

After running, verify zones:

psql -U user -d unipark_db -f backend/database/verify_zone_alignment.sql

Expected outcome:
- 9 expected zones present
- 0 unexpected zones

## If You Get Errors

- Check you are connected to the correct database: unipark_db
- Ensure you have permission to update and delete rows in parking tables
- If using psql interactive mode, use forward slashes in file paths
- If psql prompt shows unipark_db->, run this first to reset pending input:

\r

## Notes

- This guide only aligns parking zones and related zone-linked mock data.
- It does not recreate the full schema.
- It does not remove user, driver, or vehicle records except where directly related to deleted legacy zones.
- Driver sign-up identity fields are stored on the `drivers` table, not the `users` table.
