USE resmanager;

CREATE TABLE users(
	user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL, -- from email
    email VARCHAR(100) NOT NULL, -- from email
    phone VARCHAR(15) NULL, -- user can manually input phone number later
    role ENUM('Student', 'Faculty', 'Admin') NOT NULL, -- from email
    department_id INT NULL -- will work as a FK later
);

DESCRIBE users;