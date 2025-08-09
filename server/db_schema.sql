-- Creates all tables, indexes, and the scheduled event for a complete database setup.

CREATE TABLE login (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       full_name VARCHAR(255) NOT NULL,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       role ENUM('user', 'admin') DEFAULT 'user',
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP
) COLLATE = utf8mb4_unicode_ci;

CREATE TABLE eventManage (
                             event_id INT AUTO_INCREMENT PRIMARY KEY,
                             event_name VARCHAR(255) NOT NULL,
                             event_description TEXT NULL,
                             event_location VARCHAR(255) NULL,
                             urgency ENUM('High', 'Medium', 'Low') DEFAULT 'Low',
                             eventDate VARCHAR(255) NULL,
                             created_by INT NOT NULL,
                             start_time DATETIME NOT NULL,
                             end_time DATETIME NOT NULL,
                             FOREIGN KEY (created_by) REFERENCES login(id)
);

CREATE TABLE event_volunteer_request (
                                         request_id INT AUTO_INCREMENT PRIMARY KEY,
                                         event_id INT NOT NULL,
                                         volunteer_id INT NOT NULL,
                                         requested_by INT NOT NULL,
                                         status ENUM('Pending','Accepted','Declined') DEFAULT 'Pending',
                                         requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                         responded_at TIMESTAMP NULL,
                                         FOREIGN KEY (event_id) REFERENCES eventManage(event_id) ON DELETE CASCADE,
                                         FOREIGN KEY (volunteer_id) REFERENCES login(id) ON DELETE CASCADE,
                                         FOREIGN KEY (requested_by) REFERENCES login(id) ON DELETE CASCADE
);

CREATE INDEX event_id ON event_volunteer_request (event_id);
CREATE INDEX requested_by ON event_volunteer_request (requested_by);
CREATE INDEX volunteer_id ON event_volunteer_request (volunteer_id);

CREATE TABLE notifications (
                               id INT AUTO_INCREMENT PRIMARY KEY,
                               userId INT NOT NULL,
                               message TEXT NOT NULL,
                               is_read TINYINT(1) DEFAULT 0,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profile (
                         id INT AUTO_INCREMENT PRIMARY KEY,
                         user_id INT NOT NULL UNIQUE,
                         address1 VARCHAR(100) NULL,
                         address2 VARCHAR(100) NULL,
                         city VARCHAR(100) NULL,
                         state VARCHAR(50) NULL,
                         zip_code VARCHAR(10) NULL,
                         skills VARCHAR(255) NULL,
                         preferences TEXT NULL,
                         availability VARCHAR(255) NULL,
                         is_complete TINYINT(1) DEFAULT 0,
                         FOREIGN KEY (user_id) REFERENCES login(id) ON UPDATE CASCADE ON DELETE CASCADE
) COLLATE = utf8mb4_unicode_ci;

CREATE TABLE skill (
                       skill_id INT AUTO_INCREMENT PRIMARY KEY,
                       skill_name VARCHAR(100) NOT NULL
);

CREATE TABLE event_skill (
                             event_id INT NOT NULL,
                             skill_id INT NOT NULL,
                             PRIMARY KEY (event_id, skill_id),
                             FOREIGN KEY (event_id) REFERENCES eventManage(event_id),
                             FOREIGN KEY (skill_id) REFERENCES skill(skill_id)
);

CREATE INDEX skill_id_event ON event_skill (skill_id);

CREATE TABLE profile_skill (
                               user_id INT NOT NULL,
                               skill_id INT NOT NULL,
                               PRIMARY KEY (user_id, skill_id),
                               FOREIGN KEY (user_id) REFERENCES profile(user_id),
                               FOREIGN KEY (skill_id) REFERENCES skill(skill_id)
);

CREATE INDEX skill_id_profile ON profile_skill (skill_id);

CREATE TABLE volunteer_history (
                                   history_id INT AUTO_INCREMENT PRIMARY KEY,
                                   volunteer_id INT NOT NULL,
                                   event_id INT NOT NULL,
                                   participation_date DATE NULL,
                                   hours_served DOUBLE NULL,
                                   feedback TEXT NULL,
                                   rating INT NULL,
                                   event_status ENUM('Upcoming', 'Attended', 'Missed', 'Withdrew') DEFAULT 'Upcoming',
                                   FOREIGN KEY (event_id) REFERENCES eventManage(event_id),
                                   FOREIGN KEY (volunteer_id) REFERENCES login(id)
);

CREATE INDEX volunteer_id_history ON volunteer_history (volunteer_id);

CREATE TABLE volunteer_request_notification (
                                                id INT AUTO_INCREMENT PRIMARY KEY,
                                                request_id INT NOT NULL,
                                                volunteer_id INT NOT NULL,
                                                message VARCHAR(255) NOT NULL,
                                                is_read TINYINT(1) DEFAULT 0,
                                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                responded_at TIMESTAMP NULL,
                                                FOREIGN KEY (request_id) REFERENCES event_volunteer_request(request_id) ON DELETE CASCADE,
                                                FOREIGN KEY (volunteer_id) REFERENCES login(id) ON DELETE CASCADE
);

CREATE INDEX ix_vrn_volunteer_read ON volunteer_request_notification (volunteer_id, is_read);

CREATE TABLE volunteers (
                            id INT NOT NULL PRIMARY KEY,
                            name VARCHAR(100) NULL,
                            location VARCHAR(100) NULL,
                            skills TEXT NULL,
                            availability_start DATETIME NULL,
                            availability_end DATETIME NULL,
                            preferences TEXT NULL
);

CREATE EVENT update_missed_events
    ON SCHEDULE EVERY 1 MINUTE
    DO
    UPDATE volunteer_history vh
        JOIN eventManage em ON vh.event_id = em.event_id
    SET vh.event_status = 'Missed'
    WHERE em.start_time < NOW()
      AND vh.event_status = 'Upcoming';