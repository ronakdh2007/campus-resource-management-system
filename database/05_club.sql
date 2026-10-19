USE resmanager;

CREATE TABLE club(
	club_id INT PRIMARY KEY AUTO_INCREMENT,
    club_name VARCHAR(100) NOT NULL,
    -- initially club dosen't have president nor faculty advisor until assigned
    president_user_id INT NULL, -- will work as a FK later
    faculty_user_id INT NULL -- will work as a FK later
);

DESCRIBE club;