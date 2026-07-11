const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const getConnection = require("../config/oracle");
const oracledb = require("oracledb");

function safeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
}

const GENDER_TO_CODE = {
    male: "M",
    female: "F",
    other: "O"
};

const CODE_TO_GENDER = {
    M: "Male",
    F: "Female",
    O: "Other"
};

function genderToCode(value) {

    if (!value)
        return null;

    return GENDER_TO_CODE[value.toLowerCase()] || null;

}

function codeToGender(code) {

    if (!code)
        return null;

    return CODE_TO_GENDER[code.toUpperCase()] || code;

}

router.post("/users", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const passwordHash = await bcrypt.hash(req.body.password, 10);

        const sql = `
        INSERT INTO USERS
        (
            USER_ID,
            USER_TYPE,
            FIRST_NAME,
            LAST_NAME,
            MOBILE_NO,
            EMAIL,
            PASSWORD_HASH,
            GENDER,
            DOB,
            ADDRESS,
            QUALIFICATION,
            JOINING_DATE
        )
        VALUES
        (
            :user_id,
            :user_type,
            :first_name,
            :last_name,
            :mobile_no,
            :email,
            :password_hash,
            :gender,
            TO_DATE(:dob,'YYYY-MM-DD'),
            :address,
            :qualification,
            TO_DATE(:joining_date,'YYYY-MM-DD')
        )
        `;

        await connection.execute(sql, {

            user_id: req.body.user_id,
            user_type: req.body.user_type,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            mobile_no: req.body.mobile_no,
            email: req.body.email,
            password_hash: passwordHash,
            gender: genderToCode(req.body.gender),
            dob: req.body.dob,
            address: req.body.address,
            qualification: req.body.qualification,
            joining_date: req.body.joining_date

        }, {
            autoCommit: true
        });

        res.json({
            success: true,
            message: "User saved successfully."
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.get("/user-types", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                USER_TYPE_ID,
                USER_TYPE
             FROM USER_TYPE
             ORDER BY USER_TYPE_ID`
        );

        const userTypes = result.rows.map(row => ({
            user_type_id: row[0],
            user_type: row[1]
        }));

        res.json(userTypes);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    } finally {

        if (connection)
            await connection.close();

    }

});

router.get("/users/newid", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT NVL(MAX(USER_ID),0)+1
            FROM USERS
        `);

        res.json({
            success: true,
            user_id: result.rows[0][0]
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

// IMPORTANT: this must stay ABOVE "/users/:id" — otherwise
// "/users/newid" would incorrectly match the :id pattern.
// (It already does in this file — keep it that way.)

router.get("/users/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                USER_ID,
                USER_TYPE,
                FIRST_NAME,
                LAST_NAME,
                MOBILE_NO,
                EMAIL,
                GENDER,
                TO_CHAR(DOB,'YYYY-MM-DD'),
                ADDRESS,
                QUALIFICATION,
                TO_CHAR(JOINING_DATE,'YYYY-MM-DD')
             FROM USERS
             WHERE USER_ID = :id`,
            {
                id: req.params.id
            }
        );

        if (result.rows.length === 0) {

            return res.json({
                success: false,
                message: "User not found."
            });

        }

        const row = result.rows[0];

        res.json({

            success: true,

            user_id: row[0],
            user_type: row[1],
            first_name: row[2],
            last_name: row[3],
            mobile_no: row[4],
            email: row[5],
            gender: codeToGender(row[6]),
            dob: row[7],
            address: row[8],
            qualification: row[9],
            joining_date: row[10]

        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.put("/users/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        let sql;
        let binds;

        if (req.body.password && req.body.password.trim() !== "") {

            const passwordHash = await bcrypt.hash(req.body.password, 10);

            sql = `
                UPDATE USERS SET

                    USER_TYPE = :user_type,
                    FIRST_NAME = :first_name,
                    LAST_NAME = :last_name,
                    MOBILE_NO = :mobile_no,
                    EMAIL = :email,
                    PASSWORD_HASH = :password_hash,
                    GENDER = :gender,
                    DOB = TO_DATE(:dob,'YYYY-MM-DD'),
                    ADDRESS = :address,
                    QUALIFICATION = :qualification,
                    JOINING_DATE = TO_DATE(:joining_date,'YYYY-MM-DD')

                WHERE USER_ID = :user_id
            `;

            binds = {

                user_id: req.params.id,
                user_type: req.body.user_type,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                mobile_no: req.body.mobile_no,
                email: req.body.email,
                password_hash: passwordHash,
                gender: genderToCode(req.body.gender),
                dob: req.body.dob,
                address: req.body.address,
                qualification: req.body.qualification,
                joining_date: req.body.joining_date

            };

        }
        else {

            sql = `
                UPDATE USERS SET

                    USER_TYPE = :user_type,
                    FIRST_NAME = :first_name,
                    LAST_NAME = :last_name,
                    MOBILE_NO = :mobile_no,
                    EMAIL = :email,
                    GENDER = :gender,
                    DOB = TO_DATE(:dob,'YYYY-MM-DD'),
                    ADDRESS = :address,
                    QUALIFICATION = :qualification,
                    JOINING_DATE = TO_DATE(:joining_date,'YYYY-MM-DD')

                WHERE USER_ID = :user_id
            `;

            binds = {

                user_id: req.params.id,
                user_type: req.body.user_type,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                mobile_no: req.body.mobile_no,
                email: req.body.email,
                gender: genderToCode(req.body.gender),
                dob: req.body.dob,
                address: req.body.address,
                qualification: req.body.qualification,
                joining_date: req.body.joining_date

            };

        }

        await connection.execute(sql, binds, {

            autoCommit: true

        });

        res.json({

            success: true,
            message: "User updated successfully."

        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

// Moved above module.exports — was previously defined AFTER the export,
// which is unsafe/fragile route placement.
router.get("/users", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                USER_ID,
                FIRST_NAME,
                LAST_NAME
             FROM USERS
             ORDER BY USER_ID`
        );

        const users = result.rows.map(row => ({
            user_id: row[0],
            first_name: row[1],
            last_name: row[2]
        }));

        res.json(users);

    }
    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.get("/assignments/newid", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT NVL(MAX(ASSIGNMENT_ID),0)+1
            FROM ASSIGNMENT_MASTER
        `);

        res.json({
            success: true,
            assignment_id: result.rows[0][0]
        });

    } catch(err){

        res.json({
            success:false,
            message:err.message
        });

    } finally{

        if(connection)
            await connection.close();

    }

});

router.get("/assignments", async (req,res)=>{

    let connection;

    try{

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT
                ASSIGNMENT_ID,
                TITLE,
                BATCH_ID,
                TO_CHAR(DUE_DATE,'YYYY-MM-DD')
            FROM ASSIGNMENT_MASTER
            ORDER BY ASSIGNMENT_ID
        `);

        res.json(result.rows);

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }finally{

        if(connection)
            await connection.close();

    }

});

router.get("/assignments/:id", async(req,res)=>{

    let connection;

    try{

        connection = await getConnection();

        const result = await connection.execute(

            `SELECT
                ASSIGNMENT_ID,
                TITLE,
                BATCH_ID,
                TO_CHAR(DUE_DATE,'YYYY-MM-DD')
            FROM ASSIGNMENT_MASTER
            WHERE ASSIGNMENT_ID=:id`,

            {
                id:req.params.id
            }

        );

        if(result.rows.length==0){

            return res.json({
                success:false
            });

        }

        const row=result.rows[0];

        res.json({

            success:true,

            assignment_id:row[0],
            title:row[1],
            batch_id:row[2],
            due_date:row[3]

        });

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }finally{

        if(connection)
            await connection.close();

    }

});

router.post("/assignments", async(req,res)=>{

    let connection;

    try{

        connection=await getConnection();

        await connection.execute(

            `INSERT INTO ASSIGNMENT_MASTER
            (
                ASSIGNMENT_ID,
                TITLE,
                BATCH_ID,
                DUE_DATE
            )
            VALUES
            (
                :assignment_id,
                :title,
                :batch_id,
                TO_DATE(:due_date,'YYYY-MM-DD')
            )`,

            req.body,

            {
                autoCommit:true
            }

        );

        res.json({

            success:true,
            message:"Assignment Saved Successfully"

        });

    }catch(err){

        res.status(500).json({

            success:false,
            message:err.message

        });

    }finally{

        if(connection)
            await connection.close();

    }

});

router.put("/assignments/:id", async(req,res)=>{

    let connection;

    try{

        connection=await getConnection();

        await connection.execute(

            `UPDATE ASSIGNMENT_MASTER
             SET

                TITLE=:title,
                BATCH_ID=:batch_id,
                DUE_DATE=TO_DATE(:due_date,'YYYY-MM-DD')

             WHERE ASSIGNMENT_ID=:assignment_id`,

             req.body,

             {
                autoCommit:true
             }

        );

        res.json({

            success:true,
            message:"Assignment Updated Successfully"

        });

    }catch(err){

        res.status(500).json({

            success:false,
            message:err.message

        });

    }finally{

        if(connection)
            await connection.close();

    }

});

router.get("/batches", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(

            `SELECT
                BATCH_ID,
                BATCH_NAME
             FROM BATCHES
             ORDER BY BATCH_ID`

        );

        res.json(result.rows);

    }
    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});
 
