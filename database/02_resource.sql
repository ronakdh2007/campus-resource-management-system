USE resmanager;

CREATE TABLE resource(
	resource_code VARCHAR(10) PRIMARY KEY,
    room_number VARCHAR(10) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    building VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    `floor` INT NOT NULL, -- in backticks since floor is a keyword
    status ENUM('Available', 'Unavailable', 'Maintenance') NOT NULL DEFAULT 'Available'
);

DESCRIBE resource;