let admin = {
    name: "Austin Roy",
    email: "royomosh@gmail.com",
}

let app = {
    name:"authy-2fa"
}

const config = {
    PORT: process.env.PORT,
    API_KEY: process.env.ACCOUNT_SECURITY_API_KEY,
    SECRET: "SUPERSECRETSECRET",
    admin,
    app
};

module.exports=config

