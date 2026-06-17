# University Parking Management System - Database Setup Guide

## Quick Start

### 1. Prerequisites
- PostgreSQL 12+ installed and running
- psql command-line tool available
- Administrative access to create databases and users

### 2. Initial Setup

```bash
# Connect to PostgreSQL as admin
psql -U postgres

# Create database
CREATE DATABASE unipark_db ENCODING 'UTF8';

# Create application user
CREATE USER app_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE unipark_db TO app_user;

# Exit psql
\q
```

### 3. Load Schema

```bash
# Connect to the database
psql -U app_user -d unipark_db

# Load the main schema
\i schema.sql

# Load functions and triggers
\i triggers_and_functions.sql

# Load sample data (optional, for development)
\i sample_queries.sql

# Verify setup
\dt            # List all tables
\df            # List all functions
\dv            # List all views

# Exit psql
\q
```

### 4. Verify Installation

```bash
# Run verification queries
psql -U app_user -d unipark_db -f database_initialization.sql
```

---

## File Structure

```
backend/
├── database/
│   ├── schema.sql                          # Main schema (tables, enums, indexes)
│   ├── triggers_and_functions.sql          # Triggers, functions, and procedures
│   ├── sample_queries.sql                  # Sample data and common queries
│   ├── database_initialization.sql         # Setup verification and maintenance
│   ├── DATABASE_SCHEMA_DOCUMENTATION.md    # Full schema documentation
│   └── README.md                           # This file
```

---

## Table Overview

### Core Tables (13 total)

| Table | Purpose | Rows* |
|-------|---------|-------|
| `users` | All system users (admin, security, driver) | 3-1000+ |
| `drivers` | Campus goers/drivers | Same as users with role='driver' |
| `vehicles` | Registered vehicles | 2+ per driver |
| `parking_zones` | Campus parking areas | 5-20 |
| `parking_spaces` | Individual spots | 50-500 |
| `vehicle_logs` | Entry/exit audit trail | Grows with usage |
| `alerts` | Zone-level alerts/notifications | 5-50 |
| `infringements` | Parking violations | Variable |
| `notifications` | User notifications | Grows with usage |
| `reservations` | Reserved spaces | 0-100 |
| `zone_occupancy_history` | Analytics history | Grows over time |
| `audit_logs` | System activity log | Grows with usage |

*Row counts are approximate for a medium-sized university

---

## User Roles & Permissions

### ADMIN
- Create/modify parking zones
- Cordone off spaces/zones
- Reserve spaces
- View analytics
- Process infringements
- Send notifications

### SECURITY
- Register new vehicles
- Update zone spot counts
- Report infringements
- Log vehicle entry/exit
- View zone status

### DRIVER
- Link/unlink vehicles
- View available zones
- See zone alerts
- View own infringements
- View own notifications

---

## Key Business Constraints

### Vehicle Rules
```
✓ Each driver must have at least ONE primary vehicle
✓ Drivers can have multiple vehicles
✗ No vehicle can be registered under TWO different drivers
✓ Security registers vehicles when they appear at gate
✓ Drivers can link/unlink additional vehicles
```

### Parking Space Rules
```
✓ Spaces can be: available, occupied, reserved, cordoned, maintenance
✓ Admin can cordone off individual spaces or entire zones
✓ Admin can reserve spaces for specific drivers
✓ System auto-updates space counts as vehicles enter/exit
✓ All vehicle movements are logged
```

### Infringement Rules
```
✓ Security can flag infringements
✓ Infringements auto-notify driver
✓ Admin processes infringements
✓ Driver can view their infringements
✓ System can track appeals
```

---

## Common Queries

### For Drivers
```sql
-- Find available parking zones
SELECT * FROM zone_current_occupancy
WHERE occupancy_percentage < 85
ORDER BY occupancy_percentage;

-- View my vehicles
SELECT * FROM vehicles
WHERE driver_id = 'driver_uuid'
AND is_active = true;

-- View my infringements
SELECT * FROM active_infringements
WHERE driver_user_id = 'user_uuid'
ORDER BY reported_at DESC;
```

### For Security
```sql
-- Register a new vehicle
INSERT INTO vehicles (...) VALUES (...)
WHERE registered_by_user_id = 'security_uuid';

-- Report an infringement
INSERT INTO infringements (...) VALUES (...)
WHERE reported_by_user_id = 'security_uuid';

-- View current zone occupancy
SELECT * FROM zone_current_occupancy;
```

### For Admin
```sql
-- View analytics
SELECT * FROM zone_occupancy_history
WHERE recorded_at > NOW() - INTERVAL '7 days'
ORDER BY recorded_at DESC;

-- Process infringement
UPDATE infringements
SET status = 'resolved', processed_by_user_id = 'admin_uuid'
WHERE id = 'infringement_uuid';
```

---

## Database Performance Tuning

### Indexes
All critical columns are pre-indexed for optimal performance:
- User lookups: `email`, `role`
- Vehicle lookups: `driver_id`, `registration_number`
- Space queries: `zone_id`, `status`
- Log queries: `vehicle_id`, `entry_time`
- Infringement queries: `driver_id`, `status`

### Query Optimization Tips
1. Always filter by `status` before other conditions
2. Use zone views for occupancy queries
3. Limit historical data queries to reasonable date ranges
4. Use pagination for large result sets (vehicle logs, infringements)

