class DatabaseAPI {

    static async get(url) {

        try {

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            return await response.json();

        } catch (err) {

            return {
                success: false,
                message: err.message
            };

        }

    }

    static async post(url, data) {
       

        try {

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            return await response.json();

        } catch (err) {

            return {
                success: false,
                message: err.message
            };

        }

    }

    static async put(url, data) {

        try {

            const response = await fetch(url, {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)

            });

            return await response.json();

        }

        catch (err) {

            return {

                success: false,
                message: err.message

            };

        }

    }

}