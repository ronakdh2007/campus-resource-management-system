USE resmanager;

CREATE TABLE booking_request(
	booking_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL, -- will work as a FK later ; booking cannot be w/o user_id
    resource_code VARCHAR(10) NOT NULL, -- will work as a FK later ; booking will always be of a resource
    club_id INT NULL, -- will work as a FK later ; booking need not involve a club
    booking_date DATE NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
    approved_by INT NULL, -- will work as a FK later ; initially booking is pending and not approved by anyone
    approval_date DATETIME NULL -- initially booking is pending and not approved
);

DESCRIBE booking_request;