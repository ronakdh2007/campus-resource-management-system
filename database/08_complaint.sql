USE resmanager;

CREATE TABLE complaint(
	complaint_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    resource_code VARCHAR(10) NOT NULL, -- will work as a FK later ; a complaint will always be of a resource
    user_id INT NOT NULL, -- will work as a FK later ; a user will always raise a complaint
    status ENUM('Pending', 'Resolved') NOT NULL DEFAULT 'Pending',
    created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- the date will be of when the complaint is raised
    resolved_by INT NULL, -- will work as a FK later ; initially no one will have resolved the complaint
    resolved_date DATETIME NULL -- initially the complaint will not be resolved
);

DESCRIBE complaint;