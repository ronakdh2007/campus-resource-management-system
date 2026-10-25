USE resmanager;

DELETE FROM timetable WHERE resource_code IN ('LHC002','LHC202','2AB016','1AB102');
DELETE FROM booking_request WHERE resource_code IN ('LHC002','LHC202','2AB016','1AB102');  -- slots go with them (CASCADE)
DELETE FROM complaint WHERE resource_code IN ('LHC002','LHC202','2AB016','1AB102');
DELETE FROM resource WHERE resource_code IN ('LHC002','LHC202','2AB016','1AB102');