import jwt from "../services/auth.js";

const jwtTokenAuthorization = (req,res,next)=>{

        if(!req.headers.authorization){
            return res.status(401).json({Error : "token not found"});
        }   
        const jwtToken = req.headers.authorization.split(" ")[1];
        if(!jwtToken) {
            return res.status(401).json({error : "token not found"});
        }
        try{
           const user=jwt.verifyToken(jwtToken);
           req.user=user;
           next();
        }
        catch(error){
            // console.log(error);
            res.status(401).json({error : "user not verified"});
        }
}

export default jwtTokenAuthorization;



