# UniPark — Campus Vehicle Parking Monitoring System

> A web-based parking management system developed for Strathmore University's Madaraka Campus, Nairobi, Kenya.

---

## Overview

UniPark is a role-based, web-based system designed to replace the manual logbook processes currently used to manage vehicle entry and parking at learning institutions. Built specifically for Strathmore University, it digitises vehicle entry and exit logging, provides real-time zone-specific parking occupancy visibility, automates overstay detection, and enables administrators to manage event-based parking reservations — all without requiring additional gate hardware.

The system serves three distinct user roles: **Security Guards**, **Drivers**, and **Administrators**, each with a dedicated interface and access scope.

---

## The Problem It Solves

Strathmore University currently manages vehicle entry and parking through handwritten logbooks maintained by security staff at campus gates. This creates:

- No real-time visibility into which parking zones have available spaces
- No mechanism to flag vehicles that remain on campus beyond a reasonable time
- No structured way to communicate event-based parking restrictions to drivers in advance
- No fast way to retrieve a vehicle owner's contact details when urgent relocation is needed
- Data that is prone to human error, illegible entries, and loss

UniPark addresses all of these gaps through a software-only solution that integrates with existing gate infrastructure.

---

## Key Features

**For Security Guards**
- Log vehicle arrivals and departures (registration number, driver identity, timestamps)
- Link vehicles to registered driver profiles at the gate upon first arrival
- Look up vehicle owner contact details when a car needs to be urgently relocated
- View real-time zone occupancy data and total vehicle count on campus

**For Drivers**
- View real-time occupancy status of each parking zone — which are available, which are full
- Receive notifications about event-based zone closures before arriving on campus
- Manage their own vehicle profile (link or unlink vehicles from their account)

**For Administrators**
- Access a live dashboard showing occupancy across all campus parking zones
- View historical vehicle entry/exit logs and zone occupancy records
- Configure and manage overstay alerts (customisable time threshold)
- Reserve or close parking zones in advance of scheduled campus events
- Publish campus-wide parking announcements visible to all users
- Retrieve vehicle owner contact details directly from the dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (JavaScript) |
| Backend | Python + Django (REST API, MVT architecture) |
| Database | PostgreSQL |
| Version Control | GitHub |
| API Testing | Postman |
| IDE | Visual Studio Code |

---

## System Modules

The system is divided into four core deliverable modules:

1. **Authentication Module** — Registration with Strathmore ID validation, institutional email verification, role-based login, and password reset
2. **Driver Module** — Driver profile, vehicle linking/unlinking, real-time zone availability view
3. **Security Detail Module** — Vehicle entry/exit logging, zone occupancy view, contact detail lookup
4. **Institutional Management Module** — Admin dashboard, overstay alert management, event zone reservation, announcements, historical reporting

---

## Development Approach

The system follows **Object-Oriented Analysis and Design (OOAD)** principles, implemented through an **incremental development model**. Functionality is delivered in successive testable increments, beginning with authentication and vehicle logging and progressively introducing occupancy monitoring, alerts, and the admin dashboard.

---

## Scope & Constraints

- Targets four-wheeled motor vehicles only (cars, vans, SUVs)
- Does not integrate with the NTSA vehicle registration database — owner details are captured manually at first gate entry
- Does not deploy bay-level sensors, LED signage, or automated license plate recognition cameras
- Requires a stable internet connection at the gate for real-time functionality
- Parking zone occupancy is updated through manual guard logging, not automated sensors

---

## Project Team

| Name | Admission Number |
|---|---|
| Dalton Mule Muindi | 184066 |
| Griffin Sitati | 191613 |

**Supervisor:** Anthony Khajira
**Institution:** School of Computing and Engineering Sciences (SCES), Strathmore University
**Project Period:** April – July 2026