router.get("/assignments/newid", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT NVL(MAX(ASSIGNMENT_ID),0)+1
            FROM ASSIGNMENT_MASTER
        `);

        res.json({
            success: true,
            assignment_id: result.rows[0][0]
        });

    } catch(err){

        res.json({
            success:false,
            message:err.message
        });

    } finally{

        if(connection)
            await connection.close();

    }

});

router.get("/assignments", async (req,res)=>{

    let connection;

    try{

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT
                ASSIGNMENT_ID,
                TITLE,
                BATCH_ID,
                TO_CHAR(DUE_DATE,'YYYY-MM-DD')
            FROM ASSIGNMENT_MASTER
            ORDER BY ASSIGNMENT_ID
        `);

        res.json(result.rows);

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }finally{

        if(connection)
            await connection.close();

    }

});

router.get("/assignments/:id", async(req,res)=>{

    let connection;

    try{

        connection = await getConnection();

        const result = await connection.execute(

            `SELECT
                ASSIGNMENT_ID,
                TITLE,
                BATCH_ID,
                TO_CHAR(DUE_DATE,'YYYY-MM-DD')
            FROM ASSIGNMENT_MASTER
            WHERE ASSIGNMENT_ID=:id`,

            {
                id:req.params.id
            }

        );

        if(result.rows.length==0){

            return res.json({
                success:false
            });

        }

        const row=result.rows[0];

        res.json({

            success:true,

            assignment_id:row[0],
            title:row[1],
            batch_id:row[2],
            due_date:row[3]

        });

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }finally{

        if(connection)
            await connection.close();

    }

});

