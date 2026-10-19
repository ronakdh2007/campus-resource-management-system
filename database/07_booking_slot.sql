USE resmanager;

CREATE TABLE booking_slot(
	booking_id INT NOT NULL, -- will work as a FK later ; a booking_slot will always belong to a booking_id
    -- don't confuse below attributes with the timetable's attributes
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    -- composite PK since a single booking can span over multiple slots, to uniquely identify each slot we need start_time as well
    PRIMARY KEY(booking_id, start_time)
);

DESCRIBE booking_slot;