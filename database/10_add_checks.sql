USE resmanager;

-- adding integrity constraints/checks

-- every resource must have capacity>0
ALTER TABLE resource
ADD CONSTRAINT chk_resource_capacity CHECK (capacity>0);

-- every class must have end_time>start_time
ALTER TABLE timetable
ADD CONSTRAINT chk_timetable_times CHECK (end_time>start_time);

-- every booking slot must have end_time>start_time
ALTER TABLE booking_slot
ADD CONSTRAINT chk_booking_slot_times CHECK (end_time>start_time);

-- REVISIT THIS CONSTRAINT LATER
ALTER TABLE booking_request
ADD CONSTRAINT chk_booking_pending_no_approval CHECK (status<>'Pending' OR approval_date IS NULL),
ADD CONSTRAINT chk_booking_decided_has_date CHECK (status NOT IN ('Approved', 'Rejected') OR approval_date IS NOT NULL);

-- for every complaint:
-- if complaint is resolved, it must have a resolved_date
-- if a complaint is pending, it cannot have a resolved_date
ALTER TABLE complaint
ADD CONSTRAINT chk_complaint_resolved CHECK(
	(status='Resolved' AND resolved_date IS NOT NULL)
    OR (status='Pending' AND resolved_date IS NULL)
);

-- every phone number must follow the indian 10 digit standard
ALTER TABLE users
ADD CONSTRAINT chk_users_phone CHECK (phone IS NULL OR phone REGEXP '^[6-9][0-9]{9}$');

-- prints the exact CREATE TABLE statement that would be required to rebuild that table in the current state
SHOW CREATE TABLE resource;
SHOW CREATE TABLE timetable;
SHOW CREATE TABLE booking_slot;
SHOW CREATE TABLE booking_request;
SHOW CREATE TABLE complaint;