router.post("/assignments", async(req,res)=>{

    let connection;

    try{

        connection=await getConnection();

        await connection.execute(

            `INSERT INTO ASSIGNMENT_MASTER
            (
                ASSIGNMENT_ID,
                TITLE,
                BATCH_ID,
                DUE_DATE
            )
            VALUES
            (
                :assignment_id,
                :title,
                :batch_id,
                TO_DATE(:due_date,'YYYY-MM-DD')
            )`,

            req.body,

            {
                autoCommit:true
            }

        );

        res.json({

            success:true,
            message:"Assignment Saved Successfully"

        });

    }catch(err){

        res.status(500).json({

            success:false,
            message:err.message

        });

    }finally{

        if(connection)
            await connection.close();

    }

});

router.put("/assignments/:id", async(req,res)=>{

    let connection;

    try{

        connection=await getConnection();

        await connection.execute(

            `UPDATE ASSIGNMENT_MASTER
             SET

                TITLE=:title,
                BATCH_ID=:batch_id,
                DUE_DATE=TO_DATE(:due_date,'YYYY-MM-DD')

             WHERE ASSIGNMENT_ID=:assignment_id`,

             req.body,

             {
                autoCommit:true
             }

        );

        res.json({

            success:true,
            message:"Assignment Updated Successfully"

        });

    }catch(err){

        res.status(500).json({

            success:false,
            message:err.message

        });

    }finally{

        if(connection)
            await connection.close();

    }

});

