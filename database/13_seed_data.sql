USE resmanager;

-- inserting initial/seed data

-- 1. department
INSERT INTO department (department_id, department_code, department_name) VALUES
(1, 'CSE', 'Computer Science and Engineering'),
(2, 'IT',  'Information Technology'),
(3, 'ECE', 'Electronics and Communication Engineering'),
(4, 'ME',  'Mechanical Engineering');

-- 2. resource
INSERT INTO resource (resource_code, room_number, resource_type, building, capacity, `floor`, status) VALUES
('LHC002', '002', 'Lecture Hall', 'LHC', 120, 0, 'Available'),
('LHC202', '202', 'Lecture Hall', 'LHC', 100, 2, 'Available'),
('2AB016', '016', 'Computer Lab', 'Academic Block 2', 60, 0, 'Available'),
('1AB102', '102', 'Classroom', 'Academic Block 1', 70, 1, 'Maintenance');

-- 3. users (1 admin, 3 students, 2 faculty)
INSERT INTO users (user_id, name, email, phone, role, department_id) VALUES
(1, 'Meera Sharma', 'meera.sharma@jaipur.manipal.edu', '9876500001', 'Admin',   NULL),
(2, 'Aarav Mehta',  'aarav.2501010001@muj.manipal.edu', '9876500002', 'Student', 1),
(3, 'Diya Singh',   'diya.2501010002@muj.manipal.edu',  NULL,         'Student', 3),
(4, 'Kabir Jain',   'kabir.2501010003@muj.manipal.edu', NULL,         'Student', NULL),
(5, 'Rohit Verma',  'rohit.verma@jaipur.manipal.edu',   '9876500005', 'Faculty', 1),
(6, 'Neha Gupta',   'neha.gupta@jaipur.manipal.edu',    '9876500006', 'Faculty', 3);

-- 4. timetable
INSERT INTO timetable (subject_code, `day`, start_time, end_time, department_id, resource_code) VALUES
('CS101', 'Monday',    '09:00:00', '10:00:00', 1, 'LHC002'),
('EC201', 'Tuesday',   '11:00:00', '12:00:00', 3, '2AB016'),
('IT301', 'Wednesday', '14:00:00', '15:00:00', 2, '1AB102'),
('ME101', 'Thursday',  '10:00:00', '11:00:00', 4, 'LHC202');

-- 5. club (the third club has no president yet)
INSERT INTO club (club_id, club_name, president_user_id, faculty_user_id) VALUES
(1, 'Coding Club',   2,    5),
(2, 'Robotics Club', 3,    6),
(3, 'Cultural Club', NULL, 5);

-- 6. booking_request
INSERT INTO booking_request (booking_id, user_id, resource_code, club_id, booking_date, purpose, status, approved_by, approval_date) VALUES
(1, 2, 'LHC002', 1,    '2026-11-05', 'Coding contest',       'Pending',   NULL, NULL),
(2, 3, '2AB016', 2,    '2026-11-06', 'Robotics workshop',    'Approved',  1,    '2026-10-20 10:00:00'),
(3, 5, '1AB102', NULL, '2026-11-07', 'Extra class',          'Rejected',  1,    '2026-10-20 11:00:00'),
(4, 2, 'LHC202', 1,    '2026-11-08', 'Alumni talk',          'Cancelled', NULL, NULL);

-- 7. booking_slot (booking 1 has two slots)
INSERT INTO booking_slot (booking_id, start_time, end_time) VALUES
(1, '09:00:00', '10:00:00'),
(1, '14:00:00', '15:00:00'),
(2, '11:00:00', '12:00:00'),
(3, '10:00:00', '11:00:00'),
(4, '15:00:00', '16:00:00');

-- 8. complaint
INSERT INTO complaint (title, description, resource_code, user_id, status, created_date, resolved_by, resolved_date) VALUES
('Projector not working', 'Projector does not turn on.',       '1AB102', 5, 'Pending',  '2026-10-17 09:00:00', NULL, NULL),
('AC not cooling',        'AC is running but room stays hot.', 'LHC002', 2, 'Resolved', '2026-10-15 09:00:00', 1,    '2026-10-18 15:30:00'),
('Broken chairs',         'Three chairs in the back are broken.', '2AB016', 3, 'Pending', '2026-10-19 12:00:00', NULL, NULL),
('Mic not working',       'Podium mic has no sound.',          'LHC202', 6, 'Resolved', '2026-10-14 10:00:00', 1,    '2026-10-16 14:00:00');

-- quick check: expected counts 4, 4, 6, 4, 3, 4, 5, 4
SELECT 'department' AS tbl, COUNT(*) AS n FROM department
UNION ALL SELECT 'resource', COUNT(*) FROM resource
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'timetable', COUNT(*) FROM timetable
UNION ALL SELECT 'club', COUNT(*) FROM club
UNION ALL SELECT 'booking_request', COUNT(*) FROM booking_request
UNION ALL SELECT 'booking_slot', COUNT(*) FROM booking_slot
UNION ALL SELECT 'complaint', COUNT(*) FROM complaint;