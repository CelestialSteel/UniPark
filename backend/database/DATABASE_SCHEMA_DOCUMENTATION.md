# University Parking Management System - Database Schema Documentation

## Overview
This document provides a comprehensive guide to the PostgreSQL database schema for the University Parking Management System. The system manages parking operations for three types of users: Admins, Security Detail, and Drivers.

---

## Table of Contents
1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Core Tables](#core-tables)
3. [Key Features](#key-features)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Data Flow](#data-flow)
6. [Business Rules & Constraints](#business-rules--constraints)
7. [API Integration Points](#api-integration-points)

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     USERS       │ (admin, security, driver)
├─────────────────┤
│ id (PK)         │
│ email           │
│ role            │
│ first_name      │
│ last_name       │
│ phone_number    │
└────────┬────────┘
         │
         ├──────────┬─────────────┐
         │          │             │
    ┌────▼───┐  ┌───▼─────┐      │
    │ DRIVERS │  │  ADMIN  │      │
    └────┬───┘  └─────────┘      │
         │                        │
    ┌────▼─────────┐              │
    │  VEHICLES    │──────────────┤
    ├──────────────┤              │
    │ id (FK)      │              │
    │ driver_id    │              │
    │ reg_number   │              │
    │ is_primary   │              │
    └────┬─────────┘              │
         │                        │
    ┌────▼──────────────┐         │
    │  VEHICLE_LOGS     │         │
    ├───────────────────┤         │
    │ vehicle_id (FK)   │         │
    │ driver_id (FK)    │         │
    │ entry_time        │         │
    │ exit_time         │         │
    │ duration_minutes  │         │
    └───────────────────┘         │
                                  │
    ┌─────────────────────────────┘
    │
    ├──────────┬──────────────┬────────────────┐
    │          │              │                │
┌───▼────┐ ┌──▼────┐ ┌──────▼──────┐ ┌──────▼──────┐
│ PARKING│ │PARKING│ │RESERVATIONS │ │   ALERTS    │
│ZONES   │ │SPACES │ │             │ │             │
└───┬────┘ └──┬────┘ └─────────────┘ └─────────────┘
    │        │
    │        └──────────────┐
    │                       │
    ├───────────┬───────────┤
    │           │           │
┌───▼────────┐ ┌▼──────────┴────────────┐
│OCCUPANCY   │ │  INFRINGEMENTS        │
│HISTORY     │ │ (driver, vehicle)     │
└────────────┘ └──────────────────────┘
               │
               └──────────┐
                          │
                     ┌────▼──────────┐
                     │NOTIFICATIONS  │
                     └───────────────┘
```

---

## Core Tables

### 1. **USERS** 
The central table for all system users.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| email | VARCHAR | Unique email address |
| password_hash | VARCHAR | Hashed password (bcrypt) |
| role | ENUM | 'admin', 'security', or 'driver' |
| first_name | VARCHAR | User's first name |
| last_name | VARCHAR | User's last name |
| phone_number | VARCHAR | Contact number |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes:** email, role

---

### 2. **DRIVERS**
Campus goers (students, faculty, staff) who drive.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users (unique) |
| student_id | VARCHAR | Student ID (if applicable) |
| faculty_id | VARCHAR | Faculty ID (if applicable) |
| staff_id | VARCHAR | Staff ID (if applicable) |
| license_number | VARCHAR | Driver's license number (unique) |
| license_expiry | DATE | License expiration date |
| department | VARCHAR | Department/college |

**Key Relationships:**
- One user = One driver record
- One driver = Multiple vehicles (at least 1 must be primary)

---

### 3. **VEHICLES**
Registered vehicles linked to drivers.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| driver_id | UUID | FK to drivers (required) |
| registration_number | VARCHAR | License plate (unique) |
| make | VARCHAR | Vehicle make (Toyota, Honda, etc.) |
| model | VARCHAR | Vehicle model (Camry, Civic, etc.) |
| color | VARCHAR | Vehicle color |
| vehicle_type | VARCHAR | Type (car, truck, motorcycle, etc.) |
| registered_by_user_id | UUID | FK to users (security who registered it) |
| is_primary | BOOLEAN | Required per driver |
| is_active | BOOLEAN | Vehicle status |

**Key Business Rules:**
- Each driver must have at least ONE primary vehicle
- No vehicle can be registered under two different drivers (unique registration_number)
- Only security personnel can register new vehicles
- Drivers can link/unlink vehicles but must maintain a primary vehicle

**Constraints:**
```sql
-- Prevent duplicate registration
UNIQUE(registration_number)

-- Prevent 2 drivers registering same vehicle
driver_id != existing_driver_id
```

**Triggers:**
- `prevent_duplicate_vehicle_registration` - Validates unique registration
- `ensure_driver_has_primary_vehicle` - Ensures driver always has primary vehicle

---

### 4. **PARKING_ZONES**
Designated parking areas on campus.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| zone_name | VARCHAR | Zone name (e.g., "North Campus A") |
| zone_code | VARCHAR | Short code (e.g., "NCA") |
| description | TEXT | Zone description |
| location | VARCHAR | Physical location |
| total_spaces | INTEGER | Total parking spaces |
| reserved_spaces | INTEGER | Currently reserved count |
| cordoned_spaces | INTEGER | Currently cordoned count |
| maintenance_spaces | INTEGER | Under maintenance count |
| status | ENUM | 'active', 'cordoned', 'maintenance', 'full' |
| created_by_user_id | UUID | FK to admin user |

**Key Features:**
- Admin can designate zones
- Can be cordoned off entirely
- Tracks space allocation dynamically

---

### 5. **PARKING_SPACES**
Individual parking spots within zones.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| zone_id | UUID | FK to parking_zones |
| space_number | VARCHAR | Space identifier (e.g., "A01") |
| status | ENUM | 'available', 'occupied', 'reserved', 'cordoned', 'maintenance' |
| reserved_for_user_id | UUID | FK to drivers (if reserved for specific driver) |
| currently_occupied_by_vehicle_id | UUID | FK to vehicles |
| cordoned_reason | TEXT | Reason for cordoning |
| created_by_user_id | UUID | FK to admin user |

**States:**
- **available**: Can be occupied by any driver
- **occupied**: Currently has a vehicle
- **reserved**: Reserved by admin for specific driver
- **cordoned**: Blocked off (maintenance, accident, etc.)
- **maintenance**: Undergoing repairs

**Triggers:**
- `update_zone_statistics` - Updates zone counts when space status changes
- Records occupancy history for analytics

---

### 6. **VEHICLE_LOGS**
Complete entry/exit audit trail for all vehicles.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| vehicle_id | UUID | FK to vehicles |
| driver_id | UUID | FK to drivers |
| parking_space_id | UUID | FK to parking_spaces (can be NULL) |
| parking_zone_id | UUID | FK to parking_zones |
| status | ENUM | 'entered' or 'exited' |
| entry_time | TIMESTAMP | When vehicle entered campus |
| exit_time | TIMESTAMP | When vehicle left campus |
| duration_minutes | INTEGER | Calculated duration |
| recorded_by_user_id | UUID | FK to security user |

**Key Features:**
- Complete audit trail of all vehicle movements
- Enables occupancy analytics
- Supports infringement detection (overstay)
- Calculates parking duration automatically

**Business Logic:**
- Triggered when vehicle enters/exits gate
- Guard (security) records entry
- System auto-records exit when vehicle leaves
- Can detect overstay violations

---

### 7. **ALERTS**
Zone-level alerts/notifications that drivers can see.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| parking_zone_id | UUID | FK to parking_zones |
| alert_type | VARCHAR | Type of alert |
| description | TEXT | Alert details |
| is_active | BOOLEAN | Alert status |
| created_by_user_id | UUID | FK to admin user |

**Alert Types:**
- `zone_full` - All spaces occupied
- `high_occupancy` - >80% occupied (configurable)
- `maintenance` - Zone under maintenance
- `cordoned` - Zone cordoned off
- `event_parking` - Special event parking

**Usage:**
- Admin creates alerts
- Drivers view when searching for parking
- System auto-generates occupancy alerts

---

### 8. **INFRINGEMENTS**
Parking violations and incidents.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| vehicle_id | UUID | FK to vehicles |
| driver_id | UUID | FK to drivers |
| parking_zone_id | UUID | FK to parking_zones |
| parking_space_id | UUID | FK to parking_spaces |
| infringement_type | VARCHAR | Type of violation |
| description | TEXT | Details of violation |
| status | ENUM | 'reported', 'under_review', 'resolved', 'dismissed', 'appealed' |
| severity | VARCHAR | 'minor', 'moderate', 'severe' |
| fine_amount | DECIMAL | Fine in currency |
| reported_by_user_id | UUID | FK to security user |
| processed_by_user_id | UUID | FK to admin user |
| reported_at | TIMESTAMP | When reported |
| processed_at | TIMESTAMP | When resolved |
| resolution_notes | TEXT | Admin resolution notes |

**Infringement Types:**
- `overstay` - Exceeded parking duration
- `no_permit` - No valid parking permit
- `unauthorized_zone` - Parked in restricted zone
- `wrong_space` - Parked in reserved/cordoned space
- `missing_details` - Incomplete vehicle info
- `expired_registration` - Vehicle registration expired

**Workflow:**
1. Security reports infringement
2. System creates driver notification
3. Admin reviews infringement
4. Admin processes (resolved/dismissed/appealed)
5. Driver notified of outcome

**Triggers:**
- `notify_on_infringement` - Auto-notifies driver when reported

---

### 9. **NOTIFICATIONS**
User-facing notification system.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| recipient_user_id | UUID | FK to users |
| notification_type | ENUM | Type of notification |
| title | VARCHAR | Notification title |
| message | TEXT | Notification message |
| related_infringement_id | UUID | FK to infringements (if applicable) |
| related_alert_id | UUID | FK to alerts (if applicable) |
| is_read | BOOLEAN | Read status |
| read_at | TIMESTAMP | When read |
| created_at | TIMESTAMP | Creation time |

**Notification Types:**
- `infringement` - Infringement reported on driver's vehicle
- `alert` - Zone alert (zone full, etc.)
- `alert_lifted` - Alert cleared
- `reservation_confirmation` - Space reserved for driver
- `system` - General system messages

**Auto-Generation:**
- Infringement reported: Notifies driver
- Zone full: Notifies all drivers seeking parking
- Admin sends messages: Creates notification

---

### 10. **RESERVATIONS**
Admin can reserve specific spaces for drivers.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| parking_space_id | UUID | FK to parking_spaces |
| driver_id | UUID | FK to drivers |
| reservation_start | TIMESTAMP | When reservation begins |
| reservation_end | TIMESTAMP | When reservation ends |
| created_by_user_id | UUID | FK to admin user |
| purpose | VARCHAR | Reason for reservation |
| is_active | BOOLEAN | Active status |

**Use Cases:**
- VIP visitors
- Temporary staff
- Emergency vehicle
- Maintenance work

---

### 11. **ZONE_OCCUPANCY_HISTORY**
Historical record for occupancy analytics and reporting.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| parking_zone_id | UUID | FK to parking_zones |
| occupied_spaces | INTEGER | Occupied count at time |
| available_spaces | INTEGER | Available count at time |
| reserved_spaces | INTEGER | Reserved count at time |
| cordoned_spaces | INTEGER | Cordoned count at time |
| occupancy_percentage | DECIMAL | Calculated percentage |
| recorded_at | TIMESTAMP | When recorded |

**Purpose:**
- Track occupancy trends
- Generate reports
- Identify peak hours
- Capacity planning

---

### 12. **AUDIT_LOGS**
Complete system audit trail.

| Column | Type | Description |
|--------|------|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users (who made change) |
| action | VARCHAR | Action type |
| entity_type | VARCHAR | What was changed |
| entity_id | UUID | ID of changed entity |
| old_values | JSONB | Previous values |
| new_values | JSONB | New values |
| created_at | TIMESTAMP | When changed |

**Tracked Actions:**
- User created/updated/deleted
- Vehicle registered/unlinked
- Space status changed
- Zone cordoned/released
- Infringement reported/processed
- Reservation created
- Alert created/cleared

---

## Key Features

### 1. **Role-Based Access Control (RBAC)**

#### ADMIN
- ✅ Create/edit/delete parking zones
- ✅ Designate zones (cordone off)
- ✅ Reserve/unreserve specific spaces
- ✅ View all analytics and reports
- ✅ Process overstays
- ✅ Send notifications
- ✅ View audit logs
- ❌ Register vehicles (security only)

#### SECURITY DETAIL
- ✅ Register new vehicles (link to driver)
- ✅ Update zone spot counts
- ✅ Report/flag  overstay infringements
- ✅ Record vehicle entry/exit
- ✅ View zone status
- ❌ Create parking zones (admin only)
- ❌ Reserve spaces (admin only)
- ❌ View full analytics (limited)

#### DRIVER
- ✅ Link new vehicle (requires security approval)
- ✅ Unlink vehicle (if has other active)
- ✅ View available parking zones
- ✅ View zone alerts
- ✅ View own infringements
- ✅ View own notifications
- ✅ View parking history
- ❌ Reserve spaces
- ❌ Report
-

---

## Business Rules & Constraints

### Vehicle Registration
```sql
PRIMARY KEY: registration_number (globally unique)
CONSTRAINT: One driver → One primary vehicle (required)
CONSTRAINT: No vehicle → Two drivers (ever)
TRIGGER: prevent_duplicate_vehicle_registration
```

### Parking Space Management
```sql
Zone Status Transitions:
  active → cordoned (admin)      [full zone]
  active → maintenance (admin)   [maintenance needed]
  cordoned → active (admin)      [cleared]
  maintenance → active (admin)   [fixed]

Space Status Transitions:
  available → occupied (vehicle enters)
  occupied → available (vehicle exits)
  available → reserved (admin)
  reserved → available (admin)
  any → cordoned (admin/security)
  cordoned → available (admin)
  any → maintenance (admin)
  maintenance → available (admin)
```

### Infringement Workflow
```
Reported by Security
        ↓
System auto-notifies Driver
        ↓
Admin Reviews
        ↓
    ┌─────────────────┬─────────────────┬───────────────┐
    ↓                 ↓                 ↓               ↓
 Resolved       Dismissed          Appealed      Under Review
    ↓                 ↓                 ↓               ↓
Driver Fine    Case Closed      Awaiting Appeal   Pending
(if required)                      Review
```

### Vehicle Entry/Exit Logging
```
Gate Entry:
  1. Security scans vehicle
  2. System finds vehicle in database
  3. Links to driver
  4. Records entry time
  5. Assigns parking space (automated or manual)

Gate Exit:
  1. Security scans exit
  2. System records exit time
  3. Updates parking space status to available
  4. Calculates duration
  5. Searches for overstay infringements
```

---

## Data Flow

### User Registration Flow
```
New User Created (User signup/registration)
    ↓
If role = 'driver':
    → Create Driver record
    → License info required
    ↓
    Driver must add/link vehicle
    (Security registers when seen at gate)
    ↓
    Vehicle → Parking Zone → Parking Space
```

### Vehicle Entry Flow
```
Vehicle appears at gate
    ↓
Security detail scans registration
    ↓
System validates vehicle exists + is active
    ↓
Retrieves driver info
    ↓
Creates vehicle_log (entry)
    ↓
Queries available parking spaces
    ↓
Space assigned (auto or manual)
    ↓
parking_space status = 'occupied'
    ↓
parking_space.currently_occupied_by_vehicle_id = vehicle_id
```

### Infringement Detection Flow
```
Vehicle exits gate
    ↓
System calculates parking duration
    ↓
Checks zone rules (max duration, etc.)
    ↓
If violation detected:
    ↓
    Security can flag
    ↓
    Create infringement record
    ↓
    Auto-notify driver
    ↓
    Admin reviews
    ↓
    Admin processes (resolves/dismisses)
```

---

## Queries for Each User Type

### DRIVER Queries
```sql
-- Find available zones
SELECT * FROM zone_current_occupancy
WHERE occupancy_percentage < 85
ORDER BY occupancy_percentage;

-- View my vehicles
SELECT * FROM vehicles
WHERE driver_id = $1
ORDER BY is_primary DESC;

-- View my parking history
SELECT * FROM vehicle_logs
WHERE driver_id = $1
ORDER BY entry_time DESC;

-- View my infringements
SELECT * FROM infringements
WHERE driver_id = $1
AND status != 'dismissed'
ORDER BY reported_at DESC;

-- View my alerts
SELECT * FROM notifications
WHERE recipient_user_id = $1
AND is_read = false
ORDER BY created_at DESC;
```

### SECURITY Queries
```sql
-- Register new vehicle
INSERT INTO vehicles (...) VALUES (...)
WHERE registered_by_user_id = current_user_id;

-- Log vehicle entry
SELECT log_vehicle_entry(vehicle_id, driver_id, zone_id, space_id, user_id);

-- Log vehicle exit
SELECT log_vehicle_exit(vehicle_id, space_id);

-- Report infringement
INSERT INTO infringements (...)
VALUES (... reported_by_user_id = current_user_id);

-- Zone status
SELECT * FROM zone_current_occupancy;

-- See vehicle details
SELECT * FROM vehicles WHERE registration_number = $1;
```

### ADMIN Queries
```sql
-- Create parking zone
INSERT INTO parking_zones (...);

-- Cordon zone
UPDATE parking_zones SET status = 'cordoned' WHERE id = $1;

-- Create alert
INSERT INTO alerts (parking_zone_id, alert_type, ...) VALUES (...);

-- Process infringement
UPDATE infringements SET status = 'resolved', processed_by_user_id = $1
WHERE id = $2;

-- View analytics
SELECT * FROM zone_occupancy_history
WHERE recorded_at > NOW() - INTERVAL '7 days';

-- View audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC;
```

---

## API Integration Points

The backend API will need these main endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Drivers/Profile
- `GET /api/drivers/profile` - Get driver profile
- `GET /api/drivers/vehicles` - List driver's vehicles
- `POST /api/drivers/vehicles` - Link new vehicle (requires security approval)
- `DELETE /api/drivers/vehicles/:id` - Unlink vehicle

### Parking
- `GET /api/parking/zones` - List available zones
- `GET /api/parking/zones/:id` - Zone details & availability
- `GET /api/parking/zones/:id/alerts` - Zone alerts
- `GET /api/parking/availability` - Search available spaces

### Vehicle Logs (Security)
- `POST /api/vehicles/entry` - Record vehicle entry
- `POST /api/vehicles/exit` - Record vehicle exit
- `GET /api/vehicles/current` - Currently parked vehicles

### Infringements
- `POST /api/infringements` - Report infringement (Security)
- `GET /api/infringements` - List infringements (Driver/Admin)
- `PATCH /api/infringements/:id` - Process infringement (Admin)

### Admin Management
- `POST /api/zones` - Create parking zone
- `PATCH /api/zones/:id` - Update zone
- `POST /api/spaces/:id/reserve` - Reserve space
- `POST /api/spaces/:id/cordone` - Cordone space
- `GET /api/analytics/dashboard` - Admin dashboard data

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

---

## Indexes for Performance

All critical columns are indexed:
- `users(email, role)`
- `vehicles(driver_id, registration_number, is_active)`
- `parking_zones(status, zone_code)`
- `parking_spaces(zone_id, status, currently_occupied_by_vehicle_id)`
- `vehicle_logs(vehicle_id, driver_id, entry_time, status)`
- `infringements(driver_id, vehicle_id, status, reported_at)`
- `notifications(recipient_user_id, is_read, created_at)`
- `zone_occupancy_history(parking_zone_id, recorded_at)`

---

## Views for Common Queries

The schema includes three pre-built views:

1. **zone_current_occupancy** - Real-time zone status
2. **driver_vehicle_summary** - Vehicle count per driver
3. **active_infringements** - Unresolved infringements

These views optimize common queries used by the API.

---

## Testing & Load Scenarios

Sample data includes:
- 3 admin/security users
- 3 driver users
- 5 parking zones with 50-75 spaces each
- Sample vehicles and logs
- Sample infringements and alerts

Use for:
- Development testing
- Query optimization
- Integration testing
- Analytics testing

---

## Next Steps

1. **Create PostgreSQL database** using `schema.sql`
2. **Initialize functions/triggers** using `triggers_and_functions.sql`
3. **Load sample data** using `sample_queries.sql`
4. **Build backend APIs** (Python/FastAPI or Flask)
5. **Build frontend** (React) with components for each user type
6. **Set up monitoring** for database performance

