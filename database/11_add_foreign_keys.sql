USE resmanager;

-- adding all FKs
-- fk_mainTable_FKAttribute (naming format followed here)

-- users FKs
-- department_id is an FK (form department table)
ALTER TABLE users
ADD CONSTRAINT fk_users_department_id
	FOREIGN KEY (department_id) REFERENCES department(department_id)
	ON DELETE RESTRICT; -- cannot delete a department_id in department table if it is referred by a user

-- timetable FKs
-- department_id (from department table) and resource_code (from resource table) are FKs
ALTER TABLE timetable
ADD CONSTRAINT fk_timetable_department_id
    FOREIGN KEY (department_id) REFERENCES department(department_id)
    ON DELETE RESTRICT, -- cannot delete a department_id in department table if it is referred by a class in timetable
ADD CONSTRAINT fk_timetable_resource_code
    FOREIGN KEY (resource_code) REFERENCES resource(resource_code)
    -- cannot delete a resource_code in resource table if it is referred by a class in timetable
    -- if a resource_code is changed in resource table, the changes will reflect in the timetable
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- club FKs
-- president_user_id and faculty_user_id are FKs (user_id, both from users table)
ALTER TABLE club
ADD CONSTRAINT fk_club_president_user_id
    FOREIGN KEY (president_user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT, -- cannot delete president_user_id (user_id) in users table if it is referred by a club
ADD CONSTRAINT fk_club_faculty_user_id
    FOREIGN KEY (faculty_user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT; -- cannot delete faculty_user_id (user_id) in users table if it is referred by a club

-- booking_request FKs
ALTER TABLE booking_request
-- user_id is an FK (from users table)
-- resource_code is an FK (from resource table)
-- club_id is an FK (from club table)
-- approved_by (user_id) is an FK (from users table)
ADD CONSTRAINT fk_booking_request_user_id
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT, -- cannot delete user_id in users table if it is referred by a booking request
ADD CONSTRAINT fk_booking_request_resource_code
    FOREIGN KEY (resource_code) REFERENCES resource(resource_code)
    -- cannot delete a resource_code in resource table if it is referred by a booking request
    -- if a resource_code is changed in resource table, the changes will reflect in the booking request
    ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT fk_booking_request_club_id
    FOREIGN KEY (club_id) REFERENCES club(club_id)
    ON DELETE RESTRICT, -- cannot delete a club_id in club table if it is referred by a booking request
ADD CONSTRAINT fk_booking_request_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
    ON DELETE RESTRICT; -- cannot delete approved_by (user_id) in users table if it is referred by a booking request

-- booking_slot FKs
-- booking_id is an FK (from booking_request table)
ALTER TABLE booking_slot
ADD CONSTRAINT fk_booking_slot_booking_id
    FOREIGN KEY (booking_id) REFERENCES booking_request(booking_id)
    ON DELETE CASCADE; -- if a booking_id is deleted in booking_request table, all corresponding booking slots will also be deleted
    -- i.e deleting a booking removes its slots automatically

-- complaint FKs
-- resource_code is an FK (from resource table)
-- user_id is an FK (from users table)
-- resolved_by (user_id) is an FK (from users table)
ALTER TABLE complaint
ADD CONSTRAINT fk_complaint_resource_code
    FOREIGN KEY (resource_code) REFERENCES resource(resource_code)
	-- cannot delete resource_code in resource table if it is referred by a complaint
    -- if a resource_code is changed in resource table, the changes will reflect in the complaint
    ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT fk_complaint_user_id
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT, -- cannot delete user_id in users table if it is referred by a complaint
ADD CONSTRAINT fk_complaint_resolved_by
    FOREIGN KEY (resolved_by) REFERENCES users(user_id)
    ON DELETE RESTRICT; -- cannot delete resolved_by (user_id) in users table if it is referred by a complaint

-- prints the exact CREATE TABLE statement that would be required to rebuild that table in the current state
SHOW CREATE TABLE users;
SHOW CREATE TABLE timetable;
SHOW CREATE TABLE club;
SHOW CREATE TABLE booking_request;
SHOW CREATE TABLE booking_slot;
SHOW CREATE TABLE complaint;