// =======================
// Get All Batches
// =======================

router.get("/batches", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(

            `SELECT
                BATCH_ID,
                BATCH_NAME
             FROM BATCHES
             ORDER BY BATCH_ID`

        );

        res.json(result.rows);

    }
    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});


router.get("/courses", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT
                COURSE_ID,
                COURSE_NAME
            FROM COURSES
            ORDER BY COURSE_NAME
        `);

        const courses = result.rows.map(row => ({

            course_id: row[0],
            course_name: row[1]

        }));

        res.json(courses);

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

    finally {

        if (connection)
            await connection.close();

    }

});


router.get("/faculty", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`

            SELECT

                USER_ID,

                FIRST_NAME || ' ' || LAST_NAME

            FROM USERS

            WHERE UPPER(USER_TYPE)='FACULTY'

            ORDER BY FIRST_NAME

        `);

        const faculty = result.rows.map(row => ({

            user_id: row[0],

            faculty_name: row[1]

        }));

        res.json(faculty);

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

    finally{

        if(connection)
            await connection.close();

    }

});


router.get("/batches", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`

            SELECT

                BATCH_ID,
                BATCH_NAME,
                COURSE_ID,
                CLASSROOM,
                START_TIME,
                END_TIME,
                DAYS_OF_WEEK,
                FACULTY_ID,
                TO_CHAR(START_DATE,'YYYY-MM-DD'),
                TO_CHAR(END_DATE,'YYYY-MM-DD')

            FROM BATCHES

            ORDER BY BATCH_ID

        `);

        const batches = result.rows.map(row => ({

            batch_id: row[0],
            batch_name: row[1],
            course_id: row[2],
            classroom: row[3],
            start_time: row[4],
            end_time: row[5],
            days_of_week: row[6],
            faculty_id: row[7],
            start_date: row[8],
            end_date: row[9]

        }));

        res.json(batches);

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

    finally {

        if (connection)
            await connection.close();

    }

});

router.post("/fee-master", async (req, res) => {

    let connection;

    try {
        connection = await getConnection();

        const sql = `
            INSERT INTO FEE_MASTER
            (
                FEE_ID,
                COURSE_ID,
                REGISTRATION_FEE,
                TUITION_FEE,
                EXAM_FEE,
                MATERIAL_FEE,
                TOTAL_FEE
            )
            VALUES
            (
                (SELECT NVL(MAX(FEE_ID),0)+1 FROM FEE_MASTER),
                :course_id,
                :registration_fee,
                :tuition_fee,
                :exam_fee,
                :material_fee,
                :total_fee
            )
            RETURNING FEE_ID INTO :new_id
        `;

        const binds = {
            course_id: safeNumber(req.body.course_id),
            registration_fee: safeNumber(req.body.registration_fee),
            tuition_fee: safeNumber(req.body.tuition_fee),
            exam_fee: safeNumber(req.body.exam_fee),
            material_fee: safeNumber(req.body.material_fee),
            total_fee: safeNumber(req.body.total_fee),
            new_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        };

        const result = await connection.execute(sql, binds, { autoCommit: true });

        res.json({
            success: true,
            message: "Fee record saved successfully.",
            fee_id: result.outBinds.new_id[0]
        });

    } catch (err) {
        console.error("POST ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    } finally {
        if (connection) await connection.close();
    }
});




router.get("/fee-master/newid", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT NVL(MAX(FEE_ID),0)+1
            FROM FEE_MASTER
        `);

        res.json({
            success: true,
            fee_id: result.rows[0][0]
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});