---

## Backup & Recovery

### Manual Backup
```bash
# Full database backup
pg_dump -U app_user -d unipark_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup (smaller file size)
pg_dump -U app_user -d unipark_db | gzip > backup.sql.gz
```

### Restore from Backup
```bash
# Full restore
psql -U app_user -d unipark_db < backup.sql

# From compressed backup
gunzip < backup.sql.gz | psql -U app_user -d unipark_db
```

### Automated Backup (Linux Cron)
```bash
# Daily backup at 2 AM
0 2 * * * pg_dump -U app_user -d unipark_db > /backups/unipark_$(date +\%Y\%m\%d).sql

# Keep backups for 30 days
0 3 * * * find /backups -name "unipark_*.sql" -mtime +30 -delete
```

---

## Troubleshooting

### Issue: Cannot connect to database
```bash
# Check postgresql service is running
sudo systemctl status postgresql

# Check connection with verbose output
psql -U app_user -d unipark_db -v ON_ERROR_STOP=1
```

### Issue: "Permission denied" errors
```sql
-- Re-grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Check current permissions
\dp                    -- For tables/views
\dft                   -- For functions
```

### Issue: Database locked/slow queries
```sql
-- Find long-running queries
SELECT pid, usename, query_start, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY query_start;

-- Kill a specific query (use carefully!)
SELECT pg_terminate_backend(pid);

-- Vacuum and analyze
VACUUM ANALYZE;
```

### Issue: Trigger not firing or infinite loop
```sql
-- Check trigger status
SELECT * FROM pg_trigger
WHERE tgrelname = 'table_name';

-- Check if trigger function exists and is valid
SELECT proname FROM pg_proc
WHERE proname LIKE '%trigger_name%';

-- Re-create trigger with debug output
-- (see triggers_and_functions.sql for examples)
```

---

## Database Maintenance Schedule

### Daily (Automated)
```sql
-- Vacuum (reclaim disk space)
VACUUM ANALYZE;

-- Clear old audit logs (> 1 year)
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Weekly (Manual Review)
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('unipark_db'));

-- Check largest tables
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname='public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check indexes
SELECT schemaname, indexname, 
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_indexes
WHERE schemaname='public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Monthly (Performance Review)
```sql
-- Top 10 slowest queries
SELECT mean_time, calls, query
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Reset stats to get fresh data
SELECT pg_stat_statements_reset();
```

### Quarterly (Full Review)
- Test backup/restore procedures
- Review and archive old audit logs
- Check storage capacity
- Review security access logs
- Performance baseline comparison

---

## Environment Variables (.env)

Set these for backend application:

```env
# Database Connection
DATABASE_URL=postgresql://app_user:password@localhost:5432/unipark_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=unipark_db
DB_USER=app_user
DB_PASSWORD=your_secure_password

# Connection Pooling
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=900

# Logging
DB_LOG_QUERIES=false
DB_LOG_SLOW_QUERIES_MS=1000
```

---

## API Integration

Backend APIs should use these patterns:

### Connection Pool
```python
# Python/SQLAlchemy example
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    'postgresql://user:password@localhost/unipark_db',
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False
)
```

### Transaction Handling
```python
# Start transaction
with connection.begin():
    # Multiple operations
    result1 = connection.execute(query1)
    result2 = connection.execute(query2)
    # Auto-commit on success, auto-rollback on exception
```

### Error Handling
```python
try:
    # Database operation
    result = connection.execute(query)
except IntegrityError as e:
    # Handle constraint violations
    raise InvalidDataError(str(e))
except OperationalError as e:
    # Handle connection issues
    raise DatabaseError(str(e))
```

---

## Security Considerations

### Data Protection
```sql
-- Enable SSL connections
ssl = on

-- Restrict connections to localhost for development
-- (or specific IPs for production)
-- In postgresql.conf:
-- listen_addresses = 'localhost'
-- For production, use pgBouncer with SSL
```

### User Privileges
```sql
-- Never grant superuser to application
-- Use principle of least privilege
GRANT CONNECT ON DATABASE unipark_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;

-- Deny drop/creation for app_user
ALTER DEFAULT PRIVILEGES IN SCHEMA public
DENY CREATE ON SCHEMA TO app_user;
```

### Audit Logging
```sql
-- All changes are logged to audit_logs table
-- Review regularly:
SELECT user_id, action, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 100;
```

---

## Support & Documentation

### Full Documentation
See `DATABASE_SCHEMA_DOCUMENTATION.md` for:
- Detailed table descriptions
- Entity relationship diagram
- User role definitions
- Business rules and constraints
- Complex query examples

### Sample Queries
See `sample_queries.sql` for:
- CRUD operations
- Analytics queries
- Common use cases
- Performance-optimized queries

---

## Contact & Issues

For database-related issues:
1. Check troubleshooting section above
2. Review PostgreSQL logs: `/var/log/postgresql/`
3. Run verification queries from `database_initialization.sql`
4. Document issue with:
   - Error message
   - Query that failed
   - Expected vs actual result
   - Database size and row counts

---

**Last Updated:** June 2026  
**Database Version:** PostgreSQL 12+  
**Schema Version:** 1.0
