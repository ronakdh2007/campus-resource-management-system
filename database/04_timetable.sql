USE resmanager;

CREATE TABLE timetable(
	timetable_id INT PRIMARY KEY AUTO_INCREMENT,
    subject_code VARCHAR(20) NOT NULL,
    -- in backticks since day is a keyword
    `day` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    -- each class must involve a department and a resource
    department_id INT NOT NULL, -- will work as a FK later
    resource_code VARCHAR(10) NOT NULL -- will work as a FK later
);

DESCRIBE timetable;