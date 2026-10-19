USE resmanager;

CREATE TABLE department(
	department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_code VARCHAR(10) NOT NULL,
    department_name VARCHAR(100) NOT NULL
);

DESCRIBE department;