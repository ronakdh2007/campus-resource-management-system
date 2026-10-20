USE resmanager;

-- adding indexes for faster search
-- resource_code comes first because it narrows down the search and is faster

CREATE INDEX idx_timetable_resource_day
ON timetable (resource_code, `day`);

CREATE INDEX idx_booking_resource_date
ON booking_request (resource_code, booking_date);

-- shows all indexes of a table
SHOW INDEXES FROM timetable;
SHOW INDEXES FROM booking_request;