-- Master Tables 


-- USERS
CREATE TABLE USERS (
    user_id BIGINT PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NULL,
    mobile_no VARCHAR(15) UNIQUE,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(500) NOT NULL,
    gender CHAR(1) NULL,
    dob DATE NULL,
    address VARCHAR(500) NULL,
    qualification VARCHAR(200) NULL,
    joining_date DATE NULL,
    is_active BIT DEFAULT 1
);

-- COURSES
CREATE TABLE COURSES (
    course_id BIGINT PRIMARY KEY,
    course_name VARCHAR(200) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    division_name VARCHAR(50) NULL,
    subjects TEXT NOT NULL,
    duration_months INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    fee_amount DECIMAL(12,2) NOT NULL
);

-- BATCHES
CREATE TABLE BATCHES (
    batch_id BIGINT PRIMARY KEY,
    batch_name VARCHAR(100) NOT NULL,
    course_id BIGINT,
    classroom VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week VARCHAR(50) NOT NULL,
    faculty_id BIGINT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT FK_BATCHES_COURSE FOREIGN KEY (course_id)
        REFERENCES COURSES(course_id),
    CONSTRAINT FK_BATCHES_FACULTY FOREIGN KEY (faculty_id)
        REFERENCES USERS(user_id)
);

-- FEE_MASTER
CREATE TABLE FEE_MASTER (
    fee_id BIGINT PRIMARY KEY,
    course_id BIGINT,
    registration_fee DECIMAL(12,2) NOT NULL,
    tuition_fee DECIMAL(12,2) NOT NULL,
    exam_fee DECIMAL(12,2) NULL,
    material_fee DECIMAL(12,2) NULL,
    total_fee DECIMAL(12,2) NOT NULL,
    CONSTRAINT FK_FEE_MASTER_COURSE FOREIGN KEY (course_id)
        REFERENCES COURSES(course_id)
);

-- EXAM_MASTER
CREATE TABLE EXAM_MASTER (
    exam_id BIGINT PRIMARY KEY,
    exam_name VARCHAR(100) NOT NULL,
    course_id BIGINT,
    total_marks INT NOT NULL,
    exam_date DATE NOT NULL,
    CONSTRAINT FK_EXAM_MASTER_COURSE FOREIGN KEY (course_id)
        REFERENCES COURSES(course_id)
);

-- ASSIGNMENT_MASTER
CREATE TABLE ASSIGNMENT_MASTER (
    assignment_id BIGINT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    batch_id BIGINT,
    due_date DATE NOT NULL,
    CONSTRAINT FK_ASSIGNMENT_MASTER_BATCH FOREIGN KEY (batch_id)
        REFERENCES BATCHES(batch_id)
);

-- SETTINGS
CREATE TABLE SETTINGS (
    setting_id BIGINT PRIMARY KEY,
    setting_name VARCHAR(100) UNIQUE,
    setting_value VARCHAR(500) NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE NOTIFICATIONS (
    notification_id BIGINT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_role VARCHAR(20) NOT NULL
);


-- Transaction Tables 

-- STUDENT_ENROLLMENT
CREATE TABLE STUDENT_ENROLLMENT (
    enrollment_id BIGINT PRIMARY KEY,
    student_id BIGINT,
    course_id BIGINT,
    batch_id BIGINT,
    admission_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    CONSTRAINT FK_ENROLLMENT_STUDENT FOREIGN KEY (student_id)
        REFERENCES USERS(user_id),
    CONSTRAINT FK_ENROLLMENT_COURSE FOREIGN KEY (course_id)
        REFERENCES COURSES(course_id),
    CONSTRAINT FK_ENROLLMENT_BATCH FOREIGN KEY (batch_id)
        REFERENCES BATCHES(batch_id)
);

-- ATTENDANCE
CREATE TABLE ATTENDANCE (
    attendance_id BIGINT PRIMARY KEY,
    attendance_date DATE NOT NULL,
    student_id BIGINT,
    batch_id BIGINT,
    status CHAR(1) NOT NULL,
    CONSTRAINT FK_ATTENDANCE_STUDENT FOREIGN KEY (student_id)
        REFERENCES USERS(user_id),
    CONSTRAINT FK_ATTENDANCE_BATCH FOREIGN KEY (batch_id)
        REFERENCES BATCHES(batch_id)
);

-- FEES
CREATE TABLE FEES (
    fee_transaction_id BIGINT PRIMARY KEY,
    student_id BIGINT,
    course_id BIGINT,
    total_fee DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) NOT NULL,
    balance_amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NULL,
    payment_mode VARCHAR(20) NULL,
    transaction_type VARCHAR(20) NOT NULL,
    CONSTRAINT FK_FEES_STUDENT FOREIGN KEY (student_id)
        REFERENCES USERS(user_id),
    CONSTRAINT FK_FEES_COURSE FOREIGN KEY (course_id)
        REFERENCES COURSES(course_id)
);

-- ASSIGNMENT_SUBMISSION
CREATE TABLE ASSIGNMENT_SUBMISSION (
    submission_id BIGINT PRIMARY KEY,
    assignment_id BIGINT,
    student_id BIGINT,
    submitted_date DATE NOT NULL,
    marks DECIMAL(5,2) NULL,
    CONSTRAINT FK_ASSIGNMENT_SUBMISSION_ASSIGNMENT FOREIGN KEY (assignment_id)
        REFERENCES ASSIGNMENT_MASTER(assignment_id),
    CONSTRAINT FK_ASSIGNMENT_SUBMISSION_STUDENT FOREIGN KEY (student_id)
        REFERENCES USERS(user_id)
);

-- EXAM_RESULTS
CREATE TABLE EXAM_RESULTS (
    result_id BIGINT PRIMARY KEY,
    exam_id BIGINT,
    student_id BIGINT,
    marks_obtained DECIMAL(5,2) NOT NULL,
    grade VARCHAR(10) NULL,
    CONSTRAINT FK_EXAM_RESULTS_EXAM FOREIGN KEY (exam_id)
        REFERENCES EXAM_MASTER(exam_id),
    CONSTRAINT FK_EXAM_RESULTS_STUDENT FOREIGN KEY (student_id)
        REFERENCES USERS(user_id)
);

-- USER_MESSAGES
CREATE TABLE USER_MESSAGES (
    message_id BIGINT PRIMARY KEY,
    sender_id BIGINT,
    receiver_id BIGINT,
    message_text TEXT NOT NULL,
    sent_date DATETIME NOT NULL,
    CONSTRAINT FK_USER_MESSAGES_SENDER FOREIGN KEY (sender_id)
        REFERENCES USERS(user_id),
    CONSTRAINT FK_USER_MESSAGES_RECEIVER FOREIGN KEY (receiver_id)
        REFERENCES USERS(user_id)
);

-- AUDIT_LOG
CREATE TABLE AUDIT_LOG (
    audit_id BIGINT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    action_date DATETIME NOT NULL,
    CONSTRAINT FK_AUDIT_LOG_USER FOREIGN KEY (user_id)
        REFERENCES USERS(user_id)
);