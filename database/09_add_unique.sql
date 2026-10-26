USE resmanager;

-- department_code and department_name must be unique
ALTER TABLE department
ADD CONSTRAINT uq_department_code UNIQUE (department_code),
ADD CONSTRAINT uq_department_name UNIQUE (department_name);

-- users can have the same name, but must have a unique email
ALTER TABLE users
ADD CONSTRAINT uq_users_email UNIQUE (email);

-- every club must be unique
-- every club president must belong to only one club
-- initially a club has no president, so multiple clubs can have no president, i.e president_user_id=NULL
ALTER TABLE club
ADD CONSTRAINT uq_club_name UNIQUE (club_name),
ADD CONSTRAINT uq_club_president UNIQUE (president_user_id);

-- prints the exact CREATE TABLE statement that would be required to rebuild that table in the current state
SHOW CREATE TABLE department;
SHOW CREATE TABLE users;
SHOW CREATE TABLE club;