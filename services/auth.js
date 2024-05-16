import jwt from "jsonwebtoken";

function generateToken(data){
    const token=jwt.sign(data,process.env.JWT_SECRET_KEY);
    return token;
};

function verifyToken(token){
    const payload=jwt.verify(token,process.env.JWT_SECRET_KEY);
    return payload;
};

export default {generateToken,verifyToken};




