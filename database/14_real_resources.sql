-- 15_real_resources.sql : the 61 rooms that appear in the III-semester CSE timetables (Jul-Nov 2026)
-- Run this BEFORE uploading timetable.csv (timetable.resource_code is a foreign key to resource).

USE resmanager;

-- From the PDFs / the room code itself:  resource_code, room_number, resource_type, building, floor
-- code pattern = [R|L] + block + 2-digit floor + 2-digit room (+ optional suffix), e.g. RLHC0201 = LHC, floor 02, room 01
-- NOT in the PDFs, so PLACEHOLDERS: capacity (Lecture Hall 120, Classroom 60, Lab 30) -> fix with real numbers
-- building holds the code prefix (LHC / 2AB / 1AB); rename it with the optional UPDATEs at the bottom if you want.
 
INSERT INTO resource (resource_code, room_number, resource_type, building, capacity, `floor`, status) VALUES
('L1AB0114', '0114', 'Lab', '1AB', 30, 1, 'Available'),
('L1AB0115', '0115', 'Lab', '1AB', 30, 1, 'Available'),
('L1AB0116', '0116', 'Lab', '1AB', 30, 1, 'Available'),
('L1AB0122', '0122', 'Lab', '1AB', 30, 1, 'Available'),
('L1AB0126', '0126', 'Lab', '1AB', 30, 1, 'Available'),
('L2AB0002', '0002', 'Lab', '2AB', 30, 0, 'Available'),
('L2AB0003', '0003', 'Lab', '2AB', 30, 0, 'Available'),
('L2AB0003BM', '0003BM', 'Lab', '2AB', 30, 0, 'Available'),
('L2AB0008', '0008', 'Lab', '2AB', 30, 0, 'Available'),
('L2AB0009', '0009', 'Lab', '2AB', 30, 0, 'Available'),
('L2AB0009LG', '0009LG', 'Lab', '2AB', 30, 0, 'Available'),
('L2AB0103', '0103', 'Lab', '2AB', 30, 1, 'Available'),
('L2AB0107', '0107', 'Lab', '2AB', 30, 1, 'Available'),
('L2AB0109', '0109', 'Lab', '2AB', 30, 1, 'Available'),
('L2AB0113', '0113', 'Lab', '2AB', 30, 1, 'Available'),
('L2AB0115', '0115', 'Lab', '2AB', 30, 1, 'Available'),
('L2AB0210', '0210', 'Lab', '2AB', 30, 2, 'Available'),
('L2AB0213', '0213', 'Lab', '2AB', 30, 2, 'Available'),
('L2AB0213A', '0213A', 'Lab', '2AB', 30, 2, 'Available'),
('L2AB0303', '0303', 'Lab', '2AB', 30, 3, 'Available'),
('R2AB0101', '0101', 'Classroom', '2AB', 60, 1, 'Available'),
('R2AB0102', '0102', 'Classroom', '2AB', 60, 1, 'Available'),
('R2AB0104', '0104', 'Classroom', '2AB', 60, 1, 'Available'),
('R2AB0127', '0127', 'Classroom', '2AB', 60, 1, 'Available'),
('R2AB0129', '0129', 'Classroom', '2AB', 60, 1, 'Available'),
('R2AB0130', '0130', 'Classroom', '2AB', 60, 1, 'Available'),
('R2AB0131', '0131', 'Classroom', '2AB', 60, 1, 'Available'),
('R2AB0132', '0132', 'Classroom', '2AB', 60, 1, 'Available'),
('R2AB0208', '0208', 'Classroom', '2AB', 60, 2, 'Available'),
('R2AB0211', '0211', 'Classroom', '2AB', 60, 2, 'Available'),
('R2AB0223', '0223', 'Classroom', '2AB', 60, 2, 'Available'),
('R2AB0228', '0228', 'Classroom', '2AB', 60, 2, 'Available'),
('R2AB0232', '0232', 'Classroom', '2AB', 60, 2, 'Available'),
('R2AB0233', '0233', 'Classroom', '2AB', 60, 2, 'Available'),
('R2AB0234', '0234', 'Classroom', '2AB', 60, 2, 'Available'),
('R2AB0240', '0240', 'Classroom', '2AB', 60, 2, 'Available'),
('R2AB0242', '0242', 'Classroom', '2AB', 60, 2, 'Available'),
('R2AB0243', '0243', 'Classroom', '2AB', 60, 2, 'Available'),
('R2AB0306', '0306', 'Classroom', '2AB', 60, 3, 'Available'),
('RLHC0001', '0001', 'Lecture Hall', 'LHC', 120, 0, 'Available'),
('RLHC0002', '0002', 'Lecture Hall', 'LHC', 120, 0, 'Available'),
('RLHC0103', '0103', 'Lecture Hall', 'LHC', 120, 1, 'Available'),
('RLHC0104', '0104', 'Lecture Hall', 'LHC', 120, 1, 'Available'),
('RLHC0201', '0201', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0202', '0202', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0203', '0203', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0205', '0205', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0206', '0206', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0207', '0207', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0208', '0208', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0209', '0209', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0210', '0210', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0211', '0211', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0212', '0212', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0214', '0214', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0215', '0215', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0216', '0216', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0217', '0217', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0218', '0218', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0219', '0219', 'Classroom', 'LHC', 60, 2, 'Available'),
('RLHC0220', '0220', 'Classroom', 'LHC', 60, 2, 'Available');
 
-- optional: full building names (edit the right-hand side to whatever the college calls them)
-- UPDATE resource SET building = 'Lecture Hall Complex' WHERE building = 'LHC';
-- UPDATE resource SET building = 'Academic Block 2'     WHERE building = '2AB';
-- UPDATE resource SET building = 'Academic Block 1'     WHERE building = '1AB';