router.get("/fee-master/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `
            SELECT
                FEE_ID,
                COURSE_ID,
                REGISTRATION_FEE,
                TUITION_FEE,
                EXAM_FEE,
                MATERIAL_FEE,
                TOTAL_FEE
            FROM FEE_MASTER
            WHERE FEE_ID = :id
            `,
            {
                id: req.params.id
            }
        );

        if (result.rows.length === 0) {

            return res.json({
                success: false,
                message: "Fee record not found."
            });

        }

        const row = result.rows[0];

        res.json({
            success: true,
            data: {
                fee_id: row[0],
                course_id: row[1],
                registration_fee: row[2],
                tuition_fee: row[3],
                exam_fee: row[4],
                material_fee: row[5],
                total_fee: row[6]
            }
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    } finally {

        if (connection)
            await connection.close();

    }

});

router.put("/fee-master/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const sql = `
            UPDATE FEE_MASTER
            SET
                COURSE_ID = :course_id,
                REGISTRATION_FEE = :registration_fee,
                TUITION_FEE = :tuition_fee,
                EXAM_FEE = :exam_fee,
                MATERIAL_FEE = :material_fee,
                TOTAL_FEE = :total_fee
            WHERE FEE_ID = :fee_id
        `;

        const binds = {
            fee_id: safeNumber(req.params.id),
            course_id: safeNumber(req.body.course_id),
            registration_fee: safeNumber(req.body.registration_fee),
            tuition_fee: safeNumber(req.body.tuition_fee),
            exam_fee: safeNumber(req.body.exam_fee),
            material_fee: safeNumber(req.body.material_fee),
            total_fee: safeNumber(req.body.total_fee)
        };

        console.log("FINAL BINDS:", binds); // debug

        await connection.execute(sql, binds, { autoCommit: true });

        res.json({
            success: true,
            message: "Fee record updated successfully."
        });

    } catch (err) {
        console.error("PUT ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    } finally {
        if (connection) await connection.close();
    }
});

router.delete("/fee-master/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        await connection.execute(
            `DELETE FROM FEE_MASTER WHERE FEE_ID = :id`,
            {
                id: req.params.id
            },
            {
                autoCommit: true
            }
        );

        res.json({
            success: true,
            message: "Fee record deleted successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    } finally {

        if (connection)
            await connection.close();

    }

});


router.get("/batches/new-id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT NVL(MAX(BATCH_ID), 0) + 1
            FROM BATCHES
        `);

        res.json({
            success: true,
            batch_id: result.rows[0][0]
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});



