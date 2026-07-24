-- users
Create table users (
    user_id number(19) primary key,
    user_type varchar2(20) not null,
    first_name varchar2(100) not null,
    last_name varchar2(100),
    mobile_no varchar2(15) unique,
    email varchar2(150) unique,
    password_hash varchar2(500) not null,
    gender char(1),
    dob date,
    address varchar2(500),
    qualification varchar2(200),
    joining_date date,
    is_active number(1) default 1 not null
);

-- courses
Create table courses (
    course_id number(19) primary key,
    course_name varchar2(200) not null,
    class_name varchar2(50) not null,
    division_name varchar2(50),
    subjects clob not null,
    duration_months number(10) not null,
    start_date date not null,
    end_date date not null,
    fee_amount number(12,2) not null
);

-- batches
Create table batches (
    batch_id number(19) primary key,
    batch_name varchar2(100) not null,
    course_id number(19),
    classroom varchar2(50) not null,
    start_time varchar2(8) not null,
    end_time varchar2(8) not null,
    days_of_week varchar2(50) not null,
    faculty_id number(19),
    start_date date not null,
    end_date date not null,
    constraint fk_batches_course foreign key (course_id)
        references courses(course_id),
    constraint fk_batches_faculty foreign key (faculty_id)
        references users(user_id)
);

-- fee_master
Create table fee_master (
    fee_id number(19) primary key,
    course_id number(19),
    registration_fee number(12,2) not null,
    tuition_fee number(12,2) not null,
    exam_fee number(12,2),
    material_fee number(12,2),
    total_fee number(12,2) not null,
    constraint fk_fee_master_course foreign key (course_id)
        references courses(course_id)
);

-- exam_master
Create table exam_master (
    exam_id number(19) primary key,
    exam_name varchar2(100) not null,
    course_id number(19),
    total_marks number(10) not null,
    exam_date date not null,
    constraint fk_exam_master_course foreign key (course_id)
        references courses(course_id)
);

-- assignment_master
Create table assignment_master (
    assignment_id number(19) primary key,
    title varchar2(200) not null,
    batch_id number(19),
    due_date date not null,
    constraint fk_assignment_master_batch foreign key (batch_id)
        references batches(batch_id)
);

-- settings
Create table settings (
    setting_id number(19) primary key,
    setting_name varchar2(100) unique,
    setting_value varchar2(500) not null
);

-- notifications
Create table notifications (
    notification_id number(19) primary key,
    title varchar2(200) not null,
    message clob not null,
    target_role varchar2(20) not null
);

-- student_enrollment
Create table student_enrollment (
    enrollment_id number(19) primary key,
    student_id number(19),
    course_id number(19),
    batch_id number(19),
    admission_date date not null,
    status varchar2(20) not null,
    constraint fk_enrollment_student foreign key (student_id)
        references users(user_id),
    constraint fk_enrollment_course foreign key (course_id)
        references courses(course_id),
    constraint fk_enrollment_batch foreign key (batch_id)
        references batches(batch_id)
);

-- attendance
Create table attendance (
    attendance_id number(19) primary key,
    attendance_date date not null,
    student_id number(19),
    batch_id number(19),
    status char(1) not null,
    constraint fk_attendance_student foreign key (student_id)
        references users(user_id),
    constraint fk_attendance_batch foreign key (batch_id)
        references batches(batch_id)
);

-- fees
Create table fees (
    fee_transaction_id number(19) primary key,
    student_id number(19),
    course_id number(19),
    total_fee number(12,2) not null,
    paid_amount number(12,2) not null,
    balance_amount number(12,2) not null,
    payment_date date,
    payment_mode varchar2(20),
    transaction_type varchar2(20) not null,
    constraint fk_fees_student foreign key (student_id)
        references users(user_id),
    constraint fk_fees_course foreign key (course_id)
        references courses(course_id)
);

-- assignment_submission
Create table assignment_submission (
    submission_id number(19) primary key,
    assignment_id number(19),
    student_id number(19),
    submitted_date date not null,
    marks number(5,2),
    constraint fk_assignment_submission_assignment foreign key (assignment_id)
        references assignment_master(assignment_id),
    constraint fk_assignment_submission_student foreign key (student_id)
        references users(user_id)
);

-- exam_results
Create table exam_results (
    result_id number(19) primary key,
    exam_id number(19),
    student_id number(19),
    marks_obtained number(5,2) not null,
    grade varchar2(10),
    constraint fk_exam_results_exam foreign key (exam_id)
        references exam_master(exam_id),
    constraint fk_exam_results_student foreign key (student_id)
        references users(user_id)
);

-- user_messages
Create table user_messages (
    message_id number(19) primary key,
    sender_id number(19),
    receiver_id number(19),
    message_text clob not null,
    sent_date timestamp not null,
    constraint fk_user_messages_sender foreign key (sender_id)
        references users(user_id),
    constraint fk_user_messages_receiver foreign key (receiver_id)
        references users(user_id)
);

-- audit_log
Create table audit_log (
    audit_id number(19) primary key,
    user_id number(19),
    action varchar2(100) not null,
    action_date timestamp not null,
    constraint fk_audit_log_user foreign key (user_id)
        references users(user_id)
);

CREATE TABLE buildings (
    building_id NUMBER(19) PRIMARY KEY,
    building_name VARCHAR2(100) NOT NULL,
    no_of_floors NUMBER(2),
    status VARCHAR2(20) DEFAULT 'Active',
    description VARCHAR2(255)
);

CREATE TABLE rooms (
    room_id NUMBER(19) PRIMARY KEY,
    building_id NUMBER(19) NOT NULL,
    room_code VARCHAR2(20) NOT NULL,
    room_name VARCHAR2(100) NOT NULL,
    floor_no NUMBER(2),
    capacity NUMBER(5),
    status VARCHAR2(20) DEFAULT 'Active',
    description VARCHAR2(255),
    CONSTRAINT fk_rooms_building
        FOREIGN KEY (building_id)
        REFERENCES buildings(building_id),
    CONSTRAINT uk_room_code
        UNIQUE (room_code)
);