router.get("/batches/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`

            SELECT

                BATCH_ID,
                BATCH_NAME,
                COURSE_ID,
                CLASSROOM,
                START_TIME,
                END_TIME,
                DAYS_OF_WEEK,
                FACULTY_ID,
                TO_CHAR(START_DATE,'YYYY-MM-DD'),
                TO_CHAR(END_DATE,'YYYY-MM-DD')

            FROM BATCHES

            WHERE BATCH_ID = :id

        `,
        {
            id: req.params.id
        });

        if (!result.rows.length) {

            return res.json({

                success: false,
                message: "Batch not found."

            });

        }

        const row = result.rows[0];

        res.json({

            success: true,

            batch_id: row[0],
            batch_name: row[1],
            course_id: row[2],
            classroom: row[3],
            start_time: row[4],
            end_time: row[5],
            days_of_week: row[6],
            faculty_id: row[7],
            start_date: row[8],
            end_date: row[9]

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

    finally {

        if (connection)
            await connection.close();

    }

});





router.post("/batches", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const sql = `

            INSERT INTO BATCHES
                (
                    BATCH_ID,
                    BATCH_NAME,
                    COURSE_ID,
                    CLASSROOM,
                    START_TIME,
                    END_TIME,
                    DAYS_OF_WEEK,
                    FACULTY_ID,
                     START_DATE,
                    END_DATE
                )

            VALUES
                (
                    :batch_id,
                    :batch_name,
                    :course_id,
                    :classroom,
                    :start_time,
                    :end_time,
                    :days_of_week,
                    :faculty_id,
                    TO_DATE(:start_date,'YYYY-MM-DD'),
                    TO_DATE(:end_date,'YYYY-MM-DD')
                )

            `;

        await connection.execute(sql,

            {

                batch_id: Number(req.body.batch_id),

                batch_name: req.body.batch_name,

                course_id: Number(req.body.course_id),

                classroom: req.body.classroom,

                start_time: req.body.start_time,

                end_time: req.body.end_time,

                days_of_week: req.body.days_of_week,

                faculty_id:
                    req.body.faculty_id === "" ||
                    req.body.faculty_id == null
                    ? null
                    : Number(req.body.faculty_id),

                    start_date: req.body.start_date,

                    end_date: req.body.end_date

            },

            {

                autoCommit: true

            }

        );

        res.json({

            success: true,
            message: "Batch saved successfully."

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

    finally {

        if (connection)
            await connection.close();

    }

});



router.put("/batches/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const sql = `

            UPDATE BATCHES

            SET

                BATCH_NAME = :batch_name,
                COURSE_ID = :course_id,
                CLASSROOM = :classroom,
                START_TIME = :start_time,
                END_TIME = :end_time,
                DAYS_OF_WEEK = :days_of_week,
                FACULTY_ID = :faculty_id,
                START_DATE = TO_DATE(:start_date,'YYYY-MM-DD'),
                END_DATE = TO_DATE(:end_date,'YYYY-MM-DD')

            WHERE BATCH_ID = :batch_id

        `;

        await connection.execute(

            sql,

            {

                batch_id: Number(req.params.id),

                batch_name: req.body.batch_name,

                course_id: Number(req.body.course_id),

                classroom: req.body.classroom,

                start_time: req.body.start_time,

                end_time: req.body.end_time,

                days_of_week: req.body.days_of_week,

                faculty_id:
                req.body.faculty_id === "" ||
                req.body.faculty_id == null
                 ? null
                    : Number(req.body.faculty_id),

                start_date: req.body.start_date,

                end_date: req.body.end_date

            },

            {

                autoCommit: true

            }

        );

        res.json({

            success: true,
            message: "Batch updated successfully."

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

    finally {

        if (connection)
            await connection.close();

    }

});

router.get("/courses/newid", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT NVL(MAX(COURSE_ID),0)+1
            FROM COURSES
        `);

        res.json({
            success: true,
            course_id: result.rows[0][0]
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.get("/courses/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                COURSE_ID,
                COURSE_NAME,
                CLASS_NAME,
                DIVISION_NAME,
                SUBJECTS,
                DURATION_MONTHS,
                TO_CHAR(START_DATE,'YYYY-MM-DD'),
                TO_CHAR(END_DATE,'YYYY-MM-DD'),
                FEE_AMOUNT
             FROM COURSES
             WHERE COURSE_ID = :id`,
            {
                id: req.params.id
            },
            {
                fetchInfo: {
                    "SUBJECTS": { type: oracledb.STRING }
                }
            }
        );

        if (result.rows.length === 0) {

            return res.json({
                success: false,
                message: "Course not found."
            });

        }

        const row = result.rows[0];

        res.json({

            success: true,

            course_id: row[0],
            course_name: row[1],
            class_name: row[2],
            division_name: row[3],
            subjects: row[4],
            duration_months: row[5],
            start_date: row[6],
            end_date: row[7],
            fee_amount: row[8]

        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.get("/courses", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                COURSE_ID,
                COURSE_NAME
             FROM COURSES
             ORDER BY COURSE_ID`
        );

        const courses = result.rows.map(row => ({
            course_id: row[0],
            course_name: row[1]
        }));

        res.json(courses);

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.post("/courses", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const sql = `
        INSERT INTO COURSES
        (
            COURSE_ID,
            COURSE_NAME,
            CLASS_NAME,
            DIVISION_NAME,
            SUBJECTS,
            DURATION_MONTHS,
            START_DATE,
            END_DATE,
            FEE_AMOUNT
        )
        VALUES
        (
            :course_id,
            :course_name,
            :class_name,
            :division_name,
            :subjects,
            :duration_months,
            TO_DATE(:start_date,'YYYY-MM-DD'),
            TO_DATE(:end_date,'YYYY-MM-DD'),
            :fee_amount
        )
        `;

        await connection.execute(sql, {

            course_id: req.body.course_id,
            course_name: req.body.course_name,
            class_name: req.body.class_name,
            division_name: req.body.division_name,
            subjects: req.body.subjects,
            duration_months: req.body.duration_months,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            fee_amount: req.body.fee_amount

        }, {
            autoCommit: true
        });

        res.json({
            success: true,
            message: "Course saved successfully."
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.put("/courses/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const sql = `
            UPDATE COURSES SET

                COURSE_NAME = :course_name,
                CLASS_NAME = :class_name,
                DIVISION_NAME = :division_name,
                SUBJECTS = :subjects,
                DURATION_MONTHS = :duration_months,
                START_DATE = TO_DATE(:start_date,'YYYY-MM-DD'),
                END_DATE = TO_DATE(:end_date,'YYYY-MM-DD'),
                FEE_AMOUNT = :fee_amount

            WHERE COURSE_ID = :course_id
        `;

        const binds = {

            course_id: req.params.id,
            course_name: req.body.course_name,
            class_name: req.body.class_name,
            division_name: req.body.division_name,
            subjects: req.body.subjects,
            duration_months: req.body.duration_months,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            fee_amount: req.body.fee_amount

        };

        await connection.execute(sql, binds, {
            autoCommit: true
        });

        res.json({
            success: true,
            message: "Course updated successfully."
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.get("/notifications/newid", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(`
            SELECT NVL(MAX(NOTIFICATION_ID),0)+1
            FROM NOTIFICATIONS
        `);

        res.json({
            success: true,
            notification_id: result.rows[0][0]
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.get("/notifications", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                NOTIFICATION_ID,
                TITLE,
                TARGET_ROLE
             FROM NOTIFICATIONS
             ORDER BY NOTIFICATION_ID`
        );

        const notifications = result.rows.map(row => ({
            notification_id: row[0],
            title: row[1],
            target_role: row[2]
        }));

        res.json(notifications);

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.get("/notifications/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                NOTIFICATION_ID,
                TITLE,
                MESSAGE,
                TARGET_ROLE
             FROM NOTIFICATIONS
             WHERE NOTIFICATION_ID = :id`,
            {
                id: req.params.id
            },
            {
                fetchInfo: {
                    "MESSAGE": { type: oracledb.STRING }
                }
            }
        );

        if (result.rows.length === 0) {

            return res.json({
                success: false,
                message: "Notification not found."
            });

        }

        const row = result.rows[0];

        res.json({

            success: true,

            notification_id: row[0],
            title: row[1],
            message: row[2],
            target_role: row[3]

        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.post("/notifications", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const sql = `
        INSERT INTO NOTIFICATIONS
        (
            NOTIFICATION_ID,
            TITLE,
            MESSAGE,
            TARGET_ROLE
        )
        VALUES
        (
            :notification_id,
            :title,
            :message,
            :target_role
        )
        `;

        await connection.execute(sql, {

            notification_id: req.body.notification_id,
            title: req.body.title,
            message: req.body.message,
            target_role: req.body.target_role

        }, {
            autoCommit: true
        });

        res.json({
            success: true,
            message: "Notification saved successfully."
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.put("/notifications/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const sql = `
            UPDATE NOTIFICATIONS SET

                TITLE = :title,
                MESSAGE = :message,
                TARGET_ROLE = :target_role

            WHERE NOTIFICATION_ID = :notification_id
        `;

        const binds = {

            notification_id: req.params.id,
            title: req.body.title,
            message: req.body.message,
            target_role: req.body.target_role

        };

        await connection.execute(sql, binds, {
            autoCommit: true
        });

        res.json({
            success: true,
            message: "Notification updated successfully."
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

module.exports = router;
